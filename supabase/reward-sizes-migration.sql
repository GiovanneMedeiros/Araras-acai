-- ============================================================
-- Migração: tabela reward_sizes
-- Gerenciamento dinâmico de tamanhos de açaí no sistema de fidelidade
-- Execute este script no SQL Editor do Supabase
-- ============================================================

create extension if not exists "uuid-ossp";

-- Cria a tabela
create table if not exists public.reward_sizes (
  id                 uuid primary key default uuid_generate_v4(),
  name               text not null,
  volume_ml          integer not null,
  points_required    integer not null,
  free_toppings_limit integer not null default 3,
  is_active          boolean not null default true,
  sort_order         integer not null default 0,
  created_at         timestamp with time zone default now()
);

-- Habilita Row Level Security
alter table public.reward_sizes enable row level security;

-- Remove políticas antigas caso existam
drop policy if exists "reward_sizes_anon_read"    on public.reward_sizes;
drop policy if exists "reward_sizes_auth_read"    on public.reward_sizes;
drop policy if exists "reward_sizes_admin_insert" on public.reward_sizes;
drop policy if exists "reward_sizes_admin_update" on public.reward_sizes;
drop policy if exists "reward_sizes_admin_delete" on public.reward_sizes;

-- Leitura anônima: apenas tamanhos ativos (tela do cliente sem login)
create policy "reward_sizes_anon_read"
  on public.reward_sizes
  for select
  to anon
  using (is_active = true);

-- Leitura autenticada:
--   cliente normal → apenas ativos
--   admin          → todos (ativos + inativos)
create policy "reward_sizes_auth_read"
  on public.reward_sizes
  for select
  to authenticated
  using (
    is_active = true
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role, '')) = 'admin'
    )
  );

-- Insert: somente admin autenticado
create policy "reward_sizes_admin_insert"
  on public.reward_sizes
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role, '')) = 'admin'
    )
  );

-- Update: somente admin autenticado
create policy "reward_sizes_admin_update"
  on public.reward_sizes
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role, '')) = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role, '')) = 'admin'
    )
  );

-- Delete: somente admin autenticado
create policy "reward_sizes_admin_delete"
  on public.reward_sizes
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and lower(coalesce(p.role, '')) = 'admin'
    )
  );

-- Seed inicial (executa apenas se a tabela estiver vazia)
insert into public.reward_sizes (name, volume_ml, points_required, free_toppings_limit, is_active, sort_order)
select t.name, t.volume_ml, t.points_required, t.free_toppings_limit, t.is_active, t.sort_order
from (values
  ('Açaí 300ml',  300,  300, 3, true, 1),
  ('Açaí 400ml',  400,  400, 3, true, 2),
  ('Açaí 500ml',  500,  500, 3, true, 3),
  ('Açaí 700ml',  700,  700, 3, true, 4),
  ('Açaí 1L',    1000, 1000, 6, true, 5)
) as t(name, volume_ml, points_required, free_toppings_limit, is_active, sort_order)
where not exists (select 1 from public.reward_sizes limit 1);
