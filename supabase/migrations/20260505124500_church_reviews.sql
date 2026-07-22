-- Church reviews: citizen ratings, moderation and church replies.

create table if not exists public.church_reviews (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references public.churches(id) on delete cascade,
  author_profile_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text,
  comment text,
  status public.entity_status default 'pending',
  reply_owner text,
  reply_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (church_id, author_profile_id)
);

create index if not exists idx_church_reviews_church
on public.church_reviews(church_id, status, created_at desc);

drop trigger if exists trg_church_reviews_updated on public.church_reviews;
create trigger trg_church_reviews_updated
before update on public.church_reviews
for each row execute function public.set_updated_at();

alter table public.church_reviews enable row level security;

drop policy if exists "church_reviews_public_read" on public.church_reviews;
create policy "church_reviews_public_read"
on public.church_reviews for select
using (status = 'published' or author_profile_id = auth.uid() or public.manages_church(church_id));

drop policy if exists "church_reviews_self_create" on public.church_reviews;
create policy "church_reviews_self_create"
on public.church_reviews for insert
with check (author_profile_id = auth.uid());

drop policy if exists "church_reviews_self_update" on public.church_reviews;
create policy "church_reviews_self_update"
on public.church_reviews for update
using (author_profile_id = auth.uid() and status in ('draft', 'pending'))
with check (author_profile_id = auth.uid());

drop policy if exists "church_reviews_admin_moderate" on public.church_reviews;
create policy "church_reviews_admin_moderate"
on public.church_reviews for update
using (public.manages_church(church_id))
with check (public.manages_church(church_id));
