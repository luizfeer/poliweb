-- ============================================================================
-- Delivery — Planos (free | pro) + período de teste de 30 dias.
-- Plano: .claude/plans/06-delivery-pedidos-nativos-bot-whatsapp.md
--
-- Modelo de monetização (decisão 2026-05-31):
--   FREE  → cardápio digital + "mais pedido"; cliente pede pelo WhatsApp (wa.me).
--           NÃO grava pedido no banco (sem fila, sem bot, sem relatórios).
--   PRO   → pedidos nativos (create_order) + bot WhatsApp + app + relatórios.
--           1 mês de teste grátis. Pagamento da assinatura: Asaas (follow-up).
--
-- Cobrança é assinatura FIXA mensal (cidade não usa %); o portal NÃO processa o
-- pagamento do pedido — segue PIX direto / maquininha do motoboy.
-- ============================================================================

alter table businesses
  add column if not exists delivery_plan            text not null default 'free',  -- free | pro
  add column if not exists delivery_trial_started_at timestamptz,
  add column if not exists delivery_trial_ends_at    timestamptz;

-- É "pro" se o plano é pro OU se o teste ainda está válido.
create or replace function public.delivery_is_pro(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from businesses b
    where b.id = p_business_id
      and (b.delivery_plan = 'pro' or coalesce(b.delivery_trial_ends_at, 'epoch'::timestamptz) > now())
  );
$$;

-- Ativa o teste de 30 dias (só uma vez por negócio). Só quem gerencia.
create or replace function public.start_delivery_trial(p_business_id uuid)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare v_ends timestamptz;
begin
  if not public.manages_business(p_business_id) then
    raise exception 'forbidden';
  end if;

  select delivery_trial_started_at into v_ends from businesses where id = p_business_id;
  if v_ends is not null then
    raise exception 'trial_already_used';
  end if;

  update businesses
    set delivery_trial_started_at = now(),
        delivery_trial_ends_at = now() + interval '30 days'
    where id = p_business_id
    returning delivery_trial_ends_at into v_ends;

  return v_ends;
end; $$;

grant execute on function public.delivery_is_pro(uuid) to anon, authenticated;
grant execute on function public.start_delivery_trial(uuid) to authenticated;

-- ── Gate de plano no create_order ────────────────────────────────────────────
-- Recria a função adicionando a checagem de plano logo após achar o negócio.
-- Pedido nativo só existe no Pro/trial; o free usa o fluxo wa.me no cliente.

create or replace function public.create_order(
  p_business_id uuid,
  p_order_type text,
  p_items jsonb,
  p_payment_method text default null,
  p_customer_name text default null,
  p_customer_phone text default null,
  p_delivery_address jsonb default null,
  p_delivery_notes text default null,
  p_notes text default null,
  p_change_for numeric default null,
  p_channel text default 'web'
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_biz record;
  v_presence record;
  v_order_id uuid;
  v_code int;
  v_items_total numeric(10,2) := 0;
  v_delivery_fee numeric(10,2) := 0;
  v_total numeric(10,2);
  v_item jsonb;
  v_dbitem record;
  v_unit numeric(10,2);
  v_opt jsonb;
  v_optval record;
  v_opt_add numeric(10,2);
  v_opts_snapshot jsonb;
  v_subtotal numeric(10,2);
  v_qty int;
begin
  if p_order_type not in ('delivery','pickup','table') then
    raise exception 'invalid_order_type';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  select id, city_id, delivery_enabled, pickup_enabled, table_service_enabled,
         delivery_fee, delivery_min_order
    into v_biz from businesses where id = p_business_id;
  if not found then raise exception 'business_not_found'; end if;

  -- Pedido nativo é recurso Pro. Free usa o fluxo wa.me no cliente.
  if not public.delivery_is_pro(p_business_id) then raise exception 'plan_required'; end if;

  select is_online into v_presence from business_delivery_status where business_id = p_business_id;
  if v_presence.is_online is distinct from true then raise exception 'store_offline'; end if;

  if p_order_type = 'delivery' and not coalesce(v_biz.delivery_enabled, false) then
    raise exception 'delivery_disabled'; end if;
  if p_order_type = 'pickup' and not coalesce(v_biz.pickup_enabled, false) then
    raise exception 'pickup_disabled'; end if;

  v_order_id := gen_random_uuid();

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'qty')::int, 1), 1);
    select id, name, price, promotional_price, available
      into v_dbitem from catalog_items
      where id = (v_item->>'catalog_item_id')::uuid and business_id = p_business_id;
    if not found then raise exception 'item_not_found:%', v_item->>'catalog_item_id'; end if;
    if not v_dbitem.available then raise exception 'item_unavailable:%', v_dbitem.name; end if;

    v_unit := coalesce(v_dbitem.promotional_price, v_dbitem.price);
    v_opt_add := 0;
    v_opts_snapshot := '[]'::jsonb;

    if jsonb_typeof(v_item->'options') = 'array' then
      for v_opt in select * from jsonb_array_elements(v_item->'options') loop
        select v.id, v.name, v.price_add, g.name as group_name
          into v_optval from catalog_item_option_values v
          join catalog_item_option_groups g on g.id = v.group_id
          where v.id = (v_opt->>'value_id')::uuid and g.item_id = v_dbitem.id and v.available;
        if not found then raise exception 'option_invalid'; end if;
        v_opt_add := v_opt_add + v_optval.price_add;
        v_opts_snapshot := v_opts_snapshot || jsonb_build_object(
          'group', v_optval.group_name, 'value', v_optval.name, 'price_add', v_optval.price_add);
      end loop;
    end if;

    v_subtotal := (v_unit + v_opt_add) * v_qty;
    v_items_total := v_items_total + v_subtotal;

    insert into order_items (order_id, item_id, name, unit_price, qty, options_snapshot, subtotal, notes)
    values (v_order_id, v_dbitem.id, v_dbitem.name, v_unit + v_opt_add, v_qty, v_opts_snapshot,
            v_subtotal, nullif(trim(coalesce(v_item->>'notes','')), ''));
  end loop;

  if p_order_type = 'delivery' then
    v_delivery_fee := coalesce(v_biz.delivery_fee, 0);
    if v_biz.delivery_min_order is not null and v_items_total < v_biz.delivery_min_order then
      raise exception 'below_min_order';
    end if;
  end if;

  v_total := v_items_total + v_delivery_fee;
  v_code := public.next_order_code(p_business_id);

  insert into orders (
    id, business_id, city_id, customer_id, code, channel, status, order_type,
    total_items, delivery_fee, total, payment_method, change_for,
    delivery_address, delivery_notes, customer_name, customer_phone, notes
  ) values (
    v_order_id, p_business_id, v_biz.city_id, auth.uid(), v_code::text, p_channel, 'pending', p_order_type::order_kind,
    v_items_total, v_delivery_fee, v_total,
    nullif(p_payment_method,'')::order_payment_method, p_change_for,
    p_delivery_address, p_delivery_notes, p_customer_name, p_customer_phone, p_notes
  );

  insert into order_status_history (order_id, status, changed_by, note)
  values (v_order_id, 'pending', auth.uid(), 'pedido criado via ' || p_channel);

  return jsonb_build_object(
    'order_id', v_order_id, 'code', v_code, 'status', 'pending',
    'items_total', v_items_total, 'delivery_fee', v_delivery_fee, 'total', v_total);
end; $$;

grant execute on function public.create_order(uuid,text,jsonb,text,text,text,jsonb,text,text,numeric,text) to anon, authenticated;
