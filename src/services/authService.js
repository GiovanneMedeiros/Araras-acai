import { assertSupabaseConfigured, supabase } from "../lib/supabase.js"

const PROFILES_TABLE = "profiles"

function getErrorMessage(error, fallback) {
  if (!error) return fallback
  return error.message || fallback
}

async function getProfileByUserId(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from(PROFILES_TABLE)
    .select("id, role")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(
      getErrorMessage(error, "Nao foi possivel validar perfil do usuario.")
    )
  }

  return data
}

function isAdminRole(role) {
  return String(role || "").toLowerCase() === "admin"
}

async function validateAdminProfile(user) {
  if (!user?.id) {
    throw new Error("Sessao invalida para validacao administrativa.")
  }

  const profile = await getProfileByUserId(user.id)

  if (!profile) {
    throw new Error("Perfil nao encontrado. Contate o suporte da plataforma.")
  }

  if (!isAdminRole(profile.role)) {
    throw new Error("Usuario sem permissao para acessar o painel admin.")
  }

  return profile
}

export async function signInAdmin(email, password) {
  assertSupabaseConfigured()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(getErrorMessage(error, "Falha ao entrar no admin."))
  }

  const user = data.user ?? data.session?.user ?? null

  try {
    await validateAdminProfile(user)
  } catch (validationError) {
    await supabase.auth.signOut()
    throw validationError
  }

  return data
}

export async function signOutAdmin() {
  assertSupabaseConfigured()

  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(getErrorMessage(error, "Falha ao sair da sessao."))
  }
}

export async function getCurrentSession() {
  assertSupabaseConfigured()

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error(getErrorMessage(error, "Falha ao ler sessao atual."))
  }

  return session ?? null
}

export async function getCurrentUser() {
  const session = await getCurrentSession()
  return session?.user ?? null
}

export async function getCurrentAuthState() {
  const session = await getCurrentSession()

  if (!session?.user) {
    return {
      session: null,
      user: null,
      isAdmin: false,
    }
  }

  try {
    await validateAdminProfile(session.user)

    return {
      session,
      user: session.user,
      isAdmin: true,
    }
  } catch {
    return {
      session,
      user: session.user,
      isAdmin: false,
    }
  }
}

export function onAdminAuthStateChange(listener) {
  assertSupabaseConfigured()

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    listener(session)
  })

  return () => {
    data.subscription.unsubscribe()
  }
}
