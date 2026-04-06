import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import RewardSizeFormModal from "../components/admin/RewardSizeFormModal.jsx"
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx"
import ToastContainer from "../components/ui/ToastContainer.jsx"
import {
  createSize,
  deleteSize,
  listAllSizes,
  swapSortOrder,
  toggleSizeActive,
  updateSize,
} from "../services/rewardSizesService.js"
import { getUserFriendlyErrorMessage } from "../utils/errorMessage.js"
import { formatDate } from "../utils/format.js"
import logoAraras from "../assets/logo-araras.png"

function Badge({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#E8D8C3] bg-[#F6F3EF] px-3 py-1 text-sm font-semibold text-[#6B6B6B]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#5B2A86]" />
      Ativo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#E8D0CC] bg-[#FFF8F6] px-3 py-1 text-sm font-semibold text-[#9A5D52]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#C47E72]" />
      Inativo
    </span>
  )
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={checked ? "Desativar" : "Ativar"}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-[#5B2A86]" : "bg-[#D8CFC4]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  )
}

function EmptyState({ filter, onClear }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E8D8C3] bg-[#F6F3EF] p-10 text-center">
      <p className="text-lg font-semibold text-[#2B2B2B]">
        {filter === "todos" ? "Nenhum tamanho cadastrado ainda." : `Nenhum tamanho ${filter}.`}
      </p>
      <p className="mt-1 text-sm text-[#6B6B6B]">
        {filter === "todos"
          ? 'Clique em "Novo tamanho" para começar.'
          : "Tente remover o filtro para ver todos os tamanhos."}
      </p>
      {filter !== "todos" ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-3 rounded-xl border border-[#E8D8C3] bg-[#FBF8F5] px-4 py-2 text-sm font-semibold text-[#6B6B6B] hover:bg-[#F1E9E2]"
        >
          Ver todos
        </button>
      ) : null}
    </div>
  )
}

function AdminRewardSizes() {
  const [sizes, setSizes] = useState([])
  const [loading, setLoading] = useState(true)
  const [screenError, setScreenError] = useState("")
  const [toasts, setToasts] = useState([])
  const [filter, setFilter] = useState("todos")
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSize, setEditingSize] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const loadSizes = useCallback(async () => {
    try {
      const data = await listAllSizes()
      setSizes(data)
      setScreenError("")
    } catch (error) {
      setScreenError(getUserFriendlyErrorMessage(error, "Erro ao carregar tamanhos."))
    }
  }, [])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    loadSizes().finally(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [loadSizes])

  function pushToast(title, message, type = "success") {
    const toast = { id: Date.now() + Math.random(), title, message, type }
    setToasts((prev) => [toast, ...prev].slice(0, 4))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toast.id)), 3500)
  }

  function closeToast(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const filteredSizes = useMemo(() => {
    let result = sizes
    if (filter === "ativos") result = result.filter((s) => s.is_active)
    if (filter === "inativos") result = result.filter((s) => !s.is_active)
    if (search.trim()) {
      const term = search.toLowerCase()
      result = result.filter((s) => s.name.toLowerCase().includes(term))
    }
    return result
  }, [sizes, filter, search])

  function openCreate() {
    setEditingSize(null)
    setModalOpen(true)
  }

  function openEdit(size) {
    setEditingSize(size)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingSize(null)
  }

  async function handleSave(formData) {
    try {
      if (editingSize) {
        await updateSize(editingSize.id, formData)
        pushToast("Tamanho atualizado!", `"${formData.name}" foi salvo com sucesso.`)
      } else {
        await createSize(formData)
        pushToast("Tamanho cadastrado!", `"${formData.name}" foi adicionado ao sistema.`)
      }
      closeModal()
      await loadSizes()
    } catch (error) {
      pushToast(
        "Erro ao salvar",
        getUserFriendlyErrorMessage(error),
        "error"
      )
      throw error
    }
  }

  async function handleDelete(size) {
    setConfirmDelete(null)
    setActionLoadingId(size.id)
    try {
      await deleteSize(size.id)
      pushToast("Tamanho excluído", `"${size.name}" foi removido.`)
      await loadSizes()
    } catch (error) {
      pushToast("Erro ao excluir", getUserFriendlyErrorMessage(error), "error")
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleToggleActive(size) {
    setActionLoadingId(size.id)
    try {
      await toggleSizeActive(size.id, !size.is_active)
      pushToast(
        size.is_active ? "Tamanho desativado" : "Tamanho ativado",
        `"${size.name}" agora está ${size.is_active ? "inativo" : "ativo"}.`
      )
      await loadSizes()
    } catch (error) {
      pushToast("Erro ao alterar status", getUserFriendlyErrorMessage(error), "error")
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleMove(size, direction) {
    const ordered = [...sizes].sort((a, b) => a.sort_order - b.sort_order)
    const idx = ordered.findIndex((s) => s.id === size.id)
    const targetIdx = direction === "up" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= ordered.length) return

    const target = ordered[targetIdx]
    setActionLoadingId(size.id)
    try {
      await swapSortOrder(size.id, size.sort_order, target.id, target.sort_order)
      await loadSizes()
    } catch (error) {
      pushToast("Erro ao reordenar", getUserFriendlyErrorMessage(error), "error")
    } finally {
      setActionLoadingId(null)
    }
  }

  const FILTERS = [
    { value: "todos", label: "Todos", count: sizes.length },
    { value: "ativos", label: "Ativos", count: sizes.filter((s) => s.is_active).length },
    { value: "inativos", label: "Inativos", count: sizes.filter((s) => !s.is_active).length },
  ]

  return (
    <div className="min-h-screen bg-[#F6F3EF] text-[#2B2B2B]">
      <div className="pointer-events-none fixed inset-0 tropical-bg" />

      <div className="relative mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-7">

        {/* Header */}
        <header className="mb-10 rounded-2xl border border-[#D8D0E8] bg-gradient-to-r from-[#5B2A86] to-[#7A4FB3] px-5 py-5 text-white shadow-sm md:px-7 md:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <img
                  src={logoAraras}
                  alt="Logo Arara's Acai"
                  className="h-[4.5rem] w-auto max-w-[11rem] object-contain sm:h-[5rem] sm:max-w-[12.5rem]"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/75">
                  Sistema de Fidelidade · Admin
                </p>
                <h1 className="mt-1 text-2xl font-black leading-tight text-white sm:text-3xl">
                  Tamanhos de Açaí
                </h1>
                <p className="mt-1 text-sm text-white/82">
                  Gerencie os tamanhos disponíveis para resgate no programa de fidelidade.
                </p>
              </div>
            </div>
            <Link
              to="/admin/dashboard"
              className="shrink-0 rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-xs font-semibold text-[#5B2A86] transition hover:bg-white"
            >
              ← Painel
            </Link>
          </div>
        </header>

        {screenError ? (
          <section className="mb-5 rounded-2xl border border-[#E8D0CC] bg-[#FFF8F6] p-4 text-sm text-[#9A5D52]">
            {screenError}
          </section>
        ) : null}

        {/* Card principal */}
        <div className="rounded-2xl border border-[#D8D0E8] bg-white shadow-sm">

          {/* Barra de ações */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8D8C3] px-5 py-4 md:px-6">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    filter === f.value
                      ? "bg-[#5B2A86] text-white shadow-sm"
                      : "border border-[#D8D0E8] bg-white text-[#6B6B6B] hover:bg-[#F6F3EF]"
                  }`}
                >
                  {f.label}
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${filter === f.value ? "bg-white/25" : "bg-[#F3EDF9]"}`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-[#D8D0E8] bg-white px-3 py-2 text-sm text-[#2B2B2B] placeholder:text-[#9A948D] outline-none focus:border-[#5B2A86]"
              />
              <button
                type="button"
                onClick={openCreate}
                className="shrink-0 rounded-xl bg-[#5B2A86] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#6D3EA2]"
              >
                + Novo tamanho
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-5 md:p-6">
            {loading ? (
                <div className="rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] p-8 text-center text-sm text-[#6B6B6B]">
                Carregando tamanhos...
              </div>
            ) : filteredSizes.length === 0 ? (
              <EmptyState filter={filter} onClear={() => { setFilter("todos"); setSearch("") }} />
            ) : (
              <>
                {/* Tabela desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#F0ECE7] text-left text-xs uppercase tracking-[0.1em] text-[#6B6B6B]">
                        <th className="pb-3 pr-4">Ordem</th>
                        <th className="pb-3 pr-4">Nome</th>
                        <th className="pb-3 pr-4">Volume</th>
                        <th className="pb-3 pr-4">Pontos</th>
                        <th className="pb-3 pr-4">Compl. grátis</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4">Criado em</th>
                        <th className="pb-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0ECE7]">
                      {filteredSizes.map((size, idx) => {
                        const isLoading = actionLoadingId === size.id
                        const ordered = [...sizes].sort((a, b) => a.sort_order - b.sort_order)
                        const absoluteIdx = ordered.findIndex((s) => s.id === size.id)
                        const isFirst = absoluteIdx === 0
                        const isLast = absoluteIdx === ordered.length - 1

                        return (
                          <tr key={size.id} className="group">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-1">
                                <span className="w-7 text-center text-sm font-bold text-[#2B2B2B]">{size.sort_order}</span>
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    title="Mover para cima"
                                    disabled={isFirst || isLoading}
                                    onClick={() => handleMove(size, "up")}
                                    className="rounded-md px-1 py-0.5 text-xs text-[#9A948D] transition hover:bg-[#F5F2EE] hover:text-[#2B2B2B] disabled:cursor-not-allowed disabled:opacity-30"
                                  >▲</button>
                                  <button
                                    type="button"
                                    title="Mover para baixo"
                                    disabled={isLast || isLoading}
                                    onClick={() => handleMove(size, "down")}
                                    className="rounded-md px-1 py-0.5 text-xs text-[#9A948D] transition hover:bg-[#F5F2EE] hover:text-[#2B2B2B] disabled:cursor-not-allowed disabled:opacity-30"
                                  >▼</button>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4 font-semibold text-[#2B2B2B]">{size.name}</td>
                            <td className="py-3 pr-4 text-[#6B6B6B]">{size.volume_ml} ml</td>
                            <td className="py-3 pr-4">
                              <span className="rounded-full border border-[#E8D8C3] bg-[#F6F3EF] px-3 py-1 text-sm font-bold text-[#4B1E6D]">
                                {size.points_required.toLocaleString("pt-BR")} pts
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-[#6B6B6B]">{size.free_toppings_limit}</td>
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <Toggle
                                  checked={size.is_active}
                                  onChange={() => handleToggleActive(size)}
                                  disabled={isLoading}
                                />
                                <Badge active={size.is_active} />
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-xs text-[#6B6B6B]">
                              {formatDate(size.created_at)}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => openEdit(size)}
                                  className="rounded-lg border border-[#E8D8C3] bg-[#FBF8F5] px-2.5 py-1.5 text-xs font-semibold text-[#6B6B6B] transition hover:bg-[#F1E9E2] disabled:opacity-50"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => setConfirmDelete(size)}
                                  className="rounded-lg border border-[#E8D0CC] bg-[#FFF8F6] px-2.5 py-1.5 text-xs font-semibold text-[#9A5D52] transition hover:bg-[#FFF1ED] disabled:opacity-50"
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Cards mobile */}
                <div className="space-y-3 md:hidden">
                  {filteredSizes.map((size) => {
                    const isLoading = actionLoadingId === size.id
                    const ordered = [...sizes].sort((a, b) => a.sort_order - b.sort_order)
                    const absoluteIdx = ordered.findIndex((s) => s.id === size.id)
                    const isFirst = absoluteIdx === 0
                    const isLast = absoluteIdx === ordered.length - 1

                    return (
                      <div
                        key={size.id}
                        className="rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-[#2B2B2B]">{size.name}</p>
                            <p className="mt-0.5 text-xs text-[#6B6B6B]">
                              {size.volume_ml} ml · criado em {formatDate(size.created_at)}
                            </p>
                          </div>
                          <Badge active={size.is_active} />
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl border border-[#E8D8C3] bg-[#FBF8F5] p-2">
                            <p className="text-[10px] uppercase tracking-wide text-[#6B6B6B]">Pontos</p>
                            <p className="text-sm font-bold text-[#4B1E6D]">{size.points_required.toLocaleString("pt-BR")}</p>
                          </div>
                          <div className="rounded-xl border border-[#E8D8C3] bg-[#FBF8F5] p-2">
                            <p className="text-[10px] uppercase tracking-wide text-[#6B6B6B]">Grátis</p>
                            <p className="text-sm font-bold text-[#2B2B2B]">{size.free_toppings_limit}</p>
                          </div>
                          <div className="rounded-xl border border-[#E8D8C3] bg-[#FBF8F5] p-2">
                            <p className="text-[10px] uppercase tracking-wide text-[#6B6B6B]">Ordem</p>
                            <p className="text-sm font-bold text-[#2B2B2B]">{size.sort_order}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={isFirst || isLoading}
                            onClick={() => handleMove(size, "up")}
                            className="rounded-lg border border-[#E8D8C3] bg-[#FBF8F5] px-2.5 py-1.5 text-xs font-semibold text-[#6B6B6B] hover:bg-[#F1E9E2] disabled:opacity-30"
                          >▲ Cima</button>
                          <button
                            type="button"
                            disabled={isLast || isLoading}
                            onClick={() => handleMove(size, "down")}
                            className="rounded-lg border border-[#E8D8C3] bg-[#FBF8F5] px-2.5 py-1.5 text-xs font-semibold text-[#6B6B6B] hover:bg-[#F1E9E2] disabled:opacity-30"
                          >▼ Baixo</button>
                          <Toggle
                            checked={size.is_active}
                            onChange={() => handleToggleActive(size)}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => openEdit(size)}
                            className="rounded-lg border border-[#E8D8C3] bg-[#FBF8F5] px-2.5 py-1.5 text-xs font-semibold text-[#6B6B6B] hover:bg-[#F1E9E2] disabled:opacity-50"
                          >Editar</button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => setConfirmDelete(size)}
                            className="rounded-lg border border-[#E8D0CC] bg-[#FFF8F6] px-2.5 py-1.5 text-xs font-semibold text-[#9A5D52] hover:bg-[#FFF1ED] disabled:opacity-50"
                          >Excluir</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Footer do card */}
          <div className="border-t border-[#F0ECE7] px-5 py-3 text-xs text-[#6B6B6B] md:px-6">
            {sizes.length} tamanho(s) no total · {sizes.filter((s) => s.is_active).length} ativo(s) · {sizes.filter((s) => !s.is_active).length} inativo(s)
          </div>
        </div>
      </div>

      <RewardSizeFormModal
        isOpen={modalOpen}
        size={editingSize}
        onClose={closeModal}
        onSave={handleSave}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Excluir tamanho"
        description={`Tem certeza que deseja excluir "${confirmDelete?.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        onConfirm={() => handleDelete(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
      />

      <ToastContainer toasts={toasts} onCloseToast={closeToast} />
    </div>
  )
}

export default AdminRewardSizes
