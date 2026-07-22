-- Normaliza Instagram e remove "delivery" de comércios sem categoria compatível.
-- Rode primeiro o bloco SELECT para revisar. O UPDATE fica em transação.

with delivery_categories(slug) as (
  values
    ('alimentacao'),
    ('restaurantes'),
    ('lanchonete'),
    ('pizzaria'),
    ('padaria'),
    ('acougue'),
    ('bar'),
    ('mercado'),
    ('sorveteria'),
    ('chocolateria'),
    ('disk-bebidas'),
    ('disk-gas'),
    ('conveniencia')
),
business_category_slugs as (
  select
    b.id,
    array_agg(bc.slug) filter (where bc.slug is not null) as category_slugs
  from public.businesses b
  left join public.business_category_assignments bca on bca.business_id = b.id
  left join public.business_categories bc on bc.id = bca.category_id
  group by b.id
)
select
  b.id,
  b.name,
  b.slug,
  b.instagram,
  b.amenities,
  bcs.category_slugs
from public.businesses b
left join business_category_slugs bcs on bcs.id = b.id
where
  b.instagram ~* '^(https?://|instagram\.com/|@)'
  or (
    b.amenities ? 'delivery'
    and not exists (
      select 1
      from public.business_category_assignments bca
      join public.business_categories bc on bc.id = bca.category_id
      join delivery_categories dc on dc.slug = bc.slug
      where bca.business_id = b.id
    )
  )
order by b.name;

begin;

update public.businesses
set
  instagram = nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(trim(instagram)), '^.*instagram\.com/', ''),
        '^@',
        ''
      ),
      '[/?#].*$',
      ''
    ),
    ''
  ),
  updated_at = now()
where instagram ~* '^(https?://|instagram\.com/|@)';

with delivery_categories(slug) as (
  values
    ('alimentacao'),
    ('restaurantes'),
    ('lanchonete'),
    ('pizzaria'),
    ('padaria'),
    ('acougue'),
    ('bar'),
    ('mercado'),
    ('sorveteria'),
    ('chocolateria'),
    ('disk-bebidas'),
    ('disk-gas'),
    ('conveniencia')
),
businesses_without_delivery_category as (
  select b.id
  from public.businesses b
  where
    b.amenities ? 'delivery'
    and not exists (
      select 1
      from public.business_category_assignments bca
      join public.business_categories bc on bc.id = bca.category_id
      join delivery_categories dc on dc.slug = bc.slug
      where bca.business_id = b.id
    )
)
update public.businesses b
set
  amenities = coalesce(
    (
      select jsonb_agg(value)
      from jsonb_array_elements_text(b.amenities) as item(value)
      where value <> 'delivery'
    ),
    '[]'::jsonb
  ),
  updated_at = now()
where b.id in (select id from businesses_without_delivery_category);

commit;
