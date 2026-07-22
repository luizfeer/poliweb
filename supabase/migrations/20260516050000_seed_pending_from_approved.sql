-- Garante que approved_photos (nomes aprovados via painel) também viram pending_photos
-- pro worker re-importar pro R2. Idempotente: se pending já tem entrada com o mesmo name,
-- nao duplica.

update attractions a
set google_photos = jsonb_set(
  coalesce(a.google_photos, '{}'::jsonb),
  '{pending_photos}',
  (
    select coalesce(jsonb_agg(distinct elem), '[]'::jsonb)
    from (
      select jsonb_build_object('name', existing->>'name', 'role', coalesce(existing->>'role','gallery'), 'attribution', existing->'attribution') as elem
      from jsonb_array_elements(coalesce(a.google_photos->'pending_photos', '[]'::jsonb)) as existing
      union
      select jsonb_build_object('name', name_text, 'role', 'gallery', 'attribution', null) as elem
      from jsonb_array_elements_text(coalesce(a.google_photos->'approved_photos', '[]'::jsonb)) as name_text
    ) merged
  )
)
where a.google_photos ? 'approved_photos'
  and jsonb_array_length(coalesce(a.google_photos->'approved_photos', '[]'::jsonb)) > 0;

-- Mesma coisa pra businesses (caso alguma ficou com approved sem ter ido pra pending)
update businesses b
set import_source = jsonb_set(
  coalesce(b.import_source, '{}'::jsonb),
  '{google_places,pending_photos}',
  (
    select coalesce(jsonb_agg(distinct elem), '[]'::jsonb)
    from (
      select jsonb_build_object('name', existing->>'name', 'role', coalesce(existing->>'role','gallery'), 'attribution', existing->'attribution') as elem
      from jsonb_array_elements(coalesce(b.import_source->'google_places'->'pending_photos', '[]'::jsonb)) as existing
      union
      select jsonb_build_object('name', name_text, 'role', 'gallery', 'attribution', null) as elem
      from jsonb_array_elements_text(coalesce(b.import_source->'google_places'->'approved_photos', '[]'::jsonb)) as name_text
    ) merged
  )
)
where b.import_source->'google_places' ? 'approved_photos'
  and jsonb_array_length(coalesce(b.import_source->'google_places'->'approved_photos', '[]'::jsonb)) > 0;
