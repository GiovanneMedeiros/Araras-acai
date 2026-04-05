create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id bigint generated always as identity primary key,
  name text not null,
  phone text not null,
  phone_digits text not null unique,
  points integer not null default 0,
  total_spent numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  value numeric(10,2) not null,
  points integer not null,
  purchased_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.reward_redemptions (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  cost integer not null,
  label text not null,
  addons jsonb not null default '[]'::jsonb,
  additional_total numeric(10,2) not null default 0,
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.clients enable row level security;
alter table public.purchases enable row level security;
alter table public.reward_redemptions enable row level security;

create policy if not exists "client_read_clients" on public.clients
for select to authenticated using (true);

create policy if not exists "client_read_purchases" on public.purchases
for select to authenticated using (true);

create policy if not exists "client_read_redemptions" on public.reward_redemptions
for select to authenticated using (true);

create policy if not exists "admin_insert_clients" on public.clients
for insert to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and lower(coalesce(p.role, '')) = 'admin'
));

create policy if not exists "admin_update_clients" on public.clients
for update to authenticated
using (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and lower(coalesce(p.role, '')) = 'admin'
))
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and lower(coalesce(p.role, '')) = 'admin'
));

create policy if not exists "admin_insert_purchases" on public.purchases
for insert to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and lower(coalesce(p.role, '')) = 'admin'
));

create policy if not exists "admin_insert_redemptions" on public.reward_redemptions
for insert to authenticated
with check (exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and lower(coalesce(p.role, '')) = 'admin'
));
