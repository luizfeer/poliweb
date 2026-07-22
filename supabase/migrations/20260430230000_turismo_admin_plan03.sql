-- Plano 03 - Turismo admin: slugs, featured pago, busca pesca, storage e seeds.

alter table public.accommodations
  add column if not exists featured_until timestamptz;

alter table public.restaurants
  add column if not exists featured_until timestamptz;

create or replace function public.slugify_ptbr(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    translate(lower(coalesce(input, '')),
      'áàâãäåéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÅÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
      'aaaaaaeeeeiiiiooooouuuucnaaaaaaeeeeiiiiooooouuuucn'
    ),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

create or replace function public.set_tourism_slug()
returns trigger
language plpgsql
as $$
declare
  base_slug text;
  source_name text;
  candidate text;
  i int := 1;
  exists_slug boolean;
begin
  if new.slug is not null and btrim(new.slug) <> '' then
    new.slug := public.slugify_ptbr(new.slug);
    return new;
  end if;

  source_name := case tg_table_name
    when 'fishing_guides' then new.full_name
    when 'tour_packages' then new.title
    else new.name
  end;
  base_slug := public.slugify_ptbr(coalesce(source_name, 'turismo'));
  if base_slug = '' then
    base_slug := 'turismo';
  end if;

  candidate := base_slug;
  loop
    execute format('select exists(select 1 from public.%I where city_id = $1 and slug = $2 and id is distinct from $3)', tg_table_name)
      into exists_slug
      using new.city_id, candidate, new.id;
    exit when not exists_slug;
    i := i + 1;
    candidate := base_slug || '-' || i::text;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists tg_tourism_slug_unique on public.accommodations;
create trigger tg_tourism_slug_unique
before insert or update of slug, name on public.accommodations
for each row execute function public.set_tourism_slug();

drop trigger if exists tg_tourism_slug_unique on public.restaurants;
create trigger tg_tourism_slug_unique
before insert or update of slug, name on public.restaurants
for each row execute function public.set_tourism_slug();

drop trigger if exists tg_tourism_slug_unique on public.attractions;
create trigger tg_tourism_slug_unique
before insert or update of slug, name on public.attractions
for each row execute function public.set_tourism_slug();

drop trigger if exists tg_tourism_slug_unique on public.fishing_spots;
create trigger tg_tourism_slug_unique
before insert or update of slug, name on public.fishing_spots
for each row execute function public.set_tourism_slug();

drop trigger if exists tg_tourism_slug_unique on public.fishing_guides;
create trigger tg_tourism_slug_unique
before insert or update of slug, full_name on public.fishing_guides
for each row execute function public.set_tourism_slug();

drop trigger if exists tg_tourism_slug_unique on public.tour_packages;
create trigger tg_tourism_slug_unique
before insert or update of slug, title on public.tour_packages
for each row execute function public.set_tourism_slug();

create index if not exists idx_accom_featured_until
  on public.accommodations(city_id, featured_until desc)
  where status = 'published' and featured;

create index if not exists idx_restaurants_featured_until
  on public.restaurants(city_id, featured_until desc)
  where status = 'published' and featured;

drop materialized view if exists public.mv_fishing_search;
create materialized view public.mv_fishing_search as
select
  fs.city_id,
  fs.id,
  fs.slug,
  fs.name,
  'spot'::text as kind,
  fs.description,
  fs.species,
  to_tsvector('portuguese', coalesce(fs.name, '') || ' ' || coalesce(fs.description, '') || ' ' || coalesce(fs.species::text, '')) as tsv
from public.fishing_spots fs
where fs.status = 'published'
union all
select
  fg.city_id,
  fg.id,
  fg.slug,
  fg.full_name as name,
  'guide'::text as kind,
  fg.about as description,
  fg.services as species,
  to_tsvector('portuguese', coalesce(fg.full_name, '') || ' ' || coalesce(fg.about, '') || ' ' || coalesce(fg.services::text, '')) as tsv
from public.fishing_guides fg
where fg.status = 'published';

create index if not exists idx_mv_fishing_search_city on public.mv_fishing_search(city_id, kind);
create index if not exists idx_mv_fishing_search_tsv on public.mv_fishing_search using gin(tsv);

insert into storage.buckets (id, name, public)
values ('tourism', 'tourism', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "storage_tourism_read" on storage.objects;
drop policy if exists "storage_tourism_insert" on storage.objects;
drop policy if exists "storage_tourism_update" on storage.objects;
drop policy if exists "storage_tourism_delete" on storage.objects;

create policy "storage_tourism_read"
on storage.objects for select
to public
using (
  bucket_id = 'tourism'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and (c.status = 'active' or public.is_super_admin())
  )
);

create policy "storage_tourism_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'tourism'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and (public.is_city_admin(c.id) or public.is_merchant(c.id))
  )
);

create policy "storage_tourism_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'tourism'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and (public.is_city_admin(c.id) or public.is_merchant(c.id))
  )
)
with check (
  bucket_id = 'tourism'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and (public.is_city_admin(c.id) or public.is_merchant(c.id))
  )
);

create policy "storage_tourism_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'tourism'
  and exists (
    select 1 from public.cities c
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and public.is_city_admin(c.id)
  )
);

drop policy if exists "ai_jobs_tourism_seo_enqueue" on public.ai_jobs;
create policy "ai_jobs_tourism_seo_enqueue"
on public.ai_jobs for insert
to authenticated
with check (job_type in ('seo_meta', 'generate_embedding'));

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.attractions (city_id, slug, name, type, description, address, lat, lng, hours, entry_fee, difficulty, duration_minutes, best_season, status, featured)
select carmo.id, a.slug, a.name, a.type::public.attraction_kind, a.description, a.address, null, null, a.hours, a.entry_fee, a.difficulty, a.duration_minutes, a.best_season, 'published'::public.entity_status, a.featured
from carmo
cross join (
  values
    ('mirante-do-cristo', 'Mirante do Cristo', 'mirante', 'Vista panoramica da cidade e do Lago de Furnas.', 'Área urbana', 'Aberto', 'Gratuito', 'facil', 45, 'Ano todo', true),
    ('cachoeira-do-lobo', 'Cachoeira do Lobo', 'cachoeira', 'Queda d agua em area rural, indicada para visitas guiadas.', 'Zona rural', 'Conforme acesso local', 'Conforme operador', 'moderado', 180, 'Periodo seco', true),
    ('lago-de-furnas', 'Lago de Furnas', 'lago', 'Represa com paisagens nauticas, pesca esportiva e passeios.', 'Furnas', 'Aberto', 'Gratuito', 'facil', 120, 'Ano todo', true),
    ('igreja-matriz', 'Igreja Matriz', 'igreja', 'Patrimonio religioso no centro de Carmo do Rio Claro.', 'Centro', 'Horarios de missa', 'Gratuito', 'facil', 40, 'Ano todo', false),
    ('serra-da-tormenta', 'Serra da Tormenta', 'trilha', 'Roteiro de natureza com vista para a regiao de Furnas.', 'Zona rural', 'Conforme guia', 'Conforme operador', 'dificil', 240, 'Periodo seco', false)
) as a(slug, name, type, description, address, hours, entry_fee, difficulty, duration_minutes, best_season, featured)
on conflict (city_id, slug) do update
set name = excluded.name,
    type = excluded.type,
    description = excluded.description,
    status = excluded.status,
    featured = excluded.featured;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.fishing_spots (city_id, slug, name, description, species, regulations, defeso_period, requires_guide, access_difficulty, status)
select carmo.id, s.slug, s.name, s.description, s.species::jsonb, s.regulations, s.defeso_period, s.requires_guide, s.access_difficulty, 'published'::public.entity_status
from carmo
cross join (
  values
    ('ponta-do-corvo', 'Ponta do Corvo', 'Ponto na represa indicado para tucunaré e traíra.', '["tucunare","traira","tilapia"]', 'Respeitar normas de pesca amadora e áreas particulares.', 'Consultar calendário oficial.', true, 'moderado'),
    ('enseada-do-varjao', 'Enseada do Varjao', 'Área calma para pesca embarcada em Furnas.', '["tucunare","pintado","tilapia"]', 'Uso de colete e documentação da embarcação.', 'Consultar calendário oficial.', true, 'facil'),
    ('braço-do-itaci', 'Braço do Itaci', 'Trecho com acesso distrital e boa procura por pesca esportiva.', '["traira","tucunare"]', 'Soltar exemplares fora da medida permitida.', 'Consultar calendário oficial.', false, 'moderado')
) as s(slug, name, description, species, regulations, defeso_period, requires_guide, access_difficulty)
on conflict (city_id, slug) do update
set name = excluded.name,
    description = excluded.description,
    species = excluded.species,
    status = excluded.status;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
),
centro as (
  select d.id, d.city_id from public.districts d join carmo on carmo.id = d.city_id where d.slug = 'centro'
)
insert into public.accommodations (city_id, district_id, slug, name, type, short_description, description, address, phone, whatsapp, price_min, price_max, rooms_count, max_guests, amenities, near_lake, has_marina, status, featured, featured_until, verified)
select centro.city_id, centro.id, 'pousada-demo-furnas', 'Pousada Demo Furnas', 'pousada', 'Hospedagem demo para validar o fluxo de turismo.', 'Ficha demonstrativa para o MVP de turismo em Carmo do Rio Claro.', 'Centro, Carmo do Rio Claro', '(35) 3561-3000', null, 180, 420, 12, 36, '["wifi","cafe_da_manha","estacionamento"]'::jsonb, true, false, 'published'::public.entity_status, true, now() + interval '90 days', true
from centro
on conflict (city_id, slug) do update
set short_description = excluded.short_description,
    status = excluded.status,
    featured = excluded.featured,
    featured_until = excluded.featured_until;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.fishing_guides (city_id, slug, full_name, license_number, about, phone, whatsapp, services, price_range, has_boat, status, verified)
select carmo.id, 'guia-demo-furnas', 'Guia Demo Furnas', 'CRC-DEMO-001', 'Guia demonstrativo para validar contatos e pacotes de pesca esportiva.', '(35) 3561-3001', null, '["guia_pesca","aluguel_barco","iscas"]'::jsonb, 'Sob consulta', true, 'published'::public.entity_status, true
from carmo
on conflict (city_id, slug) do update
set about = excluded.about,
    services = excluded.services,
    status = excluded.status,
    verified = excluded.verified;

with carmo as (
  select id from public.cities where slug = 'carmo-do-rio-claro'
)
insert into public.tour_packages (city_id, slug, title, description, duration_hours, price, includes, contact_phone, contact_whatsapp, status)
select carmo.id, 'roteiro-pesca-furnas-demo', 'Roteiro Pesca Furnas Demo', 'Pacote demonstrativo de meio dia para pesca esportiva em Furnas.', 4, 350, '["guia","barco","orientacao_local"]'::jsonb, '(35) 3561-3001', null, 'published'::public.entity_status
from carmo
on conflict (city_id, slug) do update
set description = excluded.description,
    duration_hours = excluded.duration_hours,
    price = excluded.price,
    includes = excluded.includes,
    status = excluded.status;

refresh materialized view public.mv_fishing_search;
