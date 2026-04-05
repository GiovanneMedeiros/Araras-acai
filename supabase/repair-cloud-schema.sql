alter table public.clients
  add column if not exists phone_digits text;

update public.clients
set phone_digits = regexp_replace(coalesce(phone, ''), '\\D', '', 'g')
where phone_digits is null or phone_digits = '';

create unique index if not exists clients_phone_digits_unique_idx
on public.clients (phone_digits);

alter table public.clients
  alter column phone_digits set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'clients'
      and c.conname = 'clients_phone_key'
  ) then
    alter table public.clients drop constraint clients_phone_key;
  end if;
end $$;

alter table public.purchases
  add column if not exists value numeric(10,2) not null default 0;

alter table public.purchases
  add column if not exists amount numeric(10,2) not null default 0;

update public.purchases
set value = coalesce(value, amount, 0)
where value is null;

update public.purchases
set amount = coalesce(amount, value, 0)
where amount is null;

alter table public.purchases
  add column if not exists points integer not null default 0;

alter table public.purchases
  add column if not exists points_earned integer not null default 0;

update public.purchases
set points = coalesce(points, points_earned, 0)
where points is null;

update public.purchases
set points_earned = coalesce(points_earned, points, 0)
where points_earned is null;

alter table public.purchases
  add column if not exists purchased_at timestamptz not null default now();

alter table public.purchases
  add column if not exists created_at timestamptz not null default now();

alter table public.reward_redemptions
  add column if not exists cost integer not null default 0;

alter table public.reward_redemptions
  add column if not exists label text not null default 'Recompensa';

alter table public.reward_redemptions
  add column if not exists addons jsonb not null default '[]'::jsonb;

alter table public.reward_redemptions
  add column if not exists additional_total numeric(10,2) not null default 0;

alter table public.reward_redemptions
  add column if not exists redeemed_at timestamptz not null default now();

alter table public.reward_redemptions
  add column if not exists created_at timestamptz not null default now();
