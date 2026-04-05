-- Protecao de dados do cliente por usuario autenticado (RLS)
-- Execute este script no SQL Editor do Supabase.

alter table public.clients
  add column if not exists email text,
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists clients_auth_user_id_unique_idx
on public.clients (auth_user_id)
where auth_user_id is not null;

create unique index if not exists clients_email_unique_lower_idx
on public.clients (lower(email))
where email is not null;

alter table public.clients enable row level security;
alter table public.purchases enable row level security;
alter table public.reward_redemptions enable row level security;

-- Remove politicas antigas abertas (select true para qualquer autenticado)
drop policy if exists "client_read_clients" on public.clients;
drop policy if exists "client_read_purchases" on public.purchases;
drop policy if exists "client_read_redemptions" on public.reward_redemptions;

-- Recria politicas administrativas
create policy if not exists "admin_insert_clients" on public.clients
for insert to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

create policy if not exists "admin_update_clients" on public.clients
for update to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

create policy if not exists "admin_insert_purchases" on public.purchases
for insert to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

create policy if not exists "admin_insert_redemptions" on public.reward_redemptions
for insert to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

-- Leitura: admin ve tudo; cliente ve somente o proprio registro
create policy if not exists "client_select_own_or_admin_clients" on public.clients
for select to authenticated
using (
  auth_user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);

-- Permite vinculo inicial do cliente autenticado ao proprio cadastro por e-mail
drop policy if exists "client_link_own_email_clients" on public.clients;

-- Permite vinculo inicial por e-mail (quando pre-cadastro ja tem e-mail)
-- ou por telefone (quando pre-cadastro foi criado sem e-mail no admin).
create policy if not exists "client_link_own_email_or_phone_clients" on public.clients
for update to authenticated
using (
  auth_user_id is null
  and (
    lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.profiles p
      where p.auth_user_id = auth.uid()
        and regexp_replace(coalesce(p.phone, ''), '\\D', '', 'g') = public.clients.phone_digits
    )
  )
)
with check (
  auth_user_id = auth.uid()
  and (
    lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or exists (
      select 1
      from public.profiles p
      where p.auth_user_id = auth.uid()
        and regexp_replace(coalesce(p.phone, ''), '\\D', '', 'g') = public.clients.phone_digits
    )
  )
);

-- Permite atualizar o proprio registro (necessario para fluxo atual de pontos no cliente)
create policy if not exists "client_update_own_clients" on public.clients
for update to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

-- Compras: cliente ve apenas compras do proprio cadastro; admin ve tudo
create policy if not exists "client_select_own_or_admin_purchases" on public.purchases
for select to authenticated
using (
  exists (
    select 1
    from public.clients c
    where c.id = public.purchases.client_id
      and (
        c.auth_user_id = auth.uid()
        or exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and lower(coalesce(p.role, '')) = 'admin'
        )
      )
  )
);

-- Resgates: cliente ve apenas os proprios; admin ve tudo
create policy if not exists "client_select_own_or_admin_redemptions" on public.reward_redemptions
for select to authenticated
using (
  exists (
    select 1
    from public.clients c
    where c.id = public.reward_redemptions.client_id
      and (
        c.auth_user_id = auth.uid()
        or exists (
          select 1
          from public.profiles p
          where p.id = auth.uid()
            and lower(coalesce(p.role, '')) = 'admin'
        )
      )
  )
);

-- Resgate no app do cliente (fluxo atual): permitir insert apenas para o proprio client_id
create policy if not exists "client_insert_own_redemptions" on public.reward_redemptions
for insert to authenticated
with check (
  exists (
    select 1
    from public.clients c
    where c.id = public.reward_redemptions.client_id
      and c.auth_user_id = auth.uid()
  )
);
