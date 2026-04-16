-- RPC para vincular pré-cadastro por telefone com mais segurança
-- Execute este script no SQL Editor do Supabase

create or replace function public.claim_client_by_phone(
  p_phone text,
  p_email text,
  p_full_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_uid uuid := auth.uid();
  v_auth_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  v_phone_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_input_email text := lower(trim(coalesce(p_email, '')));
  v_full_name text := trim(coalesce(p_full_name, ''));

  v_client_id bigint := null;
  v_profile_id uuid := null;

  v_client_auth_user_id uuid := null;
  v_profile_auth_user_id uuid := null;

  v_client_email text := '';
  v_profile_email text := '';

  v_clients_count integer := 0;
  v_profiles_count integer := 0;

  v_client_claimed boolean := false;
  v_profile_claimed boolean := false;
begin
  if v_uid is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if v_auth_email = '' then
    raise exception 'Não foi possível validar o e-mail da sessão autenticada.';
  end if;

  if v_phone_digits = '' or length(v_phone_digits) < 10 then
    raise exception 'Informe um WhatsApp válido para continuar.';
  end if;

  if v_input_email = '' then
    raise exception 'Informe um e-mail válido para continuar.';
  end if;

  if v_input_email <> v_auth_email then
    raise exception 'O e-mail informado não corresponde ao e-mail da sua sessão autenticada.';
  end if;

  if v_full_name <> '' and length(v_full_name) < 2 then
    raise exception 'Informe um nome válido.';
  end if;

  -- Verifica duplicidade em clients
  select count(*)
    into v_clients_count
  from public.clients c
  where c.phone_digits = v_phone_digits
     or regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_phone_digits;

  if v_clients_count > 1 then
    raise exception 'Existem múltiplos clientes com este telefone. Contate o suporte.';
  end if;

  -- Claim do client com lock
  if v_clients_count = 1 then
    select c.id, c.auth_user_id, lower(trim(coalesce(c.email, '')))
      into v_client_id, v_client_auth_user_id, v_client_email
    from public.clients c
    where c.phone_digits = v_phone_digits
       or regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') = v_phone_digits
    for update;

    if v_client_auth_user_id is not null and v_client_auth_user_id <> v_uid then
      raise exception 'Este telefone já está vinculado a outra conta.';
    end if;

    if v_client_email = '' then
      raise exception 'Já existe um pré-cadastro com este telefone, mas sem e-mail validado. Solicite à loja a liberação manual do acesso.';
    end if;

    if v_client_email <> v_auth_email then
      raise exception 'O telefone informado pertence a outro cadastro.';
    end if;

    update public.clients c
    set
      email = v_auth_email,
      auth_user_id = v_uid,
      phone_digits = v_phone_digits
    where c.id = v_client_id;

    v_client_claimed := true;
  end if;

  -- Verifica duplicidade em profiles
  select count(*)
    into v_profiles_count
  from public.profiles p
  where regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') = v_phone_digits;

  if v_profiles_count > 1 then
    raise exception 'Existem múltiplos perfis com este telefone. Contate o suporte.';
  end if;

  -- Claim do profile com lock
  if v_profiles_count = 1 then
    select p.id, p.auth_user_id, lower(trim(coalesce(p.email, '')))
      into v_profile_id, v_profile_auth_user_id, v_profile_email
    from public.profiles p
    where regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') = v_phone_digits
    for update;

    if v_profile_auth_user_id is not null and v_profile_auth_user_id <> v_uid then
      raise exception 'Este telefone já está vinculado a outra conta.';
    end if;

    if v_profile_email = '' then
      raise exception 'Já existe um perfil com este telefone, mas sem e-mail validado. Solicite à loja a liberação manual do acesso.';
    end if;

    if v_profile_email <> v_auth_email then
      raise exception 'O telefone informado pertence a outro cadastro.';
    end if;

    update public.profiles p
    set
      email = v_auth_email,
      auth_user_id = v_uid,
      full_name = case
        when v_full_name <> '' then v_full_name
        else p.full_name
      end,
      phone = case
        when coalesce(trim(p.phone), '') = '' then v_phone_digits
        else p.phone
      end,
      is_completed = true
    where p.id = v_profile_id;

    v_profile_claimed := true;
  end if;

  if not v_client_claimed and not v_profile_claimed then
    raise exception 'Nenhum pré-cadastro compatível foi encontrado para este telefone.';
  end if;

  return jsonb_build_object(
    'ok', true,
    'phone_digits', v_phone_digits,
    'client_claimed', v_client_claimed,
    'profile_claimed', v_profile_claimed,
    'client_id', v_client_id,
    'profile_id', v_profile_id
  );
end;
$$;

revoke all on function public.claim_client_by_phone(text, text, text) from public;
grant execute on function public.claim_client_by_phone(text, text, text) to authenticated;
