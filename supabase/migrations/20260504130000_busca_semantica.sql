-- ============================================================================
-- Sprint 13 - Busca semantica unificada
-- ============================================================================

create extension if not exists vector;

alter table embeddings add column if not exists content_hash varchar(64);
alter table embeddings add column if not exists indexed_at timestamptz default now();

drop index if exists idx_embeddings_vector;
create index if not exists embeddings_embedding_idx on embeddings
  using hnsw (embedding vector_cosine_ops);

alter table embeddings drop constraint if exists embeddings_entity_type_entity_id_key;
create unique index if not exists embeddings_unique_city_idx
  on embeddings(entity_type, entity_id, city_id);

create table if not exists indexing_queue (
  id uuid primary key default gen_random_uuid(),
  entity_type varchar(40) not null,
  entity_id uuid not null,
  city_id uuid not null references cities(id) on delete cascade,
  operation varchar(10) not null check (operation in ('upsert', 'delete')),
  attempts integer not null default 0,
  last_error text,
  enqueued_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);

create index if not exists indexing_queue_pending_idx on indexing_queue(enqueued_at)
  where processed_at is null;

create trigger indexing_queue_set_updated_at
  before update on indexing_queue
  for each row execute function set_updated_at();

create table if not exists search_queries (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  query text not null,
  result_count integer not null,
  clicked_entity_type varchar(40),
  clicked_entity_id uuid,
  session_hash varchar(64),
  latency_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists search_queries_city_idx on search_queries(city_id, created_at desc);
create index if not exists search_queries_zero_results_idx on search_queries(city_id, created_at desc)
  where result_count = 0;

create trigger search_queries_set_updated_at
  before update on search_queries
  for each row execute function set_updated_at();

alter table indexing_queue enable row level security;
alter table search_queries enable row level security;

drop policy if exists "indexing_queue_admin" on indexing_queue;
create policy "indexing_queue_admin" on indexing_queue for all
  using (is_super_admin() or is_city_admin(city_id))
  with check (is_super_admin() or is_city_admin(city_id));

drop policy if exists "search_queries_admin_read" on search_queries;
create policy "search_queries_admin_read" on search_queries for select
  using (is_super_admin() or is_city_admin(city_id));

drop policy if exists "search_queries_insert_anyone" on search_queries;
create policy "search_queries_insert_anyone" on search_queries for insert
  with check (true);

create or replace function public.match_embeddings(
  p_city_id uuid,
  p_query_vector vector(1536),
  p_limit int default 20,
  p_entity_types text[] default null
) returns table (
  entity_type text,
  entity_id uuid,
  score double precision
) language sql stable as $$
  select e.entity_type, e.entity_id, 1 - (e.embedding <=> p_query_vector) as score
  from embeddings e
  where e.city_id = p_city_id
    and e.embedding is not null
    and (p_entity_types is null or e.entity_type = any(p_entity_types))
  order by e.embedding <=> p_query_vector
  limit p_limit;
$$;

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

  if (new.status in ('active', 'approved', 'published')) then
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

drop trigger if exists businesses_indexing on businesses;
create trigger businesses_indexing
  after insert or update or delete on businesses
  for each row execute function enqueue_indexing('business');

drop trigger if exists accommodations_indexing on accommodations;
create trigger accommodations_indexing
  after insert or update or delete on accommodations
  for each row execute function enqueue_indexing('accommodation');

drop trigger if exists restaurants_indexing on restaurants;
create trigger restaurants_indexing
  after insert or update or delete on restaurants
  for each row execute function enqueue_indexing('restaurant');

drop trigger if exists fishing_guides_indexing on fishing_guides;
create trigger fishing_guides_indexing
  after insert or update or delete on fishing_guides
  for each row execute function enqueue_indexing('fishing_guide');

drop trigger if exists events_indexing on events;
create trigger events_indexing
  after insert or update or delete on events
  for each row execute function enqueue_indexing('event');

drop trigger if exists classifieds_indexing on classifieds;
create trigger classifieds_indexing
  after insert or update or delete on classifieds
  for each row execute function enqueue_indexing('classified');

drop trigger if exists properties_indexing on properties;
create trigger properties_indexing
  after insert or update or delete on properties
  for each row execute function enqueue_indexing('property');

drop trigger if exists attractions_indexing on attractions;
create trigger attractions_indexing
  after insert or update or delete on attractions
  for each row execute function enqueue_indexing('attraction');

drop trigger if exists tour_packages_indexing on tour_packages;
create trigger tour_packages_indexing
  after insert or update or delete on tour_packages
  for each row execute function enqueue_indexing('tour_package');
