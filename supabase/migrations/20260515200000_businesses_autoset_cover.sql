-- Garante que todo business com pelo menos uma imagem tenha cover_url.
-- Estratégia: backfill + dois triggers (um na propria businesses, outro em media_links).

create or replace function public.businesses_autoset_cover()
returns trigger language plpgsql as $$
begin
  if (new.cover_url is null or new.cover_url = '')
     and new.photos is not null
     and jsonb_typeof(new.photos) = 'array'
     and jsonb_array_length(new.photos) > 0 then
    new.cover_url := new.photos->>0;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_businesses_autoset_cover on businesses;
create trigger trg_businesses_autoset_cover
before insert or update of cover_url, photos on businesses
for each row execute function public.businesses_autoset_cover();

create or replace function public.media_links_autoset_business_cover()
returns trigger language plpgsql as $$
begin
  if new.entity_type = 'business' and new.role in ('gallery', 'cover') then
    update businesses b
    set cover_url = ma.cdn_url
    from media_assets ma
    where b.id = new.entity_id
      and ma.id = new.asset_id
      and ma.status = 'active'
      and (b.cover_url is null or b.cover_url = '');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_media_links_autoset_business_cover on media_links;
create trigger trg_media_links_autoset_business_cover
after insert on media_links
for each row execute function public.media_links_autoset_business_cover();

-- Backfill: para todo business sem cover, pegar a primeira imagem disponível
-- (1) photos[0] do proprio registro, (2) media_links cover/gallery mais antigo.
update businesses b
set cover_url = sub.url
from (
  select
    bx.id,
    coalesce(
      nullif(bx.photos->>0, ''),
      (
        select ma.cdn_url
        from media_links ml
        join media_assets ma on ma.id = ml.asset_id
        where ml.entity_type = 'business'
          and ml.entity_id = bx.id
          and ml.role in ('cover', 'gallery')
          and ma.status = 'active'
          and ma.content_type like 'image/%'
        order by (ml.role = 'cover') desc, ml.is_primary desc, ml.position asc, ml.created_at asc
        limit 1
      )
    ) as url
  from businesses bx
  where bx.cover_url is null or bx.cover_url = ''
) sub
where b.id = sub.id and sub.url is not null;
