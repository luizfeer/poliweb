-- ============================================================================
-- Delivery Pro — assinatura recorrente via Asaas.
-- Plano: .claude/plans/06-delivery-pedidos-nativos-bot-whatsapp.md
--
-- Reusa a infra de pagamentos existente: cliente Asaas (lib/asaas), ledger
-- (portal_payments) e o roteador de webhook (app/api/asaas/webhook).
-- Aqui só guardamos o vínculo negócio <-> assinatura e o preço do plano.
--
-- Cobrança = assinatura FIXA mensal (PIX/boleto recorrente). O portal continua
-- NÃO processando o pagamento do PEDIDO (PIX direto / maquininha do motoboy).
-- ============================================================================

-- Preço do Pro reusa a tabela business_plans (catálogo de planos do portal).
insert into public.business_plans (slug, name, description, monthly_value_cents, features, highlight, display_order, status)
values (
  'delivery-pro',
  'Delivery Pro',
  'Pedidos nativos no app e no painel, bot de WhatsApp com botões, fila ao vivo e relatórios de venda.',
  3900,
  '["Pedidos pelo app e painel","Bot de WhatsApp com botões","Fila de pedidos ao vivo","Relatórios de faturamento e itens","1 mês de teste grátis"]'::jsonb,
  true,
  10,
  'active'
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_value_cents = excluded.monthly_value_cents,
  features = excluded.features,
  status = excluded.status,
  updated_at = now();

-- Vínculo da assinatura Pro no próprio negócio.
alter table public.businesses
  add column if not exists delivery_asaas_customer_id      text,
  add column if not exists delivery_asaas_subscription_id  text,
  add column if not exists delivery_subscription_status    text,  -- pending|active|overdue|cancelled
  add column if not exists delivery_plan_current_period_end timestamptz;

create index if not exists idx_businesses_delivery_subscription
  on public.businesses (delivery_asaas_subscription_id)
  where delivery_asaas_subscription_id is not null;

-- Aplica o resultado de um pagamento Asaas ao plano de delivery do negócio.
-- Chamada pelo webhook (service role). Idempotente. Casa por subscription_id ou
-- pelo externalReference 'delivery_pro:<business_id>'.
--   paid    -> delivery_plan = 'pro', status active, estende período +35 dias
--   overdue -> status overdue (mantém pro até o período vencer)
--   cancel  -> volta para free
create or replace function public.apply_delivery_pro_payment(
  p_business_id uuid,
  p_subscription_id text,
  p_status text,           -- 'paid' | 'overdue' | 'cancelled'
  p_period_end timestamptz default null
) returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status = 'paid' then
    update businesses set
      delivery_plan = 'pro',
      delivery_subscription_status = 'active',
      delivery_asaas_subscription_id = coalesce(p_subscription_id, delivery_asaas_subscription_id),
      delivery_plan_current_period_end = coalesce(p_period_end, now() + interval '35 days')
    where id = p_business_id;
  elsif p_status = 'overdue' then
    update businesses set delivery_subscription_status = 'overdue'
    where id = p_business_id;
  elsif p_status = 'cancelled' then
    update businesses set
      delivery_plan = 'free',
      delivery_subscription_status = 'cancelled'
    where id = p_business_id;
  end if;
end; $$;
