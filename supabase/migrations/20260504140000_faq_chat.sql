-- ============================================================================
-- FAQ + Chat search
-- ============================================================================

create table if not exists city_faqs (
  id         uuid primary key default gen_random_uuid(),
  city_id    uuid not null references cities(id) on delete cascade,
  question   text not null,
  answer     text not null,
  is_active  boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists city_faqs_city_idx on city_faqs(city_id, is_active);

create trigger city_faqs_set_updated_at
  before update on city_faqs
  for each row execute function set_updated_at();

alter table city_faqs enable row level security;

create policy "faq_public_read" on city_faqs for select
  using (is_active = true);

create policy "faq_admin_all" on city_faqs for all
  using (is_super_admin() or is_city_admin(city_id))
  with check (is_super_admin() or is_city_admin(city_id));

-- Trigger para enfileirar FAQs no indexing_queue
create or replace function enqueue_faq_indexing()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'DELETE') then
    insert into indexing_queue (entity_type, entity_id, city_id, operation)
    values ('faq', old.id, old.city_id, 'delete')
    on conflict (entity_type, entity_id) do update
      set operation = 'delete', processed_at = null, attempts = 0, enqueued_at = now();
    return old;
  end if;

  if new.is_active then
    insert into indexing_queue (entity_type, entity_id, city_id, operation)
    values ('faq', new.id, new.city_id, 'upsert')
    on conflict (entity_type, entity_id) do update
      set operation = 'upsert', processed_at = null, attempts = 0, enqueued_at = now();
  else
    insert into indexing_queue (entity_type, entity_id, city_id, operation)
    values ('faq', new.id, new.city_id, 'delete')
    on conflict (entity_type, entity_id) do update
      set operation = 'delete', processed_at = null, attempts = 0, enqueued_at = now();
  end if;
  return new;
end;
$$;

create trigger city_faqs_indexing
  after insert or update or delete on city_faqs
  for each row execute function enqueue_faq_indexing();
