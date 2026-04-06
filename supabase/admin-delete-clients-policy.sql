-- Permite exclusao de clientes apenas para admins autenticados.
-- Execute este script no SQL Editor do Supabase.

alter table public.clients enable row level security;

drop policy if exists "admin_delete_clients" on public.clients;

create policy "admin_delete_clients" on public.clients
for delete to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and lower(coalesce(p.role, '')) = 'admin'
  )
);
