-- Diagnostico e correcao de vinculo por telefone/e-mail
-- Execute no SQL Editor do Supabase.

begin;

-- Parametros do caso
with params as (
  select
    '11971859061'::text as phone_digits,
    lower('SEU_EMAIL_AQUI@example.com')::text as email,
    'Micaella'::text as full_name
)
select * from params;

-- 1) Verifica usuario no auth
with params as (
  select lower('SEU_EMAIL_AQUI@example.com')::text as email
)
select
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at,
  u.last_sign_in_at
from auth.users u
join params p on lower(u.email) = p.email;

-- 2) Verifica cadastro em clients pelo telefone
with params as (
  select '11971859061'::text as phone_digits
)
select
  c.id,
  c.name,
  c.phone,
  c.phone_digits,
  c.email,
  c.auth_user_id,
  c.points,
  c.total_spent,
  c.created_at
from public.clients c
join params p on c.phone_digits = p.phone_digits
order by c.created_at desc;

-- 3) Verifica profile pelo telefone
with params as (
  select '11971859061'::text as phone_digits
)
select
  p.id,
  p.role,
  p.full_name,
  p.phone,
  p.email,
  p.auth_user_id,
  p.points,
  p.is_completed,
  p.created_at
from public.profiles p
join params x
  on regexp_replace(coalesce(p.phone, ''), '\\D', '', 'g') = x.phone_digits
order by p.created_at desc;

-- 4) Corrige clients: vincula auth_user_id e email no pre-cadastro por telefone (se ainda estiver null)
with params as (
  select
    '11971859061'::text as phone_digits,
    lower('SEU_EMAIL_AQUI@example.com')::text as email
),
target_user as (
  select u.id, lower(u.email) as email
  from auth.users u
  join params p on lower(u.email) = p.email
  limit 1
)
update public.clients c
set
  auth_user_id = u.id,
  email = u.email,
  phone = p.phone_digits,
  phone_digits = p.phone_digits
from target_user u, params p
where c.phone_digits = p.phone_digits
  and c.auth_user_id is null
returning c.id, c.name, c.phone_digits, c.email, c.auth_user_id;

-- 5) Corrige profiles: atualiza profile existente pelo telefone
with params as (
  select
    '11971859061'::text as phone_digits,
    lower('SEU_EMAIL_AQUI@example.com')::text as email,
    'Micaella'::text as full_name
),
target_user as (
  select u.id, lower(u.email) as email
  from auth.users u
  join params p on lower(u.email) = p.email
  limit 1
)
update public.profiles p
set
  auth_user_id = u.id,
  email = u.email,
  full_name = coalesce(nullif(p.full_name, ''), prm.full_name),
  phone = prm.phone_digits,
  is_completed = true,
  role = coalesce(nullif(p.role, ''), 'client')
from target_user u, params prm
where regexp_replace(coalesce(p.phone, ''), '\\D', '', 'g') = prm.phone_digits
  and p.auth_user_id is null
returning p.id, p.phone, p.email, p.auth_user_id, p.is_completed;

-- 6) Se nao existir profile para o telefone, cria um novo
with params as (
  select
    '11971859061'::text as phone_digits,
    lower('SEU_EMAIL_AQUI@example.com')::text as email,
    'Micaella'::text as full_name
),
target_user as (
  select u.id, lower(u.email) as email
  from auth.users u
  join params p on lower(u.email) = p.email
  limit 1
),
profile_exists as (
  select 1 as found
  from public.profiles p
  join params prm on regexp_replace(coalesce(p.phone, ''), '\\D', '', 'g') = prm.phone_digits
  limit 1
)
insert into public.profiles (
  id,
  role,
  email,
  auth_user_id,
  phone,
  full_name,
  points,
  is_completed
)
select
  u.id,
  'client',
  u.email,
  u.id,
  prm.phone_digits,
  prm.full_name,
  0,
  true
from target_user u
cross join params prm
where not exists (select 1 from profile_exists)
on conflict (id) do update
set
  role = excluded.role,
  email = excluded.email,
  auth_user_id = excluded.auth_user_id,
  phone = excluded.phone,
  full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
  is_completed = true
returning id, role, email, auth_user_id, phone, full_name, is_completed;

-- 7) Verificacao final
with params as (
  select
    '11971859061'::text as phone_digits,
    lower('SEU_EMAIL_AQUI@example.com')::text as email
)
select
  c.id as client_id,
  c.name,
  c.phone_digits,
  c.email as client_email,
  c.auth_user_id as client_auth_user_id,
  p.id as profile_id,
  p.email as profile_email,
  p.auth_user_id as profile_auth_user_id,
  p.is_completed,
  u.email_confirmed_at
from params prm
left join public.clients c on c.phone_digits = prm.phone_digits
left join public.profiles p on regexp_replace(coalesce(p.phone, ''), '\\D', '', 'g') = prm.phone_digits
left join auth.users u on u.id = coalesce(c.auth_user_id, p.auth_user_id);

commit;
