-- Business reviews: optional citizen photo attachment.

alter table public.business_reviews
  add column if not exists photo_url text;

drop policy if exists "storage_business_review_photo_insert" on storage.objects;
drop policy if exists "storage_business_review_photo_update" on storage.objects;

create policy "storage_business_review_photo_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'businesses'
  and (storage.foldername(storage.objects.name))[2] = 'reviews'
  and exists (
    select 1
    from public.business_reviews br
    join public.businesses b on b.id = br.business_id
    join public.cities c on c.id = b.city_id
    where br.author_profile_id = auth.uid()
      and c.slug = (storage.foldername(storage.objects.name))[1]
      and c.status = 'active'
      and storage.filename(storage.objects.name) like br.id::text || '.%'
  )
);

create policy "storage_business_review_photo_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'businesses'
  and (storage.foldername(storage.objects.name))[2] = 'reviews'
  and exists (
    select 1
    from public.business_reviews br
    join public.businesses b on b.id = br.business_id
    join public.cities c on c.id = b.city_id
    where br.author_profile_id = auth.uid()
      and c.slug = (storage.foldername(storage.objects.name))[1]
      and storage.filename(storage.objects.name) like br.id::text || '.%'
  )
)
with check (
  bucket_id = 'businesses'
  and (storage.foldername(storage.objects.name))[2] = 'reviews'
  and exists (
    select 1
    from public.business_reviews br
    join public.businesses b on b.id = br.business_id
    join public.cities c on c.id = b.city_id
    where br.author_profile_id = auth.uid()
      and c.slug = (storage.foldername(storage.objects.name))[1]
      and storage.filename(storage.objects.name) like br.id::text || '.%'
  )
);
