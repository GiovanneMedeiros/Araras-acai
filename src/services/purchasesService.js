import { assertSupabaseConfigured, supabase } from "../lib/supabase.js"
import { calculatePoints } from "../utils/points.js"
import { getClientByIdWithDetails } from "./clientsService.js"

const PURCHASES_TABLE = "purchases"
const CLIENTS_TABLE = "clients"

export async function registerPurchaseForClient({ clientId, value }) {
  assertSupabaseConfigured()

  const normalizedClientId =
    typeof clientId === "string" ? clientId.trim() : clientId

  if (
    !normalizedClientId ||
    (typeof normalizedClientId === "number" && Number.isNaN(normalizedClientId))
  ) {
    throw new Error("Selecione um cliente valido para registrar a compra.")
  }

  const purchaseValue = Number(value)
  if (Number.isNaN(purchaseValue) || purchaseValue <= 0) {
    throw new Error("Valor de compra invalido.")
  }

  const earnedPoints = calculatePoints(purchaseValue)
  const client = await getClientByIdWithDetails(normalizedClientId)

  if (!client) {
    throw new Error("Cliente nao encontrado para registrar compra.")
  }

  const { error: purchaseError } = await supabase.from(PURCHASES_TABLE).insert({
    client_id: normalizedClientId,
    amount: purchaseValue,
    value: purchaseValue,
    points: earnedPoints,
    points_earned: earnedPoints,
    purchased_at: new Date().toISOString(),
  })

  if (purchaseError) {
    throw new Error(purchaseError.message || "Falha ao registrar compra.")
  }

  const { error: updateError } = await supabase
    .from(CLIENTS_TABLE)
    .update({
      points: client.points + earnedPoints,
      total_spent: client.totalSpent + purchaseValue,
    })
    .eq("id", normalizedClientId)

  if (updateError) {
    throw new Error(updateError.message || "Falha ao atualizar saldo de pontos.")
  }

  return {
    earnedPoints,
    purchaseValue,
    clientName: client.name,
  }
}
