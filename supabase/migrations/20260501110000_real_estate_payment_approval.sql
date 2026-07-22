-- ============================================================================
-- 0024 - Real estate: approval cycle, pricing snapshots and payment hooks
-- ============================================================================

do $$ begin
  create type property_payment_status as enum ('not_required', 'pending', 'paid', 'waived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_review_status as enum ('pending', 'approved', 'rejected', 'needs_changes');
exception when duplicate_object then null; end $$;

do $$ begin
  create type realtor_subscription_plan as enum ('free', 'pro', 'premium');
exception when duplicate_object then null; end $$;

alter table public.properties
  add column if not exists published_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists payment_status property_payment_status not null default 'not_required',
  add column if not exists payment_amount_cents int not null default 0 check (payment_amount_cents >= 0),
  add column if not exists payment_provider_ref text,
  add column if not exists review_status property_review_status not null default 'pending',
  add column if not exists rejection_reason text,
  add column if not exists review_decided_by_profile_id uuid references public.profiles(id) on delete set null,
  add column if not exists review_decided_at timestamptz,
  add column if not exists featured_until timestamptz;

alter table public.realtors
  add column if not exists subscription_plan realtor_subscription_plan not null default 'free',
  add column if not exists subscription_renews_at timestamptz;

update public.properties
set review_status = 'approved'
where status = 'published' and review_status = 'pending';

update public.properties
set expires_at = coalesce(expires_at, published_at + interval '90 days', now() + interval '90 days')
where status = 'published';

update public.realtors
set subscription_plan =
  case
    when plan in ('pro', 'premium') then plan::realtor_subscription_plan
    else 'free'::realtor_subscription_plan
  end;

create index if not exists idx_properties_city_review
  on public.properties(city_id, review_status, created_at desc);

create index if not exists idx_properties_public
  on public.properties(city_id, featured desc, published_at desc)
  where status = 'published' and review_status = 'approved';

create index if not exists idx_properties_payment_ref
  on public.properties(payment_provider_ref)
  where payment_provider_ref is not null;

update public.city_modules
set config = coalesce(config, '{}'::jsonb)
  || jsonb_build_object('real_estate_payment_active', false)
where module_key = 'real_estate'
  and not (coalesce(config, '{}'::jsonb) ? 'real_estate_payment_active');

drop policy if exists "properties_public_read_published" on public.properties;
create policy "properties_public_read_published" on public.properties for select
  using (
    status = 'published'
    and review_status = 'approved'
    and (expires_at is null or expires_at > now())
  );

drop policy if exists "properties_delete" on public.properties;
create policy "properties_admin_delete" on public.properties for delete
  using (public.is_city_admin(city_id));

create or replace function public.archive_expired_properties()
returns integer
language plpgsql
security definer
as $$
declare
  archived_count integer;
begin
  update public.properties
  set status = 'archived'
  where status = 'published'
    and expires_at is not null
    and expires_at < now();

  get diagnostics archived_count = row_count;
  return archived_count;
end;
$$;
