with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
seed_businesses(slug, name, short_description, description, address, phone, whatsapp, attributes) as (
  values
    ('padaria-do-joao', 'Padaria do Joao', 'Padaria e confeitaria no Centro.', 'Paes, lanches e encomendas de bolos para Carmo do Rio Claro.', 'Centro, Carmo do Rio Claro', '(35) 3561-1101', null, '{"pix":true,"cartao":true,"delivery":false}'::jsonb),
    ('salao-bela-carmo', 'Salao Bela Carmo', 'Salao de beleza e estetica.', 'Cortes, escova, manicure e atendimento com hora marcada.', 'Centro, Carmo do Rio Claro', '(35) 3561-1102', null, '{"pix":true,"cartao":true,"acessivel":true}'::jsonb),
    ('mercado-central-carmo', 'Mercado Central Carmo', 'Mercado de bairro com itens do dia a dia.', 'Mercearia, hortifruti e produtos de limpeza.', 'Centro, Carmo do Rio Claro', '(35) 3561-1103', null, '{"pix":true,"cartao":true,"delivery":true}'::jsonb),
    ('oficina-sao-cristovao', 'Oficina Sao Cristovao', 'Mecanica leve e troca de oleo.', 'Servicos automotivos, revisao basica e atendimento por ordem de chegada.', 'Bela Vista, Carmo do Rio Claro', '(35) 3561-1104', null, '{"pix":true,"cartao":false,"parking":true}'::jsonb),
    ('cartorio-registro-civil-carmo', 'Cartorio de Registro Civil', 'Servicos cartoriais essenciais.', 'Atendimento para certidoes e registros civis.', 'Centro, Carmo do Rio Claro', '(35) 3561-1105', null, '{"pix":true,"cartao":false,"acessivel":true}'::jsonb)
)
insert into public.businesses (
  city_id,
  slug,
  name,
  short_description,
  description,
  address,
  phone,
  whatsapp,
  attributes,
  status,
  verified,
  featured
)
select
  carmo.id,
  b.slug,
  b.name,
  b.short_description,
  b.description,
  b.address,
  b.phone,
  b.whatsapp,
  b.attributes,
  'published'::public.entity_status,
  true,
  false
from carmo
cross join seed_businesses b
on conflict (city_id, slug) do update
set name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    address = excluded.address,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    attributes = excluded.attributes,
    status = excluded.status,
    verified = excluded.verified;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.health_facilities (
  city_id,
  name,
  type,
  address,
  phone,
  hours_legacy_text,
  services,
  active
)
select
  carmo.id,
  'UPA Carmo 24h',
  'upa',
  'Centro, Carmo do Rio Claro',
  '(35) 3561-2000',
  '24h',
  '["urgencia","emergencia","observacao"]'::jsonb,
  true
from carmo
on conflict (city_id, name) do update
set type = excluded.type,
    address = excluded.address,
    phone = excluded.phone,
    hours_legacy_text = excluded.hours_legacy_text,
    services = excluded.services,
    active = excluded.active;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
targets as (
  select 'business'::text as entity_type, id, city_id, slug
  from public.businesses
  where city_id = (select id from carmo)
    and slug in (
      'padaria-do-joao',
      'salao-bela-carmo',
      'mercado-central-carmo',
      'oficina-sao-cristovao',
      'cartorio-registro-civil-carmo'
    )
  union all
  select 'health_facility'::text, h.id, h.city_id, 'upa-carmo-24h'
  from public.health_facilities h
  where h.city_id = (select id from carmo)
    and h.name = 'UPA Carmo 24h'
),
weekly_hours(slug, weekday, starts_at, ends_at) as (
  values
    ('padaria-do-joao', 1, '08:00'::time, '18:00'::time),
    ('padaria-do-joao', 2, '08:00'::time, '18:00'::time),
    ('padaria-do-joao', 3, '08:00'::time, '18:00'::time),
    ('padaria-do-joao', 4, '08:00'::time, '18:00'::time),
    ('padaria-do-joao', 5, '08:00'::time, '18:00'::time),
    ('padaria-do-joao', 6, '08:00'::time, '12:00'::time),
    ('salao-bela-carmo', 1, '08:00'::time, '18:00'::time),
    ('salao-bela-carmo', 2, '08:00'::time, '18:00'::time),
    ('salao-bela-carmo', 3, '08:00'::time, '18:00'::time),
    ('salao-bela-carmo', 4, '08:00'::time, '18:00'::time),
    ('salao-bela-carmo', 5, '08:00'::time, '18:00'::time),
    ('salao-bela-carmo', 6, '08:00'::time, '12:00'::time),
    ('mercado-central-carmo', 1, '08:00'::time, '18:00'::time),
    ('mercado-central-carmo', 2, '08:00'::time, '18:00'::time),
    ('mercado-central-carmo', 3, '08:00'::time, '18:00'::time),
    ('mercado-central-carmo', 4, '08:00'::time, '18:00'::time),
    ('mercado-central-carmo', 5, '08:00'::time, '18:00'::time),
    ('mercado-central-carmo', 6, '08:00'::time, '12:00'::time),
    ('oficina-sao-cristovao', 1, '08:00'::time, '18:00'::time),
    ('oficina-sao-cristovao', 2, '08:00'::time, '18:00'::time),
    ('oficina-sao-cristovao', 3, '08:00'::time, '18:00'::time),
    ('oficina-sao-cristovao', 4, '08:00'::time, '18:00'::time),
    ('oficina-sao-cristovao', 5, '08:00'::time, '18:00'::time),
    ('oficina-sao-cristovao', 6, '08:00'::time, '12:00'::time),
    ('cartorio-registro-civil-carmo', 1, '09:00'::time, '16:00'::time),
    ('cartorio-registro-civil-carmo', 2, '09:00'::time, '16:00'::time),
    ('cartorio-registro-civil-carmo', 3, '09:00'::time, '16:00'::time),
    ('cartorio-registro-civil-carmo', 4, '09:00'::time, '16:00'::time),
    ('cartorio-registro-civil-carmo', 5, '09:00'::time, '16:00'::time),
    ('upa-carmo-24h', 0, '00:00'::time, '23:59'::time),
    ('upa-carmo-24h', 1, '00:00'::time, '23:59'::time),
    ('upa-carmo-24h', 2, '00:00'::time, '23:59'::time),
    ('upa-carmo-24h', 3, '00:00'::time, '23:59'::time),
    ('upa-carmo-24h', 4, '00:00'::time, '23:59'::time),
    ('upa-carmo-24h', 5, '00:00'::time, '23:59'::time),
    ('upa-carmo-24h', 6, '00:00'::time, '23:59'::time)
)
insert into public.entity_hours (
  entity_type,
  entity_id,
  city_id,
  weekday,
  starts_at,
  ends_at,
  source_status,
  active
)
select
  t.entity_type,
  t.id,
  t.city_id,
  h.weekday,
  h.starts_at,
  h.ends_at,
  'confirmed',
  true
from weekly_hours h
join targets t on t.slug = h.slug
on conflict do nothing;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
targets as (
  select 'business'::text as entity_type, id, city_id, slug
  from public.businesses
  where city_id = (select id from carmo)
    and slug in ('padaria-do-joao', 'salao-bela-carmo', 'mercado-central-carmo', 'oficina-sao-cristovao', 'cartorio-registro-civil-carmo')
  union all
  select 'health_facility'::text, h.id, h.city_id, 'upa-carmo-24h'
  from public.health_facilities h
  where h.city_id = (select id from carmo)
    and h.name = 'UPA Carmo 24h'
),
services(slug, name, description, price_cents, duration_min, requirements, sort_order) as (
  values
    ('cartorio-registro-civil-carmo', '2a via certidao nascimento', 'Emissao de segunda via de certidao de nascimento.', 5000, null, 'RG do solicitante', 10),
    ('cartorio-registro-civil-carmo', '2a via certidao casamento', 'Emissao de segunda via de certidao de casamento.', 5000, null, 'RG do solicitante', 20),
    ('cartorio-registro-civil-carmo', 'Registro civil', 'Orientacao para registro civil.', null, null, 'Documento oficial e dados dos envolvidos', 30),
    ('padaria-do-joao', 'Encomenda de bolo', 'Bolos sob encomenda para aniversarios e eventos.', null, null, 'Pedir com antecedencia', 10),
    ('padaria-do-joao', 'Cafe da manha', 'Paes, salgados e bebidas quentes.', null, null, null, 20),
    ('salao-bela-carmo', 'Corte feminino', 'Corte com finalizacao simples.', 4000, 40, null, 10),
    ('salao-bela-carmo', 'Manicure', 'Servico de manicure tradicional.', 3000, 50, null, 20),
    ('mercado-central-carmo', 'Entrega de compras', 'Entrega local sob consulta.', null, null, 'Confirmar bairro atendido', 10),
    ('oficina-sao-cristovao', 'Troca de oleo', 'Troca de oleo e verificacao basica.', null, 30, null, 10),
    ('upa-carmo-24h', 'Atendimento de urgencia', 'Atendimento inicial para urgencias e emergencias.', null, null, 'Documento com foto e cartao SUS se tiver', 10)
)
insert into public.entity_services (
  entity_type,
  entity_id,
  city_id,
  name,
  description,
  price_cents,
  duration_min,
  requirements,
  sort_order,
  active
)
select
  t.entity_type,
  t.id,
  t.city_id,
  s.name,
  s.description,
  s.price_cents,
  s.duration_min,
  s.requirements,
  s.sort_order,
  true
from services s
join targets t on t.slug = s.slug
on conflict (entity_type, entity_id, name) do update
set description = excluded.description,
    price_cents = excluded.price_cents,
    duration_min = excluded.duration_min,
    requirements = excluded.requirements,
    sort_order = excluded.sort_order,
    active = excluded.active;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
targets as (
  select 'business'::text as entity_type, id, city_id, slug
  from public.businesses
  where city_id = (select id from carmo)
    and slug in ('padaria-do-joao', 'salao-bela-carmo', 'cartorio-registro-civil-carmo')
  union all
  select 'health_facility'::text, h.id, h.city_id, 'upa-carmo-24h'
  from public.health_facilities h
  where h.city_id = (select id from carmo)
    and h.name = 'UPA Carmo 24h'
),
faqs(slug, question, answer, sort_order) as (
  values
    ('padaria-do-joao', 'A padaria aceita Pix?', 'Sim, aceita Pix e cartao.', 10),
    ('padaria-do-joao', 'Faz entrega?', 'No cadastro atual, delivery esta marcado como nao.', 20),
    ('salao-bela-carmo', 'Precisa marcar horario?', 'E recomendado marcar horario pelo telefone antes de ir.', 10),
    ('cartorio-registro-civil-carmo', 'Quais documentos para 2a via de certidao?', 'Leve RG do solicitante. Outros documentos podem ser solicitados conforme o caso.', 10),
    ('cartorio-registro-civil-carmo', 'Aceita Pix?', 'Sim, o cadastro informa aceite de Pix.', 20),
    ('upa-carmo-24h', 'A UPA atende pelo SUS?', 'Sim, atendimento publico de urgencia; leve documento com foto e cartao SUS se tiver.', 10)
)
insert into public.entity_faqs (
  entity_type,
  entity_id,
  city_id,
  question,
  answer,
  sort_order,
  active
)
select
  t.entity_type,
  t.id,
  t.city_id,
  f.question,
  f.answer,
  f.sort_order,
  true
from faqs f
join targets t on t.slug = f.slug
on conflict (entity_type, entity_id, question) do update
set answer = excluded.answer,
    sort_order = excluded.sort_order,
    active = excluded.active;
