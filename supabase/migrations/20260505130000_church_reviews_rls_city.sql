-- Keep church review writes tied to the church city.

drop policy if exists "church_reviews_self_create" on public.church_reviews;
create policy "church_reviews_self_create"
on public.church_reviews for insert
with check (
  author_profile_id = auth.uid()
  and exists (
    select 1
    from public.churches c
    where c.id = church_id
      and c.city_id = church_reviews.city_id
      and c.status = 'published'
  )
);

drop policy if exists "church_reviews_self_update" on public.church_reviews;
create policy "church_reviews_self_update"
on public.church_reviews for update
using (author_profile_id = auth.uid() and status in ('draft', 'pending'))
with check (
  author_profile_id = auth.uid()
  and exists (
    select 1
    from public.churches c
    where c.id = church_id
      and c.city_id = church_reviews.city_id
  )
);
