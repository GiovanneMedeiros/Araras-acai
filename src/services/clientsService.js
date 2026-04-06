import { assertSupabaseConfigured, supabase } from "../lib/supabase.js"
import { normalizePhone } from "../utils/clientData.js"

const CLIENTS_TABLE = "clients"
const PROFILES_TABLE = "profiles"
const PURCHASES_TABLE = "purchases"
const REDEMPTIONS_TABLE = "reward_redemptions"

async function upsertProfileByPhone({ fullName, phone, email, authUserId, isCompleted }) {
  const cleanName = String(fullName || "").trim()
  const cleanEmail = String(email || "").trim().toLowerCase()
  const cleanAuthUserId = String(authUserId || "").trim()
  const digits = normalizePhone(phone)

  if (!digits) {
    throw new Error("Informe um WhatsApp válido para continuar.")
  }

  const { data: exactPhoneRows, error: exactPhoneError } = await supabase
    .from(PROFILES_TABLE)
    .select("id, phone, auth_user_id, points")
    .eq("phone", digits)
    .limit(2)

  if (exactPhoneError) {
    console.error("[clientsService] Falha ao buscar profile por telefone exato:", exactPhoneError)
    throw new Error("Não foi possível validar o perfil por telefone. Tente novamente.")
  }

  if ((exactPhoneRows || []).length > 1) {
    throw new Error("Existem múltiplos perfis com este telefone. Contate o suporte.")
  }

  let existingProfile = exactPhoneRows?.[0] || null

  if (!existingProfile) {
    // Fallback para dados legados com telefone salvo em formatos diferentes.
    const { data: profileRows, error: profileRowsError } = await supabase
      .from(PROFILES_TABLE)
      .select("id, phone, auth_user_id, points")
      .not("phone", "is", null)

    if (profileRowsError) {
      console.error("[clientsService] Falha ao buscar profiles para normalizacao:", profileRowsError)
      throw new Error("Não foi possível validar o perfil por telefone. Tente novamente.")
    }

    const matches = (profileRows || []).filter((row) => normalizePhone(row.phone) === digits)

    if (matches.length > 1) {
      throw new Error("Existem múltiplos perfis com este telefone. Contate o suporte.")
    }

    existingProfile = matches[0] || null
  }

  if (existingProfile?.id) {
    const currentAuthUserId = String(existingProfile.auth_user_id || "").trim()

    if (currentAuthUserId && cleanAuthUserId && currentAuthUserId !== cleanAuthUserId) {
      throw new Error("Este telefone já está vinculado a outra conta.")
    }

    const payload = {
      phone: digits,
      full_name: cleanName,
      is_completed: Boolean(isCompleted),
    }

    if (cleanEmail) {
      payload.email = cleanEmail
    }

    if (!currentAuthUserId && cleanAuthUserId) {
      payload.auth_user_id = cleanAuthUserId
    }

    const { error: updateError } = await supabase
      .from(PROFILES_TABLE)
      .update(payload)
      .eq("id", existingProfile.id)

    if (updateError) {
      console.error("[clientsService] Falha ao atualizar profile existente:", updateError)
      const message = String(updateError?.message || "").toLowerCase()

      if (message.includes("email") && (message.includes("duplicate") || message.includes("unique"))) {
        throw new Error("Este e-mail já está em uso.")
      }

      throw new Error("Não foi possível atualizar o perfil do cliente. Tente novamente.")
    }

    return {
      wasLinked: !currentAuthUserId && Boolean(cleanAuthUserId),
    }
  }

  const insertPayload = {
    role: "client",
    email: cleanEmail || null,
    auth_user_id: cleanAuthUserId || null,
    phone: digits,
    full_name: cleanName,
    points: 0,
    is_completed: Boolean(isCompleted),
  }

  const { error: insertError } = await supabase.from(PROFILES_TABLE).insert(insertPayload)

  if (insertError) {
    console.error("[clientsService] Falha ao inserir novo profile:", insertError)
    const message = String(insertError?.message || "").toLowerCase()

    if (message.includes("email") && (message.includes("duplicate") || message.includes("unique"))) {
      throw new Error("Este e-mail já está em uso.")
    }

    if (message.includes("phone") && (message.includes("duplicate") || message.includes("unique"))) {
      throw new Error("Este telefone já está vinculado a outra conta.")
    }

    throw new Error("Não foi possível criar o perfil do cliente. Tente novamente.")
  }

  return {
    wasLinked: false,
  }
}

function isMissingPhoneDigitsColumn(error) {
  const message = String(error?.message || "").toLowerCase()
  return (
    message.includes("phone_digits") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  )
}

function throwPhoneDigitsMigrationError(error) {
  const message = String(error?.message || "").toLowerCase()

  if (
    message.includes("duplicate key value") &&
    (message.includes("clients_phone_digits") ||
      message.includes("clients_phone") ||
      message.includes("phone"))
  ) {
    throw new Error("Ja existe cliente cadastrado com esse telefone.")
  }

  if (isMissingPhoneDigitsColumn(error)) {
    throw new Error(
      "A coluna clients.phone_digits nao existe no banco. Execute a migracao SQL para adicionar e preencher essa coluna."
    )
  }

  throw new Error(error?.message || "Erro de persistencia de clientes.")
}

function mapClientRow(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || "",
    authUserId: row.auth_user_id || null,
    phoneDigits: row.phone_digits || normalizePhone(row.phone),
    points: Number(row.points || 0),
    totalSpent: Number(row.total_spent || 0),
    purchaseHistory: [],
    redeemedRewards: [],
  }
}

function isEmailDuplicatedError(error) {
  const message = String(error?.message || "").toLowerCase()
  return (
    message.includes("email") &&
    (message.includes("already") || message.includes("exists") || message.includes("registered"))
  )
}

function normalizeSignupError(error) {
  if (isEmailDuplicatedError(error)) {
    return "Este e-mail já está em uso."
  }

  return "Não foi possível concluir o cadastro. Tente novamente."
}

function isRlsOrPermissionError(error) {
  const message = String(error?.message || "").toLowerCase()
  return (
    message.includes("row level security") ||
    message.includes("permission denied") ||
    message.includes("not authorized") ||
    message.includes("forbidden")
  )
}

function isEmailNotConfirmedError(error) {
  const message = String(error?.message || "").toLowerCase()
  return message.includes("email not confirmed") || message.includes("not confirmed")
}

async function claimClientByPhone({ phone, email, fullName }) {
  const digits = normalizePhone(phone)
  const cleanEmail = String(email || "").trim().toLowerCase()
  const cleanName = String(fullName || "").trim()

  const { data, error } = await supabase.rpc("claim_client_by_phone", {
    p_phone: digits,
    p_email: cleanEmail,
    p_full_name: cleanName,
  })

  if (error) {
    console.error("[clientsService] Falha na RPC claim_client_by_phone:", {
      error,
      phoneInput: phone,
      phoneDigits: digits,
      email: cleanEmail,
      fullName: cleanName,
    })

    const message = String(error?.message || "").toLowerCase()

    if (message.includes("já está vinculado") || message.includes("ja esta vinculado")) {
      throw new Error("Este telefone já está vinculado a outra conta")
    }

    if (message.includes("claim_client_by_phone") && message.includes("does not exist")) {
      throw new Error("Função RPC claim_client_by_phone não encontrada no banco. Execute o SQL da função e tente novamente.")
    }

    if (isRlsOrPermissionError(error)) {
      throw new Error("Não foi possível concluir o vínculo do seu cadastro por telefone. Verifique as permissões da RPC.")
    }

    throw new Error(error?.message || "Não foi possível concluir o vínculo do seu cadastro. Tente novamente.")
  }

  const payload = data && typeof data === "object" ? data : {}

  return {
    clientClaimed: Boolean(payload.client_claimed),
    profileClaimed: Boolean(payload.profile_claimed),
    clientId: payload.client_id ?? null,
    profileId: payload.profile_id ?? null,
  }
}

function mapPurchaseRow(row) {
  return {
    id: row.id,
    date: row.purchased_at || row.created_at,
    value: Number(row.value ?? row.amount ?? 0),
    points: Number(row.points ?? row.points_earned ?? 0),
  }
}

function mapRedemptionRow(row) {
  return {
    id: row.id,
    date: row.redeemed_at || row.created_at,
    cost: Number(row.cost ?? row.points_used ?? 0),
    label: row.label || row.reward_name || "Recompensa",
    addons: Array.isArray(row.addons) ? row.addons : [],
    additionalTotal: Number(row.additional_total || 0),
  }
}

async function loadPurchasesByClientIds(clientIds) {
  if (!clientIds.length) return []

  const { data, error } = await supabase
    .from(PURCHASES_TABLE)
    .select("id, client_id, value, amount, points, points_earned, purchased_at, created_at")
    .in("client_id", clientIds)
    .order("purchased_at", { ascending: false })

  if (error) throw new Error(error.message || "Erro ao buscar compras.")
  return data || []
}

async function loadRedemptionsByClientIds(clientIds) {
  if (!clientIds.length) return []

  const modernQuery = await supabase
    .from(REDEMPTIONS_TABLE)
    .select("id, client_id, cost, label, addons, additional_total, redeemed_at, created_at")
    .in("client_id", clientIds)
    .order("redeemed_at", { ascending: false })

  if (!modernQuery.error) return modernQuery.data || []

  const message = String(modernQuery.error?.message || "").toLowerCase()
  const shouldTryLegacy = message.includes("cost") || message.includes("label")

  if (!shouldTryLegacy) {
    throw new Error(modernQuery.error.message || "Erro ao buscar resgates.")
  }

  const legacyQuery = await supabase
    .from(REDEMPTIONS_TABLE)
    .select("id, client_id, points_used, reward_name, addons, additional_total, redeemed_at, created_at")
    .in("client_id", clientIds)
    .order("redeemed_at", { ascending: false })

  if (legacyQuery.error) {
    throw new Error(legacyQuery.error.message || "Erro ao buscar resgates.")
  }

  return legacyQuery.data || []
}

function attachRelations(clients, purchases, redemptions) {
  const purchasesByClient = purchases.reduce((acc, item) => {
    if (!acc[item.client_id]) acc[item.client_id] = []
    acc[item.client_id].push(mapPurchaseRow(item))
    return acc
  }, {})

  const redemptionsByClient = redemptions.reduce((acc, item) => {
    if (!acc[item.client_id]) acc[item.client_id] = []
    acc[item.client_id].push(mapRedemptionRow(item))
    return acc
  }, {})

  return clients.map((client) => {
    const purchaseHistory = purchasesByClient[client.id] || []
    const redeemedRewards = redemptionsByClient[client.id] || []

    const earnedPoints = purchaseHistory.reduce(
      (acc, purchase) => acc + Number(purchase.points || 0),
      0
    )
    const spentPoints = redeemedRewards.reduce(
      (acc, reward) => acc + Number(reward.cost || 0),
      0
    )
    const derivedPoints = Math.max(earnedPoints - spentPoints, 0)

    return {
      ...client,
      points: Math.max(Number(client.points || 0), derivedPoints),
      purchaseHistory,
      redeemedRewards,
    }
  })
}

export async function listClientsWithDetails() {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from(CLIENTS_TABLE)
    .select("id, name, phone, email, auth_user_id, phone_digits, points, total_spent, created_at")
    .order("created_at", { ascending: false })

  if (error) throwPhoneDigitsMigrationError(error)

  const baseClients = (data || []).map(mapClientRow)
  const clientIds = baseClients.map((client) => client.id)

  const [purchases, redemptions] = await Promise.all([
    loadPurchasesByClientIds(clientIds),
    loadRedemptionsByClientIds(clientIds),
  ])

  return attachRelations(baseClients, purchases, redemptions)
}

export async function getClientByIdWithDetails(clientId) {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from(CLIENTS_TABLE)
    .select("id, name, phone, email, auth_user_id, phone_digits, points, total_spent")
    .eq("id", clientId)
    .maybeSingle()

  if (error) throwPhoneDigitsMigrationError(error)
  if (!data) return null

  const [purchases, redemptions] = await Promise.all([
    loadPurchasesByClientIds([clientId]),
    loadRedemptionsByClientIds([clientId]),
  ])

  const [clientWithDetails] = attachRelations([mapClientRow(data)], purchases, redemptions)
  return clientWithDetails
}

export async function findClientByPhone(phone) {
  assertSupabaseConfigured()

  const digits = normalizePhone(phone)
  if (!digits) return null

  const { data, error } = await supabase
    .from(CLIENTS_TABLE)
    .select("id")
    .eq("phone_digits", digits)
    .maybeSingle()

  if (error) throwPhoneDigitsMigrationError(error)
  if (!data?.id) return null

  return getClientByIdWithDetails(data.id)
}

export async function findClientByAuthUserId(authUserId) {
  assertSupabaseConfigured()

  const cleanAuthUserId = String(authUserId || "").trim()
  if (!cleanAuthUserId) return null

  const { data, error } = await supabase
    .from(CLIENTS_TABLE)
    .select("id")
    .eq("auth_user_id", cleanAuthUserId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message || "Erro ao buscar cliente autenticado.")
  }

  if (!data?.id) return null
  return getClientByIdWithDetails(data.id)
}

export async function findClientByEmail(email) {
  assertSupabaseConfigured()

  const cleanEmail = String(email || "").trim().toLowerCase()
  if (!cleanEmail) return null

  const { data, error } = await supabase
    .from(CLIENTS_TABLE)
    .select("id")
    .ilike("email", cleanEmail)
    .limit(1)

  if (error) {
    throw new Error(error.message || "Erro ao buscar cliente por e-mail.")
  }

  const first = data?.[0]
  if (!first?.id) return null
  return getClientByIdWithDetails(first.id)
}

export async function linkClientByEmailToAuthUser({ authUserId, email }) {
  assertSupabaseConfigured()

  const cleanAuthUserId = String(authUserId || "").trim()
  const cleanEmail = String(email || "").trim().toLowerCase()

  if (!cleanAuthUserId || !cleanEmail) return null

  const { data: rows, error: findError } = await supabase
    .from(CLIENTS_TABLE)
    .select("id, auth_user_id")
    .ilike("email", cleanEmail)
    .limit(1)

  if (findError) {
    throw new Error(findError.message || "Erro ao localizar cliente para vínculo por e-mail.")
  }

  const target = rows?.[0]
  if (!target?.id) return null

  if (target.auth_user_id === cleanAuthUserId) {
    return getClientByIdWithDetails(target.id)
  }

  const { data: updated, error: updateError } = await supabase
    .from(CLIENTS_TABLE)
    .update({
      auth_user_id: cleanAuthUserId,
      email: cleanEmail,
    })
    .eq("id", target.id)
    .select("id")
    .maybeSingle()

  if (updateError) {
    throw new Error(updateError.message || "Erro ao vincular cliente ao usuário autenticado.")
  }

  if (!updated?.id) return null
  return getClientByIdWithDetails(updated.id)
}

export async function createClientRecord({ name, phone, email, password }) {
  assertSupabaseConfigured()

  const cleanName = String(name || "").trim()
  const cleanPhone = String(phone || "").trim()
  const cleanEmail = String(email || "").trim().toLowerCase()
  const cleanPassword = String(password || "")
  const digits = normalizePhone(cleanPhone)

  if (!cleanName || !cleanPhone) {
    throw new Error("Preencha nome e WhatsApp para continuar.")
  }

  if (digits.length < 10) {
    throw new Error("Informe um WhatsApp válido para continuar.")
  }

  const existingClient = await findClientByPhone(cleanPhone)
  if (existingClient) {
    throw new Error("Já existe cliente cadastrado com esse telefone.")
  }

  const createAuthAccount = Boolean(cleanEmail && cleanPassword)

  if (createAuthAccount) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      throw new Error("E-mail inválido para criar acesso à conta.")
    }

    if (cleanPassword.length < 6) {
      throw new Error("A senha deve ter pelo menos 6 caracteres.")
    }
  }

  let authUserId = null

  if (createAuthAccount) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: cleanPassword,
    })

    if (signUpError) {
      throw new Error(normalizeSignupError(signUpError))
    }

    authUserId = signUpData?.user?.id
    if (!authUserId) {
      throw new Error("Não foi possível concluir o cadastro. Tente novamente.")
    }
  }

  const { data, error } = await supabase
    .from(CLIENTS_TABLE)
    .insert({
      name: cleanName,
      phone: digits,
      email: createAuthAccount ? cleanEmail : null,
      auth_user_id: authUserId,
      phone_digits: digits,
      points: 0,
      total_spent: 0,
    })
    .select("id, name, phone, email, auth_user_id, phone_digits, points, total_spent")
    .single()

  if (error) {
    const message = String(error?.message || "").toLowerCase()
    if (message.includes("email") && createAuthAccount) {
      throw new Error("Este e-mail já está em uso.")
    }

    throw new Error(
      createAuthAccount
        ? "Usuário criado no acesso, mas não foi possível salvar os dados do cliente. Tente novamente."
        : "Não foi possível cadastrar o cliente. Tente novamente."
    )
  }

  // A sincronizacao no profiles ajuda no vinculo por telefone, mas nao pode impedir o cadastro admin.
  try {
    await upsertProfileByPhone({
      fullName: cleanName,
      phone: digits,
      email: createAuthAccount ? cleanEmail : "",
      authUserId,
      isCompleted: createAuthAccount,
    })
  } catch (profileSyncError) {
    console.error("[clientsService] Cliente salvo, mas falhou sincronizacao em profiles:", profileSyncError)
  }

  return {
    ...mapClientRow(data),
    purchaseHistory: [],
    redeemedRewards: [],
  }
}

export async function updateClientRecord(clientId, { name, phone }) {
  assertSupabaseConfigured()

  const cleanName = String(name || "").trim()
  const cleanPhone = String(phone || "").trim()
  const digits = normalizePhone(cleanPhone)

  if (!cleanName || !cleanPhone || digits.length < 10) {
    throw new Error("Informe nome e telefone validos para atualizar o cliente.")
  }

  const { data, error } = await supabase
    .from(CLIENTS_TABLE)
    .update({
      name: cleanName,
      phone: digits,
      phone_digits: digits,
    })
    .eq("id", clientId)
    .select("id, name, phone, phone_digits, points, total_spent")
    .single()

  if (error) throwPhoneDigitsMigrationError(error)

  return {
    ...mapClientRow(data),
    purchaseHistory: [],
    redeemedRewards: [],
  }
}

export async function deleteClientById(clientId) {
  assertSupabaseConfigured()

  const cleanClientId = String(clientId || "").trim()
  if (!cleanClientId) {
    throw new Error("Cliente invalido para exclusao.")
  }

  const { error } = await supabase
    .from(CLIENTS_TABLE)
    .delete()
    .eq("id", cleanClientId)

  if (error) {
    throw new Error(error.message || "Nao foi possivel excluir o cliente.")
  }
}

export async function createOrLinkClientWithEmail({ name, phone, email, password }) {
  assertSupabaseConfigured()

  const cleanName = String(name || "").trim()
  const cleanPhone = String(phone || "").trim()
  const cleanEmail = String(email || "").trim().toLowerCase()
  const cleanPassword = String(password || "")
  const digits = normalizePhone(cleanPhone)

  if (!cleanName || !cleanPhone || !cleanEmail || !cleanPassword) {
    throw new Error("Preencha todos os campos para continuar.")
  }

  if (digits.length < 10) {
    throw new Error("Informe um WhatsApp válido para continuar.")
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanEmail)) {
    throw new Error("E-mail inválido para continuar.")
  }

  if (cleanPassword.length < 6) {
    throw new Error("A senha deve ter pelo menos 6 caracteres.")
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: cleanPassword,
  })

  let authUserId = signUpData?.user?.id || null

  if (signUpError) {
    const signUpMessage = String(signUpError?.message || "").toLowerCase()
    const isAlreadyRegistered =
      signUpMessage.includes("already registered") ||
      signUpMessage.includes("already exists") ||
      signUpMessage.includes("already been registered")

    if (isAlreadyRegistered) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (isEmailNotConfirmedError(signInError)) {
        throw new Error("Conta criada, mas seu e-mail ainda não foi confirmado. Confirme seu e-mail antes de entrar.")
      }

      if (signInError || !signInData?.user?.id) {
        throw new Error("Este e-mail já está em uso.")
      }

      authUserId = signInData.user.id
    } else {
      throw new Error(normalizeSignupError(signUpError))
    }
  }

  if (!authUserId) {
    throw new Error("Não foi possível concluir o cadastro. Tente novamente.")
  }

  // Garante sessao autenticada antes de chamar a RPC de vinculo.
  const {
    data: { session: activeSession },
  } = await supabase.auth.getSession()

  if (!activeSession?.user?.id) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPassword,
    })

    if (isEmailNotConfirmedError(signInError)) {
      throw new Error("Conta criada, mas seu e-mail ainda não foi confirmado. Confirme seu e-mail para concluir o acesso.")
    }

    if (signInError || !signInData?.user?.id) {
      throw new Error("Não foi possível autenticar a nova conta para concluir o vínculo. Tente novamente.")
    }

    authUserId = signInData.user.id
  }

  const claimResult = await claimClientByPhone({
    phone: digits,
    email: cleanEmail,
    fullName: cleanName,
  })

  if (claimResult.clientClaimed || claimResult.profileClaimed) {
    const linkedClient = await findClientByAuthUserId(authUserId)
    if (linkedClient) {
      return {
        ...linkedClient,
        wasLinked: true,
      }
    }
  }

  // Sem pre-cadastro por telefone: segue fluxo normal de criacao.
  const { data: insertData, error: insertError } = await supabase
    .from(CLIENTS_TABLE)
    .insert({
      name: cleanName,
      phone: digits,
      email: cleanEmail,
      auth_user_id: authUserId,
      phone_digits: digits,
      points: 0,
      total_spent: 0,
    })
    .select("id, name, phone, email, auth_user_id, phone_digits, points, total_spent")
    .single()

  if (insertError) {
    const message = String(insertError?.message || "").toLowerCase()
    if (message.includes("email") && (message.includes("duplicate") || message.includes("unique"))) {
      throw new Error("Este e-mail já está em uso.")
    }

    if (message.includes("phone") && (message.includes("duplicate") || message.includes("unique"))) {
      // Conflito de concorrencia: tenta recuperar o registro que acabou de ser vinculado.
      const linkedClient = await findClientByAuthUserId(authUserId)
      if (linkedClient) {
        return {
          ...linkedClient,
          wasLinked: true,
        }
      }

      throw new Error("Este telefone já está vinculado a outra conta")
    }

    throw new Error(
      "Usuário criado no acesso, mas não foi possível salvar os dados do cliente. Tente novamente."
    )
  }

  try {
    await upsertProfileByPhone({
      fullName: cleanName,
      phone: digits,
      email: cleanEmail,
      authUserId,
      isCompleted: true,
    })
  } catch (profileSyncError) {
    console.error("[clientsService] Cliente criado no app, mas falhou sincronizacao em profiles:", profileSyncError)
  }

  const fullClient = await getClientByIdWithDetails(insertData.id)

  if (!fullClient) {
    throw new Error("Não foi possível concluir o cadastro. Tente novamente.")
  }

  return {
    ...fullClient,
    wasLinked: false,
  }
}
