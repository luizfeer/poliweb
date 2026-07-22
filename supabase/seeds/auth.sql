-- ============================================================================
-- SEED AUTH — usuários de smoke test do painel
-- ============================================================================
--
-- Senha local/remota para todos: CarmoLocal123!
-- Emails:
--   super@carmolocal.test
--   admin@carmolocal.test
--   merchant@carmolocal.test
--   citizen@carmolocal.test

with seed_users as (
  select *
  from (values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'super@carmolocal.test',    'Super Admin Carmo Local'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'admin@carmolocal.test',    'Admin Carmo do Rio Claro'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'merchant@carmolocal.test', 'Comerciante Demo'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'citizen@carmolocal.test',  'Cidadão Demo')
  ) as u(id, email, full_name)
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  crypt('CarmoLocal123!', gen_salt('bf')),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name),
  now(),
  now()
from seed_users
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  email_change_token_current = excluded.email_change_token_current,
  phone_change = excluded.phone_change,
  phone_change_token = excluded.phone_change_token,
  reauthentication_token = excluded.reauthentication_token,
  updated_at = now();

with seed_users as (
  select *
  from (values
    ('00000000-0000-4000-8000-000000000001'::uuid, 'super@carmolocal.test',    'Super Admin Carmo Local'),
    ('00000000-0000-4000-8000-000000000002'::uuid, 'admin@carmolocal.test',    'Admin Carmo do Rio Claro'),
    ('00000000-0000-4000-8000-000000000003'::uuid, 'merchant@carmolocal.test', 'Comerciante Demo'),
    ('00000000-0000-4000-8000-000000000004'::uuid, 'citizen@carmolocal.test',  'Cidadão Demo')
  ) as u(id, email, full_name)
)
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id,
  id::text,
  id,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true, 'full_name', full_name),
  'email',
  now(),
  now(),
  now()
from seed_users
on conflict (provider, provider_id) do update
set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, full_name, default_city_id, consent_marketing)
select u.id, u.full_name, c.id, false
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'Super Admin Carmo Local'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'Admin Carmo do Rio Claro'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'Comerciante Demo'),
  ('00000000-0000-4000-8000-000000000004'::uuid, 'Cidadão Demo')
) as u(id, full_name)
cross join public.cities c
where c.slug = 'carmo-do-rio-claro'
on conflict (id) do update
set
  full_name = excluded.full_name,
  default_city_id = excluded.default_city_id;

with crc as (select id from public.cities where slug = 'carmo-do-rio-claro')
insert into public.profile_roles (profile_id, city_id, role, granted_by)
select '00000000-0000-4000-8000-000000000001'::uuid, null, 'super_admin'::public.role_kind, null
where not exists (
  select 1
  from public.profile_roles
  where profile_id = '00000000-0000-4000-8000-000000000001'::uuid
    and city_id is null
    and role = 'super_admin'
)
union all
select '00000000-0000-4000-8000-000000000002'::uuid, crc.id, 'city_admin'::public.role_kind, '00000000-0000-4000-8000-000000000001'::uuid from crc
on conflict (profile_id, city_id, role) do nothing;

with crc as (select id from public.cities where slug = 'carmo-do-rio-claro')
insert into public.profile_roles (profile_id, city_id, role, granted_by)
select profile_id, crc.id, role, '00000000-0000-4000-8000-000000000002'::uuid
from crc, (values
  ('00000000-0000-4000-8000-000000000003'::uuid, 'merchant'::public.role_kind),
  ('00000000-0000-4000-8000-000000000004'::uuid, 'citizen'::public.role_kind)
) as r(profile_id, role)
on conflict (profile_id, city_id, role) do nothing;
