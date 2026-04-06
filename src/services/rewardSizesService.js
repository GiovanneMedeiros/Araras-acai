import { assertSupabaseConfigured, supabase } from "../lib/supabase.js"

const TABLE = "reward_sizes"

function mapRow(row) {
  return {
    id: row.id,
    name: String(row.name || ""),
    volume_ml: Number(row.volume_ml || 0),
    points_required: Number(row.points_required || 0),
    free_toppings_limit: Number(row.free_toppings_limit ?? 3),
    is_active: Boolean(row.is_active),
    sort_order: Number(row.sort_order ?? 0),
    created_at: row.created_at,
  }
}

export async function listAllSizes() {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) throw new Error(error.message || "Erro ao listar tamanhos.")
  return (data || []).map(mapRow)
}

export async function createSize({ name, volume_ml, points_required, free_toppings_limit, is_active, sort_order }) {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      name: String(name).trim(),
      volume_ml: Number(volume_ml),
      points_required: Number(points_required),
      free_toppings_limit: Number(free_toppings_limit),
      is_active: Boolean(is_active),
      sort_order: Number(sort_order),
    })
    .select()
    .single()

  if (error) throw new Error(error.message || "Erro ao criar tamanho.")
  return mapRow(data)
}

export async function updateSize(id, { name, volume_ml, points_required, free_toppings_limit, is_active, sort_order }) {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from(TABLE)
    .update({
      name: String(name).trim(),
      volume_ml: Number(volume_ml),
      points_required: Number(points_required),
      free_toppings_limit: Number(free_toppings_limit),
      is_active: Boolean(is_active),
      sort_order: Number(sort_order),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message || "Erro ao atualizar tamanho.")
  return mapRow(data)
}

export async function deleteSize(id) {
  assertSupabaseConfigured()

  const { error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message || "Erro ao excluir tamanho.")
}

export async function toggleSizeActive(id, is_active) {
  assertSupabaseConfigured()

  const { data, error } = await supabase
    .from(TABLE)
    .update({ is_active })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message || "Erro ao alterar status.")
  return mapRow(data)
}

export async function swapSortOrder(idA, orderA, idB, orderB) {
  assertSupabaseConfigured()

  const { error: e1 } = await supabase
    .from(TABLE)
    .update({ sort_order: orderB })
    .eq("id", idA)

  if (e1) throw new Error(e1.message || "Erro ao reordenar.")

  const { error: e2 } = await supabase
    .from(TABLE)
    .update({ sort_order: orderA })
    .eq("id", idB)

  if (e2) throw new Error(e2.message || "Erro ao reordenar.")
}
