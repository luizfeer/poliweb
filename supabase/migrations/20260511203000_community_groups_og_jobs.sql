-- Community groups: integra grupos ao pipeline persistido de OG images.

alter table public.community_groups
  add column if not exists og_image_url text;

drop trigger if exists trg_community_groups_og_image on public.community_groups;
create trigger trg_community_groups_og_image
  after insert or update of name, short_description, description, category, type, cover_url, thumbnail_url, slug, status
  on public.community_groups
  for each row
  execute function public.enqueue_og_image_job('community_group');

insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
select g.city_id, 'community_group', g.id, 'pending'
from public.community_groups g
where g.status = 'published'
  and g.og_image_url is null
  and not exists (
    select 1
    from public.og_image_jobs j
    where j.entity_type = 'community_group'
      and j.entity_id = g.id
      and j.status in ('pending', 'processing')
  );
