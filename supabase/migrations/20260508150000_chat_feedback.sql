-- Feedback do assistente: 👍 / 👎 nas respostas do chat.
-- Usado para identificar regressões e melhorar prompts/tools.

create table public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  -- ID da sessão local (IndexedDB) — útil pra correlacionar várias mensagens
  session_local_id text,
  rating text not null check (rating in ('up', 'down')),
  query text not null,
  -- Conteúdo da resposta avaliada
  response_text text,
  response_blocks jsonb,
  -- Histórico até a pergunta avaliada (últimas N mensagens)
  conversation jsonb,
  -- Comentário opcional do usuário (preenchido apenas no 👎)
  comment text,
  -- Metadados pra triagem
  model text,
  intent text,
  page_context text,
  channel text default 'web',
  created_at timestamptz not null default now()
);

create index idx_chat_feedback_city_rating
  on public.chat_feedback (city_id, rating, created_at desc);

create index idx_chat_feedback_session
  on public.chat_feedback (session_local_id, created_at desc);

alter table public.chat_feedback enable row level security;

-- Insert aberto: feedback pode vir de cidadão anônimo (sem login).
-- A presença de city_id é validada pela FK; profile_id é opcional.
drop policy if exists "chat_feedback_insert" on public.chat_feedback;
create policy "chat_feedback_insert" on public.chat_feedback
  for insert with check (true);

-- Leitura restrita ao admin da cidade (city_admin ou super_admin).
drop policy if exists "chat_feedback_read" on public.chat_feedback;
create policy "chat_feedback_read" on public.chat_feedback
  for select using (public.is_city_admin(city_id));

-- Escrita/Delete restritos ao admin (caso queiram limpar manualmente).
drop policy if exists "chat_feedback_admin_write" on public.chat_feedback;
create policy "chat_feedback_admin_write" on public.chat_feedback
  for all using (public.is_city_admin(city_id))
  with check (public.is_city_admin(city_id));
