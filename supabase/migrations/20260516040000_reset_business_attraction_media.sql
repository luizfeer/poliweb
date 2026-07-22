-- Zera mídias importadas para forçar re-import via Cloudflare R2.
-- Move imported_photos de volta pra pending_photos em businesses (import_source.google_places)
-- e em attractions (google_photos), apaga media_assets/media_links derivados do Google,
-- e limpa cover_url/photos das entidades. Antes da migração Bunny -> R2.

-- businesses: rebuild pending list from already imported entries
update businesses
set
  cover_url = null,
  photos = '[]'::jsonb,
  import_source = jsonb_set(
    jsonb_set(
      coalesce(import_source, '{}'::jsonb),
      '{google_places,pending_photos}',
      coalesce(
        (
          select jsonb_agg(jsonb_build_object(
            'name', elem->>'name',
            'role', coalesce(elem->>'role', 'gallery'),
            'attribution', elem->'attribution'
          ))
          from jsonb_array_elements(
            coalesce(import_source->'google_places'->'imported_photos', '[]'::jsonb)
          ) as elem
        ),
        '[]'::jsonb
      )
    ),
    '{google_places,imported_photos}',
    '[]'::jsonb
  )
where import_source ? 'google_places';

-- attractions: google_photos pode estar como array (legado) OU objeto {pending_photos, imported_photos}.
-- Normaliza pros dois casos.
update attractions
set
  cover_url = null,
  photos = '[]'::jsonb,
  google_photos = case
    when jsonb_typeof(google_photos) = 'array' then
      jsonb_build_object(
        'pending_photos', coalesce(
          (
            select jsonb_agg(
              case
                when jsonb_typeof(elem) = 'string'
                  then jsonb_build_object('name', elem #>> '{}', 'role', 'gallery', 'attribution', null)
                else jsonb_build_object(
                  'name', elem->>'name',
                  'role', coalesce(elem->>'role', 'gallery'),
                  'attribution', elem->'attribution'
                )
              end
            )
            from jsonb_array_elements(google_photos) as elem
          ),
          '[]'::jsonb
        ),
        'imported_photos', '[]'::jsonb
      )
    else
      jsonb_set(
        jsonb_set(
          google_photos,
          '{pending_photos}',
          coalesce(
            (
              select jsonb_agg(jsonb_build_object(
                'name', elem->>'name',
                'role', coalesce(elem->>'role', 'gallery'),
                'attribution', elem->'attribution'
              ))
              from jsonb_array_elements(
                coalesce(google_photos->'imported_photos', '[]'::jsonb)
              ) as elem
            ),
            '[]'::jsonb
          )
        ),
        '{imported_photos}',
        '[]'::jsonb
      )
  end
where google_photos is not null;

-- Remove media_links/assets cujo storage estava no Bunny (legacy) ou foram puxados do Google Places.
delete from media_links
where asset_id in (
  select id from media_assets
  where provider = 'bunny'
     or (metadata->>'source') = 'google_places'
)
and not exists (
  select 1
  from home_block_banners hbb
  where hbb.image_asset_id = media_links.asset_id
     or hbb.video_asset_id = media_links.asset_id
);

delete from media_assets
where (
  provider = 'bunny'
  or (metadata->>'source') = 'google_places'
)
and not exists (
  select 1
  from home_block_banners hbb
  where hbb.image_asset_id = media_assets.id
     or hbb.video_asset_id = media_assets.id
);
