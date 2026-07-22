create or replace function public.enqueue_indexing()
returns trigger language plpgsql as $$
declare
  next_operation varchar(10);
  next_city_id uuid;
begin
  if (tg_op = 'DELETE') then
    next_operation := 'delete';
    next_city_id := old.city_id;
    insert into indexing_queue (entity_type, entity_id, city_id, operation)
    values (tg_argv[0], old.id, next_city_id, next_operation)
    on conflict (entity_type, entity_id) do update
      set operation = excluded.operation,
          city_id = excluded.city_id,
          processed_at = null,
          attempts = 0,
          last_error = null,
          enqueued_at = now();
    return old;
  end if;

  if (new.status::text in ('active', 'approved', 'published')) then
    insert into indexing_queue (entity_type, entity_id, city_id, operation)
    values (tg_argv[0], new.id, new.city_id, 'upsert')
    on conflict (entity_type, entity_id) do update
      set operation = excluded.operation,
          city_id = excluded.city_id,
          processed_at = null,
          attempts = 0,
          last_error = null,
          enqueued_at = now();
  else
    insert into indexing_queue (entity_type, entity_id, city_id, operation)
    values (tg_argv[0], new.id, new.city_id, 'delete')
    on conflict (entity_type, entity_id) do update
      set operation = excluded.operation,
          city_id = excluded.city_id,
          processed_at = null,
          attempts = 0,
          last_error = null,
          enqueued_at = now();
  end if;

  return new;
end;
$$;
