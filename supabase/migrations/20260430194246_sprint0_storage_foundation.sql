-- ============================================================================
-- 0008 — SPRINT 0: storage buckets e policies por city_slug
-- ============================================================================

-- Convenção de path:
--   {city_slug}/...
--
-- Exemplos:
--   businesses/carmo-do-rio-claro/{business_id}/cover.jpg
--   properties/carmo-do-rio-claro/{property_id}/gallery/01.jpg
--   transparency/carmo-do-rio-claro/diarios/2026-04-30.pdf

insert into storage.buckets (id, name, public)
values
  ('cities',         'cities',         true),
  ('businesses',     'businesses',     true),
  ('accommodations', 'accommodations', true),
  ('properties',     'properties',     true),
  ('events',         'events',         true),
  ('transparency',   'transparency',   true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "storage_city_media_read" on storage.objects;
drop policy if exists "storage_city_media_insert" on storage.objects;
drop policy if exists "storage_city_media_update" on storage.objects;
drop policy if exists "storage_city_media_delete" on storage.objects;

create policy "storage_city_media_read"
on storage.objects for select
to public
using (
  bucket_id in ('cities', 'businesses', 'accommodations', 'properties', 'events', 'transparency')
  and exists (
    select 1
    from public.cities c
    where c.slug = (storage.foldername(name))[1]
      and (c.status = 'active' or public.is_super_admin())
  )
);

create policy "storage_city_media_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('cities', 'businesses', 'accommodations', 'properties', 'events', 'transparency')
  and exists (
    select 1
    from public.cities c
    where c.slug = (storage.foldername(name))[1]
      and public.is_city_admin(c.id)
  )
);

create policy "storage_city_media_update"
on storage.objects for update
to authenticated
using (
  bucket_id in ('cities', 'businesses', 'accommodations', 'properties', 'events', 'transparency')
  and exists (
    select 1
    from public.cities c
    where c.slug = (storage.foldername(name))[1]
      and public.is_city_admin(c.id)
  )
)
with check (
  bucket_id in ('cities', 'businesses', 'accommodations', 'properties', 'events', 'transparency')
  and exists (
    select 1
    from public.cities c
    where c.slug = (storage.foldername(name))[1]
      and public.is_city_admin(c.id)
  )
);

create policy "storage_city_media_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id in ('cities', 'businesses', 'accommodations', 'properties', 'events', 'transparency')
  and exists (
    select 1
    from public.cities c
    where c.slug = (storage.foldername(name))[1]
      and public.is_city_admin(c.id)
  )
);
