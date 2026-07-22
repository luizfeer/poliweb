-- ============================================================================
-- 0007 — TRANSPARÊNCIA + ANÚNCIOS + IA/EMBEDDINGS
-- ============================================================================

-- ── Transparência ──────────────────────────────────────────────────────────

create table official_diaries (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  date date not null,
  number text,
  source_url text,
  raw_storage_path text,
  processed boolean default false,
  pages int,
  created_at timestamptz default now(),
  unique (city_id, date, number)
);

create table diary_acts (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid not null references official_diaries(id) on delete cascade,
  act_type text,                               -- 'lei','decreto','portaria','licitacao','nomeacao'
  number text,
  title text,
  summary_ai text,
  raw_text text,
  source_references jsonb default '[]'::jsonb,
  importance text default 'normal',            -- 'low','normal','high'
  created_at timestamptz default now()
);

create index idx_acts_diary on diary_acts(diary_id);

create table council_meetings (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  date date not null,
  session_type text,                           -- 'ordinaria','extraordinaria'
  source_url text,
  audio_url text,
  transcript_storage_path text,
  summary_ai text,
  processed boolean default false,
  created_at timestamptz default now()
);

create table council_topics (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references council_meetings(id) on delete cascade,
  author_councilor text,
  title text,
  topic_type text,                             -- 'projeto_lei','requerimento','indicacao'
  summary_ai text,
  vote_result text,                            -- 'aprovado','rejeitado','retirado'
  created_at timestamptz default now()
);

create table public_tenders (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  number text,
  title text not null,
  summary_ai text,
  modality text,                               -- 'pregao','concorrencia','dispensa'
  estimated_value numeric(14,2),
  deadline timestamptz,
  status text default 'open',                  -- open | closed | cancelled | awarded
  source_url text,
  raw_text text,
  created_at timestamptz default now()
);

create table public_works (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  district_id uuid references districts(id) on delete set null,
  title text not null,
  description text,
  contractor text,
  value numeric(14,2),
  start_date date,
  expected_end date,
  current_status text,                         -- 'planejada','iniciada','em_andamento','paralisada','concluida'
  progress_percent int,
  lat double precision,
  lng double precision,
  cover_url text,
  photos jsonb default '[]'::jsonb,
  source_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create trigger trg_works_updated before update on public_works for each row execute function public.set_updated_at();

-- ── Anúncios (slots prontos, ativados pós-tração) ──────────────────────────

create table ad_slots (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id) on delete cascade,  -- null = global
  key text not null,                           -- 'home_top','sidebar','category_*','listing_inline'
  description text,
  width int,
  height int,
  active boolean default true,
  created_at timestamptz default now(),
  unique (city_id, key)
);

create table advertisements (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references cities(id) on delete cascade,
  slot_id uuid not null references ad_slots(id) on delete cascade,
  advertiser_business_id uuid references businesses(id) on delete set null,
  advertiser_realtor_id uuid references realtors(id) on delete set null,
  title text,
  image_url text not null,
  target_url text not null,
  start_at timestamptz default now(),
  end_at timestamptz,
  active boolean default true,
  impressions int default 0,
  clicks int default 0,
  created_at timestamptz default now()
);

create index idx_ads_active on advertisements(slot_id, active, end_at);

-- ── IA, jobs e embeddings ───────────────────────────────────────────────────

create table ai_jobs (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id) on delete set null,
  job_type text not null,                      -- 'summarize_diary','moderate_ugc','seo_meta',...
  status text default 'queued',                -- queued|running|completed|failed
  model text,
  input_ref jsonb,
  output_ref jsonb,
  tokens_input int,
  tokens_output int,
  cost_usd numeric(8,4),
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

create index idx_ai_jobs_status on ai_jobs(status, created_at desc);

create table embeddings (
  id uuid primary key default gen_random_uuid(),
  city_id uuid references cities(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now(),
  unique (entity_type, entity_id)
);

create index idx_embeddings_lookup on embeddings(entity_type, entity_id);
create index idx_embeddings_vector on embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table official_diaries enable row level security;
alter table diary_acts       enable row level security;
alter table council_meetings enable row level security;
alter table council_topics   enable row level security;
alter table public_tenders   enable row level security;
alter table public_works     enable row level security;
alter table ad_slots         enable row level security;
alter table advertisements   enable row level security;
alter table ai_jobs          enable row level security;
alter table embeddings       enable row level security;

create policy "transparency_read_diaries"  on official_diaries for select using (true);
create policy "transparency_read_acts"     on diary_acts        for select using (true);
create policy "transparency_read_meetings" on council_meetings  for select using (true);
create policy "transparency_read_topics"   on council_topics    for select using (true);
create policy "transparency_read_tenders"  on public_tenders    for select using (true);
create policy "transparency_read_works"    on public_works      for select using (true);

create policy "transparency_admin_diaries"  on official_diaries for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));
create policy "transparency_admin_acts"     on diary_acts        for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "transparency_admin_meetings" on council_meetings  for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));
create policy "transparency_admin_topics"   on council_topics    for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "transparency_admin_tenders"  on public_tenders    for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));
create policy "transparency_admin_works"    on public_works      for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

create policy "ads_slots_read"     on ad_slots       for select using (active);
create policy "ads_slots_admin"    on ad_slots       for all using (public.is_super_admin() or (city_id is not null and public.is_city_admin(city_id))) with check (public.is_super_admin() or (city_id is not null and public.is_city_admin(city_id)));
create policy "ads_read_active"    on advertisements for select using (active and (end_at is null or end_at > now()));
create policy "ads_admin"          on advertisements for all using (public.is_city_admin(city_id)) with check (public.is_city_admin(city_id));

create policy "ai_jobs_admin"      on ai_jobs   for all using (public.is_super_admin() or (city_id is not null and public.is_city_admin(city_id))) with check (public.is_super_admin() or (city_id is not null and public.is_city_admin(city_id)));
create policy "embeddings_admin"   on embeddings for all using (public.is_super_admin() or (city_id is not null and public.is_city_admin(city_id))) with check (public.is_super_admin() or (city_id is not null and public.is_city_admin(city_id)));
