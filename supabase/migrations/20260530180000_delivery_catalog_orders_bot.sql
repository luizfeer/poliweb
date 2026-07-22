-- ============================================================================
-- Delivery Fase 2 — Catálogo + Pedidos nativos + Presença online + Bot WhatsApp
-- Plano: .claude/plans/06-delivery-pedidos-nativos-bot-whatsapp.md
--
-- Reusa o hub WhatsApp (20260518150000_whatsapp.sql): wa_outbound_queue,
-- wa_inbound_queue, wa_sessions (janela 24h). Sem Go — tudo no Postgres + edge.
-- ============================================================================

-- ── 1. Campos de delivery em businesses (Fase 1, idempotente) ────────────────

alter table businesses
  add column if not exists catalog_type            text,
  add column if not exists delivery_enabled         boolean not null default false,
  add column if not exists pickup_enabled           boolean not null default false,
  add column if not exists table_service_enabled    boolean not null default false,
  add column if not exists delivery_fee             numeric(10,2),
  add column if not exists delivery_min_order       numeric(10,2),
  add column if not exists delivery_time_min        int,
  add column if not exists pickup_time_min          int,
  add column if not exists delivery_radius_km       numeric(5,2),
  add column if not exists delivery_zones           jsonb not null default '[]'::jsonb,
  add column if not exists delivery_hours           jsonb not null default '{}'::jsonb,
  add column if not exists order_instructions       text,
  add column if not exists pix_key                  text,
  add column if not exists accepts_card_on_delivery boolean not null default false;

-- ── 2. Catálogo ──────────────────────────────────────────────────────────────

create table if not exists business_catalogs (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  name         text not null,
  description  text,
  catalog_type text not null default 'food_menu',  -- food_menu | product_catalog
  active       boolean not null default true,
  display_order int not null default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
create index if not exists idx_business_catalogs_business on business_catalogs(business_id);

create table if not exists catalog_sections (
  id          uuid primary key default gen_random_uuid(),
  catalog_id  uuid not null references business_catalogs(id) on delete cascade,
  name        text not null,
  description text,
  cover_url   text,
  display_order int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz default now()
);
create index if not exists idx_catalog_sections_catalog on catalog_sections(catalog_id, active);

create table if not exists catalog_items (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid not null references catalog_sections(id) on delete cascade,
  business_id   uuid not null references businesses(id) on delete cascade,  -- denormalizado p/ RLS
  name          text not null,
  description   text,
  price         numeric(10,2) not null,
  promotional_price numeric(10,2),
  promo_valid_until timestamptz,
  photo_url     text,
  serves        text,
  prep_time_min int,
  calories      int,
  tags          text[] not null default '{}',
  available     boolean not null default true,
  stock_qty     int,
  sku           text,
  display_order int not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
create index if not exists idx_catalog_items_section on catalog_items(section_id, available);
create index if not exists idx_catalog_items_business on catalog_items(business_id);

create table if not exists catalog_item_option_groups (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references catalog_items(id) on delete cascade,
  name        text not null,
  description text,
  min_choices int not null default 0,
  max_choices int not null default 1,
  display_order int not null default 0,
  created_at  timestamptz default now()
);
create index if not exists idx_option_groups_item on catalog_item_option_groups(item_id);

create table if not exists catalog_item_option_values (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references catalog_item_option_groups(id) on delete cascade,
  name        text not null,
  price_add   numeric(10,2) not null default 0,
  available   boolean not null default true,
  display_order int not null default 0,
  created_at  timestamptz default now()
);
create index if not exists idx_option_values_group on catalog_item_option_values(group_id);

create trigger trg_business_catalogs_updated before update on business_catalogs
  for each row execute function public.set_updated_at();
create trigger trg_catalog_items_updated before update on catalog_items
  for each row execute function public.set_updated_at();

-- ── 3. Presença / "loja online" ──────────────────────────────────────────────

create table if not exists business_delivery_status (
  business_id     uuid primary key references businesses(id) on delete cascade,
  is_online       boolean not null default false,
  online_since    timestamptz,
  auto_offline_at timestamptz,            -- expira sozinho (fim do expediente / +N horas)
  busy_mode       boolean not null default false,   -- aceita pedidos com tempo maior
  pause_reason    text,
  last_changed_by uuid references profiles(id) on delete set null,
  source          text,                   -- whatsapp | panel | app | auto
  updated_at      timestamptz default now()
);
create index if not exists idx_delivery_status_online on business_delivery_status(is_online) where is_online;
create index if not exists idx_delivery_status_autooff on business_delivery_status(auto_offline_at)
  where auto_offline_at is not null and is_online;

create trigger trg_delivery_status_updated before update on business_delivery_status
  for each row execute function public.set_updated_at();

-- ── 4. Operadores de WhatsApp por negócio ────────────────────────────────────

create table if not exists business_wa_operators (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses(id) on delete cascade,
  phone_number text not null,             -- E.164 só dígitos, ex '5535999998888'
  display_name text,
  role         text not null default 'operator',  -- owner | operator
  active       boolean not null default true,
  verified_at  timestamptz,
  created_at   timestamptz default now(),
  unique (business_id, phone_number)
);
create index if not exists idx_wa_operators_phone on business_wa_operators(phone_number)
  where active and verified_at is not null;

-- ── 5. Pedidos ───────────────────────────────────────────────────────────────

do $$ begin
  create type order_status as enum
    ('pending','confirmed','preparing','ready','dispatched','delivered','cancelled','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_kind as enum ('delivery','pickup','table');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_payment_method as enum ('pix','card_on_delivery','cash','whatsapp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_payment_status as enum ('pending','paid','refunded');
exception when duplicate_object then null; end $$;

create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses(id) on delete restrict,
  city_id        uuid not null references cities(id) on delete restrict,
  customer_id    uuid references profiles(id) on delete set null,   -- null = guest
  code           text,                                              -- número curto diário (#7)
  channel        text not null default 'web',                       -- web | app | whatsapp
  status         order_status not null default 'pending',
  order_type     order_kind not null,
  total_items    numeric(10,2) not null default 0,
  delivery_fee   numeric(10,2) not null default 0,
  discount       numeric(10,2) not null default 0,
  total          numeric(10,2) not null default 0,
  payment_method order_payment_method,
  payment_status order_payment_status not null default 'pending',
  change_for     numeric(10,2),
  delivery_address jsonb,
  delivery_notes text,
  estimated_time_min int,
  customer_name  text,
  customer_phone text,
  notes          text,
  merchant_notes text,
  confirmed_at   timestamptz,
  dispatched_at  timestamptz,
  delivered_at   timestamptz,
  cancelled_at   timestamptz,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists idx_orders_business_status on orders(business_id, status, created_at desc);
create index if not exists idx_orders_customer on orders(customer_id, created_at desc);
create index if not exists idx_orders_city on orders(city_id, created_at desc);

create trigger trg_orders_updated before update on orders
  for each row execute function public.set_updated_at();

create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references orders(id) on delete cascade,
  item_id     uuid references catalog_items(id) on delete set null,
  name        text not null,
  unit_price  numeric(10,2) not null,
  qty         int not null default 1,
  options_snapshot jsonb not null default '[]'::jsonb,  -- [{group, value, price_add}]
  subtotal    numeric(10,2) not null,
  notes       text,
  created_at  timestamptz default now()
);
create index if not exists idx_order_items_order on order_items(order_id);

create table if not exists order_status_history (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references orders(id) on delete cascade,
  status     order_status not null,
  changed_by uuid references profiles(id) on delete set null,
  note       text,
  created_at timestamptz default now()
);
create index if not exists idx_order_history_order on order_status_history(order_id, created_at);

-- Contador diário por negócio (gera o code curto e amigável)
create table if not exists order_daily_counters (
  business_id uuid not null references businesses(id) on delete cascade,
  day         date not null,
  seq         int not null default 0,
  primary key (business_id, day)
);

-- ── 6. Extensão do hub WhatsApp ──────────────────────────────────────────────

alter table wa_inbound_queue  add column if not exists consumer text not null default 'assistant';
create index if not exists idx_wa_inbound_consumer_pending on wa_inbound_queue(consumer, created_at)
  where status = 'pending';

alter table wa_outbound_queue add column if not exists interactive jsonb;

-- ── 7. RLS ───────────────────────────────────────────────────────────────────

alter table business_catalogs            enable row level security;
alter table catalog_sections             enable row level security;
alter table catalog_items                enable row level security;
alter table catalog_item_option_groups   enable row level security;
alter table catalog_item_option_values   enable row level security;
alter table business_delivery_status     enable row level security;
alter table business_wa_operators        enable row level security;
alter table orders                       enable row level security;
alter table order_items                  enable row level security;
alter table order_status_history         enable row level security;
alter table order_daily_counters         enable row level security;

-- Catálogo: leitura pública de ativos; escrita do dono
create policy "catalogs_public_read" on business_catalogs for select using (active or public.manages_business(business_id));
create policy "catalogs_owner_write" on business_catalogs for all
  using (public.manages_business(business_id)) with check (public.manages_business(business_id));

create policy "sections_public_read" on catalog_sections for select
  using (active or public.manages_business((select c.business_id from business_catalogs c where c.id = catalog_id)));
create policy "sections_owner_write" on catalog_sections for all
  using (public.manages_business((select c.business_id from business_catalogs c where c.id = catalog_id)))
  with check (public.manages_business((select c.business_id from business_catalogs c where c.id = catalog_id)));

create policy "items_public_read" on catalog_items for select
  using (available or public.manages_business(business_id));
create policy "items_owner_write" on catalog_items for all
  using (public.manages_business(business_id)) with check (public.manages_business(business_id));

create policy "option_groups_public_read" on catalog_item_option_groups for select
  using (public.manages_business((select i.business_id from catalog_items i where i.id = item_id)) or true);
create policy "option_groups_owner_write" on catalog_item_option_groups for all
  using (public.manages_business((select i.business_id from catalog_items i where i.id = item_id)))
  with check (public.manages_business((select i.business_id from catalog_items i where i.id = item_id)));

create policy "option_values_public_read" on catalog_item_option_values for select using (available or true);
create policy "option_values_owner_write" on catalog_item_option_values for all
  using (public.manages_business((
    select i.business_id from catalog_item_option_groups g
    join catalog_items i on i.id = g.item_id where g.id = group_id)))
  with check (public.manages_business((
    select i.business_id from catalog_item_option_groups g
    join catalog_items i on i.id = g.item_id where g.id = group_id)));

-- Presença: leitura pública (a lista precisa); escrita do dono
create policy "delivery_status_public_read" on business_delivery_status for select using (true);
create policy "delivery_status_owner_write" on business_delivery_status for all
  using (public.manages_business(business_id)) with check (public.manages_business(business_id));

-- Operadores: gerido pelo dono/city_admin
create policy "wa_operators_owner_all" on business_wa_operators for all
  using (public.manages_business(business_id)) with check (public.manages_business(business_id));

-- Pedidos: cliente vê os seus; comerciante vê os do negócio. Insert só via RPC (definer).
create policy "orders_self_read" on orders for select
  using (customer_id = auth.uid() or public.manages_business(business_id));
create policy "orders_merchant_update" on orders for update
  using (public.manages_business(business_id)) with check (public.manages_business(business_id));

create policy "order_items_read" on order_items for select
  using (exists (select 1 from orders o where o.id = order_id
    and (o.customer_id = auth.uid() or public.manages_business(o.business_id))));

create policy "order_history_read" on order_status_history for select
  using (exists (select 1 from orders o where o.id = order_id
    and (o.customer_id = auth.uid() or public.manages_business(o.business_id))));

-- Counters: sem acesso direto (só via funções definer)
create policy "order_counters_none" on order_daily_counters for select using (false);

-- ── 8. Funções de domínio ────────────────────────────────────────────────────

-- Próximo code diário (#1, #2, ...) por negócio
create or replace function public.next_order_code(p_business_id uuid)
returns int language plpgsql security definer set search_path = public as $$
declare v_seq int;
begin
  insert into order_daily_counters (business_id, day, seq)
  values (p_business_id, current_date, 1)
  on conflict (business_id, day) do update set seq = order_daily_counters.seq + 1
  returning seq into v_seq;
  return v_seq;
end; $$;

-- Toggle de presença (painel/app). Bot usa service role direto.
create or replace function public.set_business_online(
  p_business_id uuid,
  p_online boolean,
  p_auto_offline timestamptz default null,
  p_source text default 'panel'
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.manages_business(p_business_id) then
    raise exception 'forbidden';
  end if;
  insert into business_delivery_status (business_id, is_online, online_since, auto_offline_at, last_changed_by, source)
  values (p_business_id, p_online, case when p_online then now() end, p_auto_offline, auth.uid(), p_source)
  on conflict (business_id) do update set
    is_online = excluded.is_online,
    online_since = case when excluded.is_online and not business_delivery_status.is_online
                        then now() else business_delivery_status.online_since end,
    auto_offline_at = excluded.auto_offline_at,
    last_changed_by = excluded.last_changed_by,
    source = excluded.source;
end; $$;

-- Cria pedido: recalcula preço do catálogo no servidor (anti-tampering).
-- p_items: [{ "catalog_item_id": uuid, "qty": int, "notes": text,
--             "options": [{ "group_id": uuid, "value_id": uuid }] }]
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

  select is_online into v_presence from business_delivery_status where business_id = p_business_id;
  if v_presence.is_online is distinct from true then raise exception 'store_offline'; end if;

  if p_order_type = 'delivery' and not coalesce(v_biz.delivery_enabled, false) then
    raise exception 'delivery_disabled'; end if;
  if p_order_type = 'pickup' and not coalesce(v_biz.pickup_enabled, false) then
    raise exception 'pickup_disabled'; end if;

  v_order_id := gen_random_uuid();

  -- itens
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

-- Avança/atualiza status do pedido + trilha + notifica cliente.
-- p_actor: quando chamado pelo bot (service role) passa o profile do operador (ou null).
create or replace function public.update_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null,
  p_actor uuid default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_order record;
  v_actor uuid := coalesce(p_actor, auth.uid());
  v_new order_status := p_status::order_status;
begin
  select * into v_order from orders where id = p_order_id;
  if not found then raise exception 'order_not_found'; end if;

  -- Autorização: quem gerencia o negócio, ou service role (auth.uid() null = bot/cron)
  if auth.uid() is not null and not public.manages_business(v_order.business_id) then
    raise exception 'forbidden';
  end if;

  update orders set
    status = v_new,
    confirmed_at  = case when v_new = 'confirmed'  and confirmed_at  is null then now() else confirmed_at  end,
    dispatched_at = case when v_new = 'dispatched' and dispatched_at is null then now() else dispatched_at end,
    delivered_at  = case when v_new = 'delivered'  and delivered_at  is null then now() else delivered_at  end,
    cancelled_at  = case when v_new in ('cancelled','rejected') and cancelled_at is null then now() else cancelled_at end,
    merchant_notes = case when p_note is not null then p_note else merchant_notes end
  where id = p_order_id;

  insert into order_status_history (order_id, status, changed_by, note)
  values (p_order_id, v_new, v_actor, p_note);

  -- A notificação ao cliente (push/in-app/WhatsApp) é enfileirada pelo chamador
  -- (Server Action do painel ou edge `delivery-bot`), não aqui: a função
  -- public.create_notification exige auth.uid() e recipient = self/admin, o que
  -- não cobre merchant→cliente nem chamadas via service role (bot). Ver plano 06 §3.4.
end; $$;

grant execute on function public.update_order_status(uuid,text,text,uuid) to authenticated;
