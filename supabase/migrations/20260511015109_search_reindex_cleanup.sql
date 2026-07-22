-- Busca: limpa embeddings de conteúdo não público e refaz a fila incremental.
-- Mantém a regra operacional: published/active/approved entra como upsert; o resto vira delete.

delete from public.embeddings e
where e.entity_type = 'business'
  and exists (
    select 1 from public.businesses b
    where b.id = e.entity_id
      and b.city_id = e.city_id
      and coalesce(b.status::text, '') not in ('active', 'approved', 'published')
  );

delete from public.embeddings e
where e.entity_type = 'accommodation'
  and exists (
    select 1 from public.accommodations a
    where a.id = e.entity_id
      and a.city_id = e.city_id
      and coalesce(a.status::text, '') not in ('active', 'approved', 'published')
  );

delete from public.embeddings e
where e.entity_type = 'restaurant'
  and exists (
    select 1 from public.restaurants r
    where r.id = e.entity_id
      and r.city_id = e.city_id
      and coalesce(r.status::text, '') not in ('active', 'approved', 'published')
  );

delete from public.embeddings e
where e.entity_type = 'fishing_guide'
  and exists (
    select 1 from public.fishing_guides f
    where f.id = e.entity_id
      and f.city_id = e.city_id
      and coalesce(f.status::text, '') not in ('active', 'approved', 'published')
  );

delete from public.embeddings e
where e.entity_type = 'event'
  and exists (
    select 1 from public.events ev
    where ev.id = e.entity_id
      and ev.city_id = e.city_id
      and coalesce(ev.status::text, '') not in ('active', 'approved', 'published')
  );

delete from public.embeddings e
where e.entity_type = 'classified'
  and exists (
    select 1 from public.classifieds c
    where c.id = e.entity_id
      and c.city_id = e.city_id
      and (
        c.status::text <> 'published'
        or c.review_status::text <> 'approved'
        or (c.expires_at is not null and c.expires_at < now())
      )
  );

delete from public.embeddings e
where e.entity_type = 'property'
  and exists (
    select 1 from public.properties p
    where p.id = e.entity_id
      and p.city_id = e.city_id
      and coalesce(p.status::text, '') not in ('active', 'approved', 'published')
  );

delete from public.embeddings e
where e.entity_type = 'attraction'
  and exists (
    select 1 from public.attractions a
    where a.id = e.entity_id
      and a.city_id = e.city_id
      and coalesce(a.status::text, '') not in ('active', 'approved', 'published')
  );

delete from public.embeddings e
where e.entity_type = 'tour_package'
  and exists (
    select 1 from public.tour_packages tp
    where tp.id = e.entity_id
      and tp.city_id = e.city_id
      and coalesce(tp.status::text, '') not in ('active', 'approved', 'published')
  );

delete from public.embeddings e
where e.entity_type = 'faq'
  and exists (
    select 1 from public.city_faqs f
    where f.id = e.entity_id
      and f.city_id = e.city_id
      and f.is_active is not true
  );

insert into public.indexing_queue (entity_type, entity_id, city_id, operation, processed_at, attempts, last_error, enqueued_at)
select 'business', id, city_id,
  case when status::text in ('active', 'approved', 'published') then 'upsert' else 'delete' end,
  null::timestamptz, 0, null::text, now()
from public.businesses
where city_id is not null
union all
select 'accommodation', id, city_id,
  case when status::text in ('active', 'approved', 'published') then 'upsert' else 'delete' end,
  null::timestamptz, 0, null::text, now()
from public.accommodations
where city_id is not null
union all
select 'restaurant', id, city_id,
  case when status::text in ('active', 'approved', 'published') then 'upsert' else 'delete' end,
  null::timestamptz, 0, null::text, now()
from public.restaurants
where city_id is not null
union all
select 'fishing_guide', id, city_id,
  case when status::text in ('active', 'approved', 'published') then 'upsert' else 'delete' end,
  null::timestamptz, 0, null::text, now()
from public.fishing_guides
where city_id is not null
union all
select 'event', id, city_id,
  case when status::text in ('active', 'approved', 'published') then 'upsert' else 'delete' end,
  null::timestamptz, 0, null::text, now()
from public.events
where city_id is not null
union all
select 'classified', id, city_id,
  case
    when status::text = 'published'
      and review_status::text = 'approved'
      and (expires_at is null or expires_at >= now())
    then 'upsert'
    else 'delete'
  end,
  null::timestamptz, 0, null::text, now()
from public.classifieds
where city_id is not null
union all
select 'property', id, city_id,
  case when status::text in ('active', 'approved', 'published') then 'upsert' else 'delete' end,
  null::timestamptz, 0, null::text, now()
from public.properties
where city_id is not null
union all
select 'attraction', id, city_id,
  case when status::text in ('active', 'approved', 'published') then 'upsert' else 'delete' end,
  null::timestamptz, 0, null::text, now()
from public.attractions
where city_id is not null
union all
select 'tour_package', id, city_id,
  case when status::text in ('active', 'approved', 'published') then 'upsert' else 'delete' end,
  null::timestamptz, 0, null::text, now()
from public.tour_packages
where city_id is not null
union all
select 'faq', id, city_id,
  case when is_active is true then 'upsert' else 'delete' end,
  null::timestamptz, 0, null::text, now()
from public.city_faqs
where city_id is not null
on conflict (entity_type, entity_id) do update
  set operation = excluded.operation,
      city_id = excluded.city_id,
      processed_at = null,
      attempts = 0,
      last_error = null,
      enqueued_at = now();
