-- Plano 02 - utilities admin: hot paths, RPC de plantao e seeds iniciais.

create index if not exists idx_alerts_active_partial
  on public.service_alerts(city_id, end_at)
  where active;

create unique index if not exists idx_garbage_unique_slot
  on public.garbage_schedules(city_id, district_id, type, day_of_week);

create unique index if not exists idx_contacts_unique_name_phone
  on public.emergency_contacts(city_id, category, name, phone);

create unique index if not exists idx_pharmacies_unique_city_name
  on public.pharmacies(city_id, name);

create unique index if not exists idx_pharmacy_shifts_unique_slot
  on public.pharmacy_shifts(pharmacy_id, start_date, end_date, shift_type);

create unique index if not exists idx_health_facilities_unique_city_name
  on public.health_facilities(city_id, name);

create unique index if not exists idx_health_campaigns_unique_city_title_start
  on public.health_campaigns(city_id, title, coalesce(start_at, 'epoch'::timestamptz));

create or replace function public.current_pharmacy_on_duty(
  p_city_id uuid,
  p_date date default current_date
)
returns setof public.pharmacies
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.pharmacies p
  join public.pharmacy_shifts ps on ps.pharmacy_id = p.id
  where p.city_id = p_city_id
    and p.active
    and ps.start_date <= p_date
    and ps.end_date >= p_date
  order by
    case ps.shift_type when 'plantao_24h' then 0 else 1 end,
    p.name;
$$;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
seed_districts(slug, name, zone, display_order) as (
  values
    ('centro', 'Centro', 'centro', 10),
    ('vila-nova', 'Vila Nova', 'urbana', 20),
    ('porto-rico', 'Porto Rico', 'urbana', 30),
    ('varjao', 'Varjao', 'rural', 40),
    ('itaci', 'Itaci', 'distrito', 50)
),
upserted_districts as (
  insert into public.districts (city_id, slug, name, zone, display_order)
  select carmo.id, sd.slug, sd.name, sd.zone, sd.display_order
  from carmo cross join seed_districts sd
  on conflict (city_id, slug) do update
  set name = excluded.name,
      zone = excluded.zone,
      display_order = excluded.display_order
  returning id, city_id, slug
),
all_districts as (
  select d.id, d.city_id, d.slug
  from public.districts d
  join carmo on carmo.id = d.city_id
)
insert into public.garbage_schedules (city_id, district_id, type, day_of_week, start_time, end_time, notes, active)
select d.city_id, d.id, slot.type::public.garbage_kind, slot.day_of_week, slot.start_time::time, slot.end_time::time, slot.notes, true
from all_districts d
join (
  values
    ('centro', 'common', 1, '07:00', '10:00', 'Coleta domiciliar no periodo da manha.'),
    ('centro', 'common', 3, '07:00', '10:00', 'Coleta domiciliar no periodo da manha.'),
    ('centro', 'common', 5, '07:00', '10:00', 'Coleta domiciliar no periodo da manha.'),
    ('centro', 'recyclable', 4, '08:00', '12:00', 'Separar reciclaveis limpos.'),
    ('vila-nova', 'common', 2, '07:00', '11:00', 'Coleta domiciliar.'),
    ('vila-nova', 'common', 5, '07:00', '11:00', 'Coleta domiciliar.'),
    ('vila-nova', 'recyclable', 4, '13:00', '16:00', 'Separar reciclaveis limpos.'),
    ('porto-rico', 'common', 2, '08:00', '12:00', 'Coleta domiciliar.'),
    ('porto-rico', 'recyclable', 5, '13:00', '16:00', 'Separar reciclaveis limpos.'),
    ('varjao', 'common', 3, '08:00', '12:00', 'Rota rural sujeita a alteracao em dias de chuva.'),
    ('itaci', 'common', 6, '08:00', '12:00', 'Rota distrital semanal.')
) as slot(district_slug, type, day_of_week, start_time, end_time, notes)
  on slot.district_slug = d.slug
on conflict (city_id, district_id, type, day_of_week) do update
set start_time = excluded.start_time,
    end_time = excluded.end_time,
    notes = excluded.notes,
    active = excluded.active;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.emergency_contacts (city_id, category, name, phone, whatsapp, short_dial, description, hours, display_order, active)
select carmo.id, c.category, c.name, c.phone, c.whatsapp, c.short_dial, c.description, c.hours, c.display_order, true
from carmo
cross join (
  values
    ('emergencia', 'Policia Militar', '190', null, '190', 'Emergencia policial.', '24h', 10),
    ('emergencia', 'SAMU', '192', null, '192', 'Emergencia medica.', '24h', 20),
    ('emergencia', 'Bombeiros', '193', null, '193', 'Incendio e resgate.', '24h', 30),
    ('emergencia', 'Defesa Civil', '199', null, '199', 'Risco, alagamento e desastres.', '24h', 40),
    ('utilidade', 'Cemig', '116', null, '116', 'Energia eletrica.', '24h', 50),
    ('utilidade', 'Copasa', '115', null, '115', 'Agua e esgoto.', '24h', 60),
    ('prefeitura', 'Prefeitura Municipal', '(35) 3561-2000', null, null, 'Atendimento geral.', 'Seg a sex, horario comercial', 70),
    ('saude', 'Secretaria de Saude', '(35) 3561-2000', null, null, 'Informacoes de saude municipal.', 'Seg a sex, horario comercial', 80),
    ('saude', 'Vigilancia Sanitaria', '(35) 3561-2000', null, null, 'Denuncias e orientacoes sanitarias.', 'Seg a sex, horario comercial', 90),
    ('utilidade', 'Conselho Tutelar', '(35) 3561-2000', null, null, 'Protecao de criancas e adolescentes.', 'Plantao local', 100)
) as c(category, name, phone, whatsapp, short_dial, description, hours, display_order)
on conflict (city_id, category, name, phone) do update
set whatsapp = excluded.whatsapp,
    short_dial = excluded.short_dial,
    description = excluded.description,
    hours = excluded.hours,
    display_order = excluded.display_order,
    active = excluded.active;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
seed_pharmacies(name, address, phone, whatsapp, is_24h, lat, lng) as (
  values
    ('Farmacia Central', 'Rua Camilo Aschar, Centro', '(35) 3561-1000', null, false, null::double precision, null::double precision),
    ('Drogaria Carmelitana', 'Avenida Jose Evaristo Santana, Centro', '(35) 3561-1001', null, false, null::double precision, null::double precision),
    ('Farmacia Popular Carmo', 'Rua Coronel Antonio Jacinto, Centro', '(35) 3561-1002', null, false, null::double precision, null::double precision)
),
upserted_pharmacies as (
  insert into public.pharmacies (city_id, name, address, phone, whatsapp, is_24h, lat, lng, active)
  select carmo.id, p.name, p.address, p.phone, p.whatsapp, p.is_24h, p.lat, p.lng, true
  from carmo cross join seed_pharmacies p
  on conflict (city_id, name) do update
  set address = excluded.address,
      phone = excluded.phone,
      whatsapp = excluded.whatsapp,
      is_24h = excluded.is_24h,
      lat = excluded.lat,
      lng = excluded.lng,
      active = excluded.active
  returning id, name
)
insert into public.pharmacy_shifts (pharmacy_id, start_date, end_date, shift_type, notes)
select p.id, current_date, current_date + 6, 'plantao_24h', 'Seed inicial; substituir pela escala oficial.'
from upserted_pharmacies p
where p.name = 'Farmacia Central'
on conflict (pharmacy_id, start_date, end_date, shift_type) do update
set notes = excluded.notes;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
centro as (
  select d.id, d.city_id from public.districts d join carmo on carmo.id = d.city_id where d.slug = 'centro'
)
insert into public.health_facilities (city_id, district_id, name, type, address, phone, hours, services, active)
select centro.city_id, centro.id, 'UBS Centro', 'ubs', 'Centro, Carmo do Rio Claro', '(35) 3561-2000', 'Seg a sex, 07:00 as 17:00', '["clinica-geral","vacinacao","enfermagem"]'::jsonb, true
from centro
on conflict (city_id, name) do update
set district_id = excluded.district_id,
    type = excluded.type,
    address = excluded.address,
    phone = excluded.phone,
    hours = excluded.hours,
    services = excluded.services,
    active = excluded.active;
