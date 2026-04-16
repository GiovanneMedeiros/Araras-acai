-- RPC transacional para resgate do cliente com validacao atomica de saldo.
-- Execute este script no SQL Editor do Supabase.

create or replace function public.redeem_own_reward(
  p_client_id bigint,
  p_cost integer,
  p_label text,
  p_addons jsonb default '[]'::jsonb,
  p_additional_total numeric default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_client_id_safe bigint;
  v_client record;
  v_earned_points integer := 0;
  v_spent_points integer := 0;
  v_available_points integer := 0;
  v_remaining_points integer := 0;
  v_redeemed_at timestamptz := now();
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  v_client_id_safe := p_client_id;
  if v_client_id_safe is null then
    raise exception 'Cliente inválido para resgate.';
  end if;

  if p_cost is null or p_cost <= 0 then
    raise exception 'Custo da recompensa inválido.';
  end if;

  if trim(coalesce(p_label, '')) = '' then
    raise exception 'Informe a recompensa para continuar.';
  end if;

  if jsonb_typeof(coalesce(p_addons, '[]'::jsonb)) <> 'array' then
    raise exception 'Formato inválido de complementos.';
  end if;

  select c.id, c.name, c.auth_user_id
    into v_client
  from public.clients c
  where c.id = v_client_id_safe
  for update;

  if not found then
    raise exception 'Cliente não encontrado para resgate.';
  end if;

  -- Permite resgate se: (1) cliente está vinculado ao usuário autenticado OU (2) usuário é admin
  if v_client.auth_user_id is distinct from v_uid then
    if not exists (
      select 1 from public.profiles p
      where p.id = v_uid
        and lower(coalesce(p.role, '')) = 'admin'
    ) then
      raise exception 'Você não tem permissão para resgatar por este cadastro.';
    end if;
  end if;

  select coalesce(sum(coalesce(p.points, 0)), 0)
    into v_earned_points
  from public.purchases p
  where p.client_id = v_client_id_safe;

  select coalesce(sum(coalesce(r.cost, 0)), 0)
    into v_spent_points
  from public.reward_redemptions r
  where r.client_id = v_client_id_safe;

  v_available_points := greatest(v_earned_points - v_spent_points, 0);

  if v_available_points < p_cost then
    raise exception 'Pontos insuficientes para resgatar recompensa. Saldo atual: % / Necessário: %.', v_available_points, p_cost;
  end if;

  insert into public.reward_redemptions (
    client_id,
    cost,
    label,
    addons,
    additional_total,
    redeemed_at
  ) values (
    v_client_id_safe,
    p_cost,
    trim(p_label),
    coalesce(p_addons, '[]'::jsonb),
    coalesce(p_additional_total, 0),
    v_redeemed_at
  );

  v_remaining_points := v_available_points - p_cost;

  update public.clients c
  set points = v_remaining_points
  where c.id = v_client_id_safe;

  return jsonb_build_object(
    'ok', true,
    'client_id', v_client_id_safe,
    'client_name', v_client.name,
    'remaining_points', v_remaining_points,
    'redeemed_at', v_redeemed_at
  );
end;
$$;

revoke all on function public.redeem_own_reward(bigint, integer, text, jsonb, numeric) from public;
grant execute on function public.redeem_own_reward(bigint, integer, text, jsonb, numeric) to authenticated;