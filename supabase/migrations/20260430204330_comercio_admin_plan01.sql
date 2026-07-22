-- ============================================================================
-- Plano 01 — Comércio admin: busca, import e storage por negócio
-- ============================================================================

alter table public.businesses
  add column if not exists import_source jsonb;

create index if not exists idx_businesses_import_source
on public.businesses ((import_source->>'source'), (import_source->>'source_id'))
where import_source is not null
  and import_source ? 'source'
  and import_source ? 'source_id';

create unique index if not exists uq_businesses_import_source_city
on public.businesses (city_id, (import_source->>'source'), (import_source->>'source_id'))
where import_source is not null
  and import_source ? 'source'
  and import_source ? 'source_id';

create or replace function public.set_business_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published'::public.entity_status
     and (old.status is distinct from new.status)
     and new.published_at is null then
    new.published_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists tg_set_published_at on public.businesses;
create trigger tg_set_published_at
  before update of status on public.businesses
  for each row
  execute function public.set_business_published_at();

drop materialized view if exists public.mv_business_search;
create materialized view public.mv_business_search as
select
  b.id,
  b.city_id,
  b.slug,
  b.name,
  b.short_description,
  pc.name as primary_category,
  d.name as district_name,
  c.slug as city_slug,
  setweight(to_tsvector('portuguese', coalesce(b.name, '')), 'A') ||
  setweight(to_tsvector('portuguese', coalesce(b.short_description, '')), 'B') ||
  setweight(to_tsvector('portuguese', coalesce(b.description, '')), 'C') ||
  setweight(to_tsvector('portuguese', coalesce(pc.name, '')), 'B') ||
  setweight(to_tsvector('portuguese', coalesce(d.name, '')), 'C') as search_tsv
from public.businesses b
join public.cities c on c.id = b.city_id
left join public.districts d on d.id = b.district_id
left join public.business_category_assignments bca
  on bca.business_id = b.id
 and bca.is_primary is true
left join public.business_categories pc on pc.id = bca.category_id
where b.status = 'published'::public.entity_status
  and c.status = 'active'::public.city_status;

create unique index if not exists idx_mv_business_search_id
on public.mv_business_search (id);

create index if not exists idx_mv_business_search_city
on public.mv_business_search (city_id);

create index if not exists idx_mv_business_search_tsv
on public.mv_business_search using gin (search_tsv);

grant select on public.mv_business_search to anon, authenticated;

drop policy if exists "storage_business_owner_insert" on storage.objects;
drop policy if exists "storage_business_owner_update" on storage.objects;
drop policy if exists "storage_business_owner_delete" on storage.objects;

create policy "storage_business_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'businesses'
  and (storage.foldername(storage.objects.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.businesses b
    join public.cities c on c.id = b.city_id
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and b.id = ((storage.foldername(storage.objects.name))[2])::uuid
      and public.manages_business(b.id)
  )
);

create policy "storage_business_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'businesses'
  and (storage.foldername(storage.objects.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.businesses b
    join public.cities c on c.id = b.city_id
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and b.id = ((storage.foldername(storage.objects.name))[2])::uuid
      and public.manages_business(b.id)
  )
)
with check (
  bucket_id = 'businesses'
  and (storage.foldername(storage.objects.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.businesses b
    join public.cities c on c.id = b.city_id
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and b.id = ((storage.foldername(storage.objects.name))[2])::uuid
      and public.manages_business(b.id)
  )
);

create policy "storage_business_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'businesses'
  and (storage.foldername(storage.objects.name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  and exists (
    select 1
    from public.businesses b
    join public.cities c on c.id = b.city_id
    where c.slug = (storage.foldername(storage.objects.name))[1]
      and b.id = ((storage.foldername(storage.objects.name))[2])::uuid
      and public.manages_business(b.id)
  )
);

drop policy if exists "entity_managers_city_admin_businesses" on public.entity_managers;
create policy "entity_managers_city_admin_businesses"
on public.entity_managers for all
using (
  entity_type = 'business'
  and exists (
    select 1
    from public.businesses b
    where b.id = entity_id
      and public.is_city_admin(b.city_id)
  )
)
with check (
  entity_type = 'business'
  and exists (
    select 1
    from public.businesses b
    where b.id = entity_id
      and public.is_city_admin(b.city_id)
  )
);

drop policy if exists "audit_authenticated_insert" on public.audit_log;
create policy "audit_authenticated_insert"
on public.audit_log for insert
to authenticated
with check (actor_id = auth.uid());

drop policy if exists "ai_jobs_authenticated_enqueue" on public.ai_jobs;
create policy "ai_jobs_authenticated_enqueue"
on public.ai_jobs for insert
to authenticated
with check (job_type in ('moderate_ugc', 'generate_embedding'));

insert into public.business_categories (city_id, slug, name, parent_id, icon, display_order)
values
  (null, 'alimentacao', 'Alimentação', null, 'UtensilsCrossed', 10),
  (null, 'saude', 'Saúde', null, 'HeartPulse', 20),
  (null, 'beleza', 'Beleza & estética', null, 'Scissors', 30),
  (null, 'casa', 'Casa & decoração', null, 'Home', 40),
  (null, 'veiculos', 'Veículos', null, 'Car', 50),
  (null, 'servicos', 'Serviços', null, 'Wrench', 60),
  (null, 'compras', 'Compras', null, 'ShoppingBag', 70),
  (null, 'turismo', 'Hospedagem & turismo', null, 'MountainSnow', 80),
  (null, 'educacao', 'Educação', null, 'GraduationCap', 90),
  (null, 'lazer', 'Lazer & entretenimento', null, 'PartyPopper', 100),
  (null, 'industria', 'Indústria & comércio', null, 'Factory', 110),
  (null, 'agro', 'Agro & rural', null, 'Sprout', 120)
on conflict do nothing;

with categories(slug, name, parent_slug, icon, display_order) as (
  values
    ('restaurantes', 'Restaurantes', 'alimentacao', 'Utensils', 10),
    ('lanchonete', 'Lanchonetes', 'alimentacao', 'Sandwich', 20),
    ('pizzaria', 'Pizzarias', 'alimentacao', 'Pizza', 30),
    ('padaria', 'Padarias', 'alimentacao', 'Cookie', 40),
    ('acougue', 'Açougues', 'alimentacao', 'Beef', 50),
    ('bar', 'Bares', 'alimentacao', 'Wine', 60),
    ('mercado', 'Mercados', 'alimentacao', 'ShoppingCart', 70),
    ('sorveteria', 'Sorveterias', 'alimentacao', 'IceCreamCone', 80),
    ('farmacia', 'Farmácias', 'saude', 'Pill', 10),
    ('clinica', 'Clínicas médicas', 'saude', 'Stethoscope', 20),
    ('dentista', 'Dentistas', 'saude', 'Smile', 30),
    ('veterinaria', 'Veterinária', 'saude', 'PawPrint', 40),
    ('academia', 'Academias', 'saude', 'Dumbbell', 50),
    ('cabeleireiro', 'Cabeleireiros', 'beleza', 'Scissors', 10),
    ('barbearia', 'Barbearias', 'beleza', 'Scissors', 20),
    ('manicure', 'Manicure & pedicure', 'beleza', 'Sparkles', 30),
    ('estetica', 'Estética', 'beleza', 'Sparkles', 40),
    ('moveis', 'Móveis', 'casa', 'Sofa', 10),
    ('construcao', 'Construção', 'casa', 'HardHat', 20),
    ('eletrodomestico', 'Eletrodomésticos', 'casa', 'WashingMachine', 30),
    ('auto-eletrica', 'Auto elétrica', 'veiculos', 'Plug', 10),
    ('borracheiro', 'Borracharias', 'veiculos', 'Disc', 20),
    ('mecanica', 'Mecânicas', 'veiculos', 'Wrench', 30),
    ('jardineiro', 'Jardineiros', 'servicos', 'TreePalm', 10),
    ('pedreiro', 'Pedreiros', 'servicos', 'HardHat', 20),
    ('eletricista', 'Eletricistas', 'servicos', 'Zap', 30),
    ('assistencia-tecnica', 'Assistência técnica', 'servicos', 'Wrench', 40),
    ('informatica', 'Informática', 'servicos', 'Laptop', 50),
    ('roupa', 'Roupas', 'compras', 'Shirt', 10),
    ('calcado', 'Calçados', 'compras', 'Footprints', 20),
    ('floricultura', 'Floriculturas', 'compras', 'Flower2', 30),
    ('flores-presentes', 'Flores e presentes', 'compras', 'Flower2', 40),
    ('pousada', 'Pousadas', 'turismo', 'BedDouble', 10),
    ('pesca', 'Pesca esportiva', 'turismo', 'Fish', 20),
    ('passeio', 'Passeios e roteiros', 'turismo', 'Map', 30),
    ('escola', 'Escolas', 'educacao', 'School', 10),
    ('idiomas', 'Escolas de idiomas', 'educacao', 'Languages', 20),
    ('festa-evento', 'Festas e eventos', 'lazer', 'PartyPopper', 10),
    ('igreja', 'Igrejas', 'lazer', 'Church', 20),
    ('industria-comercio', 'Indústria e comércio', 'industria', 'Factory', 10),
    ('animais', 'Animais', 'agro', 'PawPrint', 10)
)
insert into public.business_categories (city_id, slug, name, parent_id, icon, display_order)
select null, c.slug, c.name, p.id, c.icon, c.display_order
from categories c
join public.business_categories p
  on p.city_id is null
 and p.slug = c.parent_slug
on conflict do nothing;
