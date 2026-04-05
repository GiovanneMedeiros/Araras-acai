create extension if not exists "pgcrypto";

create table if not exists public.reward_options (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  points integer not null,
  created_at timestamptz not null default now()
);

insert into public.reward_options (label, points)
select 'Açaí 300ml', 10
where not exists (
  select 1 from public.reward_options where label = 'Açaí 300ml'
);

insert into public.reward_options (label, points)
select 'Açaí 500ml', 15
where not exists (
  select 1 from public.reward_options where label = 'Açaí 500ml'
);

insert into public.reward_options (label, points)
select 'Açaí 700ml', 20
where not exists (
  select 1 from public.reward_options where label = 'Açaí 700ml'
);
