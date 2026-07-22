create or replace function public.enqueue_parent_entity_indexing()
returns trigger
language plpgsql
as $$
declare
  next_entity_type text;
  next_entity_id uuid;
  next_city_id uuid;
begin
  if tg_op = 'DELETE' then
    next_entity_type := old.entity_type;
    next_entity_id := old.entity_id;
    next_city_id := old.city_id;
  else
    next_entity_type := new.entity_type;
    next_entity_id := new.entity_id;
    next_city_id := new.city_id;
  end if;

  insert into public.indexing_queue (entity_type, entity_id, city_id, operation)
  values (next_entity_type, next_entity_id, next_city_id, 'upsert')
  on conflict (entity_type, entity_id) do update
    set operation = excluded.operation,
        city_id = excluded.city_id,
        processed_at = null,
        attempts = 0,
        last_error = null,
        enqueued_at = now();

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists entity_services_indexing on public.entity_services;
create trigger entity_services_indexing
after insert or update or delete on public.entity_services
for each row execute function public.enqueue_parent_entity_indexing();

drop trigger if exists entity_faqs_indexing on public.entity_faqs;
create trigger entity_faqs_indexing
after insert or update or delete on public.entity_faqs
for each row execute function public.enqueue_parent_entity_indexing();
