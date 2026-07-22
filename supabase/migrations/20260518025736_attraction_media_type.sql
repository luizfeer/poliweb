alter table public.attraction_photos
  add column if not exists media_type text not null default 'image'
  check (media_type in ('image', 'video'));

create index if not exists idx_attraction_photos_media_type
on public.attraction_photos(attraction_id, status, media_type);
