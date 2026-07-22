drop policy if exists "media_links_insert" on public.media_links;
create policy "media_links_insert" on public.media_links for insert
with check (
  public.is_city_admin(city_id)
  or public.manages_entity(entity_type, entity_id)
  or (entity_type = 'profile' and entity_id = auth.uid() and role = 'avatar')
  or (entity_type = 'business' and public.manages_business(entity_id))
  or (entity_type = 'realtor' and public.manages_realtor(entity_id))
  or exists (select 1 from public.accommodations e where e.id = entity_id and e.city_id = media_links.city_id and e.owner_profile_id = auth.uid())
  or exists (select 1 from public.restaurants e where e.id = entity_id and e.city_id = media_links.city_id and e.owner_profile_id = auth.uid())
  or exists (select 1 from public.fishing_guides e where e.id = entity_id and e.city_id = media_links.city_id and e.owner_profile_id = auth.uid())
  or exists (select 1 from public.properties e where e.id = entity_id and e.city_id = media_links.city_id and e.owner_profile_id = auth.uid())
  or exists (select 1 from public.classifieds e where e.id = entity_id and e.city_id = media_links.city_id and e.author_profile_id = auth.uid())
  or exists (select 1 from public.events e where e.id = entity_id and e.city_id = media_links.city_id and e.organizer_profile_id = auth.uid())
  or exists (select 1 from public.lost_pets e where e.id = entity_id and e.city_id = media_links.city_id and e.author_profile_id = auth.uid())
  or exists (select 1 from public.lost_and_found e where e.id = entity_id and e.city_id = media_links.city_id and e.author_profile_id = auth.uid())
);

drop policy if exists "media_links_update" on public.media_links;
create policy "media_links_update" on public.media_links for update
using (
  public.is_city_admin(city_id)
  or public.manages_entity(entity_type, entity_id)
  or (entity_type = 'profile' and entity_id = auth.uid() and role = 'avatar')
)
with check (
  public.is_city_admin(city_id)
  or public.manages_entity(entity_type, entity_id)
  or (entity_type = 'profile' and entity_id = auth.uid() and role = 'avatar')
);

drop policy if exists "media_links_delete" on public.media_links;
create policy "media_links_delete" on public.media_links for delete
using (
  public.is_city_admin(city_id)
  or public.manages_entity(entity_type, entity_id)
  or (entity_type = 'profile' and entity_id = auth.uid() and role = 'avatar')
);
