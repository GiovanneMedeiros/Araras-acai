import { assertSupabaseConfigured, supabase } from "../lib/supabase.js"
import { getClientByIdWithDetails } from "./clientsService.js"
import { normalizePhone } from "../utils/clientData.js"

const CLIENTS_TABLE = "clients"
const REDEMPTIONS_TABLE = "reward_redemptions"
const REWARD_OPTIONS_TABLE = "reward_options"
const TOPPINGS_TABLE = "toppings"

async function resolveClientIdByPhone(phone) {
  const digits = normalizePhone(phone)
  if (!digits) return null

  const exactDigitsQuery = await supabase
    .from(CLIENTS_TABLE)
    .select("id")
    .eq("phone_digits", digits)
    .maybeSingle()

  if (!exactDigitsQuery.error && exactDigitsQuery.data?.id) {
    return exactDigitsQuery.data.id
  }

  const exactPhoneQuery = await supabase
    .from(CLIENTS_TABLE)
    .select("id")
    .eq("phone", digits)
    .maybeSingle()

  if (exactPhoneQuery.error) {
    throw new Error(exactPhoneQuery.error.message || "Erro ao localizar cliente por telefone.")
  }

  return exactPhoneQuery.data?.id || null
}

function parseRewardCost(cost) {
  if (cost === undefined || cost === null || cost === "") {
    throw new Error("Custo da recompensa nao informado.")
  }

  const rewardCost = Number(cost)

  if (!Number.isFinite(rewardCost) || Number.isNaN(rewardCost)) {
    throw new Error("Custo da recompensa invalido: informe um numero valido.")
  }

  if (rewardCost <= 0) {
    throw new Error("Custo da recompensa deve ser maior que zero.")
  }

  return rewardCost
}

function getEffectiveClientPoints(client) {
  const persistedPoints = Number(client?.points || 0)

  const earnedFromPurchases = (client?.purchaseHistory || []).reduce(
    (acc, purchase) => acc + Number(purchase?.points || 0),
    0
  )

  const spentOnRedemptions = (client?.redeemedRewards || []).reduce(
    (acc, redemption) => acc + Number(redemption?.cost || 0),
    0
  )

  const derivedPoints = Math.max(earnedFromPurchases - spentOnRedemptions, 0)
  return Math.max(persistedPoints, derivedPoints)
}

export async function listRewardOptions() {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from("reward_sizes")
    .select("id, name, points_required, free_toppings_limit")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(error.message || "Erro ao buscar opcoes de recompensa.")
  }

  return (data || [])
    .map((row) => ({
      id: row.id,
      label: String(row.name || "").trim(),
      points: Number(row.points_required || 0),
      free_toppings_limit: Number(row.free_toppings_limit ?? 0),
    }))
    .filter((item) => item.id && item.label && item.points > 0)
}

export async function listToppings() {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from(TOPPINGS_TABLE)
    .select("id, name, price, is_paid")
    .order("is_paid", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message || "Erro ao buscar complementos.")
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: String(row.name || "").trim(),
    label: String(row.name || "").trim(),
    price: Number(row.price || 0),
    is_paid: Boolean(row.is_paid),
  })).filter((item) => item.id && item.name)
}

export async function countClientRedemptions({ clientId, phone }) {
  assertSupabaseConfigured()

  let targetClientId = String(clientId || "").trim()

  if (!targetClientId && phone) {
    targetClientId = await resolveClientIdByPhone(phone)
  }

  if (!targetClientId) return 0

  const { count, error } = await supabase
    .from(REDEMPTIONS_TABLE)
    .select("id", { count: "exact", head: true })
    .eq("client_id", targetClientId)

  if (error) {
    throw new Error(error.message || "Erro ao contar resgates do cliente.")
  }

  return Number(count || 0)
}

async function listRedemptionRowsForMetrics() {
  const labelAttempts = ["label", "reward_name"]
  const dateAttempts = ["redeemed_at", "created_at"]

  for (const labelColumn of labelAttempts) {
    for (const dateColumn of dateAttempts) {
      const { data, error } = await supabase
        .from(REDEMPTIONS_TABLE)
        .select(`id, ${labelColumn}, ${dateColumn}`)

      if (!error) {
        return (data || []).map((row) => ({
          label: String(row?.[labelColumn] || "").trim(),
          ts: Date.parse(row?.[dateColumn] || "") || 0,
        }))
      }
    }
  }

  throw new Error("Erro ao buscar metricas de resgate.")
}

function extractAcaiSizeFromText(value) {
  const text = String(value || "").toLowerCase().trim()
  if (!text) return null

  if (/\b1\s*(l|litro|litros)\b/i.test(text)) return "1L"

  const mlMatch = text.match(/\b(300|400|500|700)\s*ml\b/i)
  if (mlMatch?.[1]) return `${mlMatch[1]}ml`

  return null
}

export async function getRedemptionsMetrics() {
  assertSupabaseConfigured()

  const rows = await listRedemptionRowsForMetrics()
  const totalResgatados = rows.length
  const sizeRows = rows
    .map((item) => ({
      size: extractAcaiSizeFromText(item.label),
      ts: item.ts,
    }))
    .filter((item) => item.size)

  if (!sizeRows.length) {
    return {
      totalResgatados,
      acaiMaisResgatado: "Nenhum resgate",
    }
  }

  const frequency = sizeRows.reduce((acc, item) => {
    const current = acc[item.size] || { count: 0, latestTs: 0 }
    current.count += 1
    current.latestTs = Math.max(current.latestTs, item.ts)
    acc[item.size] = current
    return acc
  }, {})

  const winningSize = Object.entries(frequency)
    .sort((a, b) => {
      if (b[1].count !== a[1].count) return b[1].count - a[1].count
      return b[1].latestTs - a[1].latestTs
    })
    .map(([size]) => size)[0]

  const acaiMaisResgatado = winningSize ? `Açaí ${winningSize}` : "Nenhum resgate"

  return {
    totalResgatados,
    acaiMaisResgatado,
  }
}

function throwRedemptionPersistenceError(error) {
  const message = String(error?.message || "").toLowerCase()

  if (
    message.includes("reward_redemptions") &&
    message.includes("cost") &&
    (message.includes("does not exist") || message.includes("schema cache"))
  ) {
    throw new Error(
      "A coluna reward_redemptions.cost nao existe no banco. Execute o script de reparo do schema no SQL Editor do Supabase."
    )
  }

  throw new Error(error?.message || "Falha ao registrar resgate.")
}

function isClientOwnedRedemptionDenied(error) {
  const message = String(error?.message || "").toLowerCase()
  return (
    message.includes("você não tem permissão") ||
    message.includes("voce nao tem permissao") ||
    message.includes("cliente não encontrado") ||
    message.includes("cliente nao encontrado")
  )
}

async function insertRedemptionWithFallback({
  clientId,
  rewardCost,
  label,
  addons,
  extrasTotal,
}) {
  const safeRewardCost = parseRewardCost(rewardCost)
  const redeemedAt = new Date().toISOString()

  const payloadAttempts = [
    {
      client_id: clientId,
      cost: safeRewardCost,
      points_used: safeRewardCost,
      label,
      addons,
      additional_total: extrasTotal,
      redeemed_at: redeemedAt,
    },
    {
      client_id: clientId,
      cost: safeRewardCost,
      label,
      addons,
      additional_total: extrasTotal,
      redeemed_at: redeemedAt,
    },
    {
      client_id: clientId,
      points_used: safeRewardCost,
      label,
      addons,
      additional_total: extrasTotal,
      redeemed_at: redeemedAt,
    },
    {
      client_id: clientId,
      points_used: safeRewardCost,
      reward_name: label,
      addons,
      additional_total: extrasTotal,
      redeemed_at: redeemedAt,
    },
  ]

  let lastError = null

  for (const payload of payloadAttempts) {
    const { error } = await supabase.from(REDEMPTIONS_TABLE).insert(payload)
    if (!error) return
    lastError = error
  }

  throwRedemptionPersistenceError(lastError)
}

export async function redeemClientReward({
  clientId,
  cost,
  label,
  addons = [],
  additionalTotal = 0,
}) {
  assertSupabaseConfigured()

  if (clientId === null || clientId === undefined || String(clientId).trim() === "") {
    throw new Error("ID do cliente inválido para resgate.")
  }

  const normalizedClientId = clientId
  const numericClientId = Number(normalizedClientId)
  const canUseSecureRpc = Number.isInteger(numericClientId) && numericClientId > 0

  const rewardCost = parseRewardCost(cost)
  const extrasTotal = Number(additionalTotal || 0)
  const client = await getClientByIdWithDetails(normalizedClientId)

  if (!client) throw new Error("Cliente nao encontrado para resgate.")
  const currentPoints = getEffectiveClientPoints(client)
  if (currentPoints < rewardCost) {
    throw new Error(
      `Pontos insuficientes para resgatar recompensa. Saldo atual: ${currentPoints} / Necessario: ${rewardCost}.`
    )
  }

  const addonLabels = addons.map((addon) => String(addon || "").trim()).filter(Boolean)

  let secureRedemption = null
  let secureRedemptionError = null

  if (canUseSecureRpc) {
    const rpcResult = await supabase.rpc("redeem_own_reward", {
      p_client_id: numericClientId,
      p_cost: rewardCost,
      p_label: label,
      p_addons: addonLabels,
      p_additional_total: extrasTotal,
    })

    secureRedemption = rpcResult.data
    secureRedemptionError = rpcResult.error
  }

  if (!secureRedemptionError && secureRedemption) {
    return {
      clientName: secureRedemption.client_name || client.name,
      remainingPoints: Number(secureRedemption.remaining_points || 0),
    }
  }

  const secureMessage = String(secureRedemptionError?.message || "").toLowerCase()
  if (
    secureMessage.includes("redeem_own_reward") &&
    secureMessage.includes("does not exist")
  ) {
    throw new Error(
      "Função RPC redeem_own_reward não encontrada no banco. Execute o SQL de segurança do resgate e tente novamente."
    )
  }

  if (secureRedemptionError && !isClientOwnedRedemptionDenied(secureRedemptionError)) {
    throw new Error(secureRedemptionError.message || "Falha ao registrar resgate.")
  }

  await insertRedemptionWithFallback({
    clientId,
    rewardCost,
    label,
    addons: addonLabels,
    extrasTotal,
  })

  const { error: updateError } = await supabase
    .from(CLIENTS_TABLE)
    .update({ points: currentPoints - rewardCost })
    .eq("id", clientId)

  if (updateError) {
    throw new Error(updateError.message || "Falha ao debitar pontos.")
  }

  return {
    clientName: client.name,
    remainingPoints: currentPoints - rewardCost,
  }
}
