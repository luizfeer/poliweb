-- ============================================================================
-- Delivery — notificação de novo pedido via TRIGGER no banco.
-- Plano: .claude/plans/06-delivery-pedidos-nativos-bot-whatsapp.md §3.4
--
-- Decisão (2026-05-30): o pedido é gravado direto no Supabase (RPC create_order
-- chamada pelo browser client), SEM passar pelo Vercel. Para que a notificação ao
-- operador no WhatsApp aconteça independentemente do canal de entrada (web, app,
-- futuras integrações), ela é enfileirada por trigger AFTER INSERT em orders.
-- O wa-outbound-worker (cron) drena a fila — nada síncrono, nada trava.
-- ============================================================================

-- Formata número como texto monetário pt-BR simples ("76,90"); valores pequenos,
-- sem separador de milhar (suficiente para a mensagem do WhatsApp).
create or replace function public.brl_text(p_value numeric)
returns text language sql immutable as $$
  select replace(to_char(coalesce(p_value, 0), 'FM999990D00'), '.', ',');
$$;

create or replace function public.enqueue_order_notifications()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_channel_id uuid;
  v_biz_name   text;
  v_type_label text;
  v_body       text;
  v_op         record;
  v_to         text;
begin
  select name into v_biz_name from businesses where id = new.business_id;

  -- Canal transacional da cidade (1 por cidade). Sem canal → nada a enviar.
  select id into v_channel_id
    from wa_channels
    where city_id = new.city_id and kind = 'transactional' and enabled
    limit 1;
  if v_channel_id is null then
    return new;
  end if;

  v_type_label := case new.order_type
    when 'delivery' then '🛵 Delivery'
    when 'pickup'   then '📦 Retirada'
    else '🍽️ Mesa' end;

  v_body :=
    '🛒 *Novo pedido #' || coalesce(new.code, '') || '* — ' || coalesce(v_biz_name, '') ||
    E'\n' || v_type_label ||
    E'\nTotal: R$ ' || public.brl_text(new.total) ||
    E'\n\nResponda nos botões ou use */lista*.';

  -- Push/in-app ao comerciante quando o app está fechado: TODO (follow-up).
  -- Requer função SECURITY DEFINER dedicada que replique o fanout de
  -- create_notification (inapp + push 'pending') sem depender de auth.uid(),
  -- já que este trigger roda via service role. Por ora o comerciante é avisado
  -- pelo WhatsApp (abaixo) e pela fila realtime no painel/app aberto.

  for v_op in
    select phone_number
      from business_wa_operators
      where business_id = new.business_id and active and verified_at is not null
  loop
    v_to := regexp_replace(v_op.phone_number, '\D', '', 'g');

    if public.wa_session_open(v_channel_id, v_to) then
      -- Janela de 24h aberta → botões interativos
      insert into wa_outbound_queue
        (channel_id, to_number, kind, related_entity_type, related_entity_id, dedup_key, interactive)
      values
        (v_channel_id, v_to, 'interactive', 'order', new.id, 'order_new:' || new.id || ':' || v_to,
         jsonb_build_object(
           'type', 'button',
           'body', jsonb_build_object('text', v_body),
           'action', jsonb_build_object('buttons', jsonb_build_array(
             jsonb_build_object('type', 'reply', 'reply',
               jsonb_build_object('id', 'ord_accept:' || new.id, 'title', '✅ Aceitar')),
             jsonb_build_object('type', 'reply', 'reply',
               jsonb_build_object('id', 'ord_reject:' || new.id, 'title', '❌ Recusar')),
             jsonb_build_object('type', 'reply', 'reply',
               jsonb_build_object('id', 'menu:list', 'title', '📋 Ver pedidos'))
           ))
         ))
      on conflict (dedup_key) do nothing;
    else
      -- Fora da janela → template aprovado na Meta (operador responde p/ abrir janela)
      insert into wa_outbound_queue
        (channel_id, to_number, kind, template_name, template_language, template_variables,
         related_entity_type, related_entity_id, dedup_key)
      values
        (v_channel_id, v_to, 'template', 'novo_pedido', 'pt_BR',
         jsonb_build_object('1', coalesce(v_biz_name, ''), '2', coalesce(new.code, ''),
                            '3', 'R$ ' || public.brl_text(new.total)),
         'order', new.id, 'order_new:' || new.id || ':' || v_to)
      on conflict (dedup_key) do nothing;
    end if;
  end loop;

  return new;
end;
$$;

create trigger trg_orders_notify
  after insert on orders
  for each row execute function public.enqueue_order_notifications();
