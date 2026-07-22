-- Corrige função enqueue_og_image_job para não falhar quando a tabela não tem coluna 'active'

create or replace function public.enqueue_og_image_job()
returns trigger as $$
declare
  is_published boolean := false;
  j jsonb;
begin
  j := to_jsonb(new);

  if j ? 'status' and j->>'status' = 'published' then
    is_published := true;
  elsif j ? 'active' and (j->>'active')::boolean = true then
    is_published := true;
  end if;

  if not is_published then
    return new;
  end if;

  delete from public.og_image_jobs
  where entity_type = TG_ARGV[0]
    and entity_id = new.id
    and status = 'pending';

  insert into public.og_image_jobs (city_id, entity_type, entity_id, status)
  values (new.city_id, TG_ARGV[0], new.id, 'pending');

  return new;
end;
$$ language plpgsql;
