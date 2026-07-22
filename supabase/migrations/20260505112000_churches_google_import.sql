alter table public.churches
  add column if not exists google_maps_url text,
  add column if not exists import_source jsonb;
