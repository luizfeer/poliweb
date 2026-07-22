-- Corrige ambientes onde a migration antiga criou business_page_events antes
-- da versão com session_hash/source/referrer.
alter table public.business_page_events
  add column if not exists session_hash varchar(64),
  add column if not exists referrer text,
  add column if not exists source varchar(40);

update public.business_page_events
set session_hash = left(session_id, 64)
where session_hash is null
  and session_id is not null;

update public.business_page_events
set
  source = coalesce(source, metadata->>'source'),
  referrer = coalesce(referrer, metadata->>'referrer')
where metadata is not null;

update public.business_page_events
set session_hash = coalesce(session_hash, 'legacy-' || left(id::text, 57));

alter table public.business_page_events
  alter column session_hash set not null;

create index if not exists bpe_session_dedup_idx
  on public.business_page_events(session_hash, business_id, event_type, occurred_at);
