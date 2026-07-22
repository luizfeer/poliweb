-- Publica apenas comercios das rotas /comercio/pousadas e /comercio/educacao
-- em Carmo do Rio Claro. Todos os demais comercios da cidade viram rascunho.
--
-- Categorias preservadas:
-- - pousadas, pousada e descendentes
-- - educacao e descendentes (ex.: escola, idiomas)
--
-- Antes de rodar o UPDATE, execute o SELECT de preview abaixo se quiser revisar.

with recursive
target_city as (
  select id
  from public.cities
  where slug = 'carmo-do-rio-claro'
),
allowed_roots(slug) as (
  values
    ('pousadas'),
    ('pousada'),
    ('educacao')
),
allowed_categories as (
  select bc.id, bc.slug
  from public.business_categories bc
  join allowed_roots ar on ar.slug = bc.slug
  where bc.city_id is null or bc.city_id in (select id from target_city)

  union all

  select child.id, child.slug
  from public.business_categories child
  join allowed_categories parent on parent.id = child.parent_id
  where child.city_id is null or child.city_id in (select id from target_city)
),
business_flags as (
  select
    b.id,
    b.name,
    b.slug,
    b.status,
    coalesce(
      bool_or(bca.category_id in (select id from allowed_categories)),
      false
    ) as should_stay_published,
    array_agg(distinct bc.slug order by bc.slug) filter (where bc.slug is not null) as category_slugs
  from public.businesses b
  left join public.business_category_assignments bca on bca.business_id = b.id
  left join public.business_categories bc on bc.id = bca.category_id
  where b.city_id in (select id from target_city)
  group by b.id, b.name, b.slug, b.status
)
select
  case when should_stay_published then 'will_publish' else 'will_draft' end as action,
  status as current_status,
  count(*) as total
from business_flags
group by action, current_status
order by action, current_status;

begin;

with recursive
target_city as (
  select id
  from public.cities
  where slug = 'carmo-do-rio-claro'
),
allowed_roots(slug) as (
  values
    ('pousadas'),
    ('pousada'),
    ('educacao')
),
allowed_categories as (
  select bc.id, bc.slug
  from public.business_categories bc
  join allowed_roots ar on ar.slug = bc.slug
  where bc.city_id is null or bc.city_id in (select id from target_city)

  union all

  select child.id, child.slug
  from public.business_categories child
  join allowed_categories parent on parent.id = child.parent_id
  where child.city_id is null or child.city_id in (select id from target_city)
),
allowed_businesses as (
  select distinct bca.business_id
  from public.business_category_assignments bca
  join allowed_categories ac on ac.id = bca.category_id
),
updated as (
  update public.businesses b
  set
    status = case
      when b.id in (select business_id from allowed_businesses) then 'published'::public.entity_status
      else 'draft'::public.entity_status
    end,
    published_at = case
      when b.id in (select business_id from allowed_businesses) then coalesce(b.published_at, now())
      else null
    end,
    updated_at = now()
  where b.city_id in (select id from target_city)
    and b.status is distinct from case
      when b.id in (select business_id from allowed_businesses) then 'published'::public.entity_status
      else 'draft'::public.entity_status
    end
  returning
    b.id,
    b.name,
    b.slug,
    b.status
)
select
  status as new_status,
  count(*) as updated_count
from updated
group by status
order by status;

commit;

-- Conferencia final: deve retornar apenas categorias permitidas como publicadas.
with recursive
target_city as (
  select id
  from public.cities
  where slug = 'carmo-do-rio-claro'
),
allowed_roots(slug) as (
  values
    ('pousadas'),
    ('pousada'),
    ('educacao')
),
allowed_categories as (
  select bc.id, bc.slug
  from public.business_categories bc
  join allowed_roots ar on ar.slug = bc.slug
  where bc.city_id is null or bc.city_id in (select id from target_city)

  union all

  select child.id, child.slug
  from public.business_categories child
  join allowed_categories parent on parent.id = child.parent_id
  where child.city_id is null or child.city_id in (select id from target_city)
),
published_businesses as (
  select
    b.id,
    b.name,
    b.slug,
    array_agg(distinct bc.slug order by bc.slug) filter (where bc.slug is not null) as category_slugs,
    coalesce(
      bool_or(bca.category_id in (select id from allowed_categories)),
      false
    ) as allowed
  from public.businesses b
  left join public.business_category_assignments bca on bca.business_id = b.id
  left join public.business_categories bc on bc.id = bca.category_id
  where b.city_id in (select id from target_city)
    and b.status = 'published'
  group by b.id, b.name, b.slug
)
select *
from published_businesses
where not allowed
order by name;
