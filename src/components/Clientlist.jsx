import { useMemo, useState } from "react"
import { formatCurrency, formatDate, normalizeText } from "../utils/format.js"

function ClientList({ clients, onRedeemReward, onDeleteClient, rewardCost, isDark = false }) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const filteredClients = useMemo(() => {
    const normalizedSearch = normalizeText(search.trim())

    return clients.filter((client) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeText(client.name).includes(normalizedSearch) ||
        normalizeText(client.phone).includes(normalizedSearch)

      if (!matchesSearch) return false

      if (filter === "redeemable") return client.points >= rewardCost
      if (filter === "near")
        return client.points < rewardCost && rewardCost - client.points <= 3

      return true
    })
  }, [clients, filter, rewardCost, search])

  const filters = [
    { id: "all", label: "Todos" },
    { id: "redeemable", label: "Prontos para resgatar" },
    { id: "near", label: "Quase lá" },
  ]

  return (
    <section className={`rounded-2xl border p-6 shadow-sm light-gold-surface ${isDark ? "border-[#3C3155] bg-[#241D35]" : "border-[#E6DFF0] bg-white"}`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.16em] ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>Operação diária</p>
          <h2 className={`text-2xl font-bold md:text-3xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Clientes e recompensas</h2>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm ${isDark ? "border-[#4D3A72] bg-[#2E2444] text-[#D4C8F0]" : "border-[#D6C7F3] bg-[#F3EDF9] text-[#5B2A86]"}`}>
          {clients.length} na base
        </span>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className={`rounded-2xl border p-1.5 light-gold-surface ${isDark ? "border-[#3C3155] bg-[#1F1830]" : "border-[#E6DFF0] bg-white"}`}>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou telefone"
            className={`w-full rounded-xl bg-transparent px-3 py-2.5 outline-none placeholder:text-[#9A948D] ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`light-gold-button rounded-full px-3 py-2.5 text-xs font-semibold transition sm:text-sm lg:text-xs ${
                filter === item.id
                  ? "bg-[#5B2A86] text-white"
                  : isDark
                    ? "border border-[#3C3155] bg-[#1F1830] text-[#C3BAD9]"
                    : "border border-[#E6DFF0] bg-white text-[#6B6B6B]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {!filteredClients.length ? (
        <div className={`rounded-2xl border border-dashed p-8 text-center light-gold-surface ${isDark ? "border-[#3C3155] bg-[#1F1830]" : "border-[#E6DFF0] bg-white"}`}>
          <h3 className={`text-lg font-bold ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Nenhum resultado por aqui</h3>
          <p className={`mt-2 text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
            Ajuste os filtros ou revise a busca para encontrar o cliente.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {filteredClients.map((client) => {
          const progress = Math.min((client.points / rewardCost) * 100, 100)
          const canRedeem = client.points >= rewardCost
          const pointsToReward = Math.max(rewardCost - client.points, 0)
          const nearReward = pointsToReward > 0 && pointsToReward <= 3
          const isVip = client.points >= rewardCost * 2

          return (
            <div
              key={client.id}
              className={`rounded-2xl border p-6 shadow-sm transition hover:-translate-y-1 light-gold-surface ${
                isVip
                  ? isDark ? "border-[#4D3A72] bg-[#2E2444]" : "border-[#D6C7F3] bg-[#F3EDF9]"
                  : isDark ? "border-[#3C3155] bg-[#241D35]" : "border-[#E6DFF0] bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className={`text-xl font-bold ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>{client.name}</h3>
                  <p className={`mt-1 ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>{client.phone}</p>
                </div>
                <div className="flex max-w-[48%] flex-col items-end gap-1">
                  {isVip ? (
                    <span className={`rounded-full border px-3 py-1 text-right text-sm font-semibold ${isDark ? "border-[#5D4A86] bg-[#3A2D57] text-[#E0D4F8]" : "border-[#D6C7F3] bg-[#F3EDF9] text-[#5B2A86]"}`}>
                      Cliente VIP
                    </span>
                  ) : null}
                  {nearReward ? (
                    <span className={`rounded-full border px-3 py-1 text-right text-sm font-semibold ${isDark ? "border-[#5D4A86] bg-[#3A2D57] text-[#E0D4F8]" : "border-[#D6C7F3] bg-[#F3EDF9] text-[#5B2A86]"}`}>
                      Faltam {pointsToReward} pts
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className={isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}>Progresso do resgate</span>
                  <span>
                    {client.points}/{rewardCost}
                  </span>
                </div>

                <div className={`h-3 w-full overflow-hidden rounded-full ${isDark ? "bg-[#3A2D57]" : "bg-[#F3EDF9]"}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#5B2A86] to-[#7A4FB3] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className={`text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                  Total gasto: {formatCurrency(client.totalSpent)}
                </p>

                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    canRedeem
                      ? isDark
                        ? "border border-[#5D4A86] bg-[#3A2D57] text-[#E0D4F8]"
                        : "border border-[#D6C7F3] bg-[#F3EDF9] text-[#5B2A86]"
                      : isDark
                        ? "bg-[#1F1830] text-[#C3BAD9]"
                        : "bg-[#F6F3EF] text-[#6B6B6B]"
                  }`}
                >
                  {canRedeem ? "Resgate disponível" : "Em progresso"}
                </span>
              </div>

              <button
                onClick={() => onRedeemReward(client.id)}
                disabled={!canRedeem}
                className={`light-gold-button mt-4 w-full rounded-2xl px-4 py-3 font-semibold transition ${
                  canRedeem
                    ? "bg-[#5B2A86] text-white shadow-sm hover:bg-[#6D3EA2]"
                    : "bg-[#F1ECE7] text-[#A49A90] cursor-not-allowed"
                }`}
              >
                Resgatar recompensa
              </button>

              <button
                type="button"
                onClick={() => onDeleteClient?.(client)}
                className={`light-gold-button mt-2 w-full rounded-2xl border px-4 py-3 font-semibold transition ${isDark ? "border-[#6B3B4A] bg-[#321F2A] text-[#E7B7C3] hover:bg-[#3A2230]" : "border-[#F0DDD8] bg-[#FFF8F6] text-[#9A5D52] hover:bg-[#FFF1ED]"}`}
              >
                Excluir cliente
              </button>

              <details className={`mt-4 rounded-2xl border p-4 light-gold-surface ${isDark ? "border-[#4D3A72] bg-[#1F1830]" : "border-[#D6C7F3] bg-[#F3EDF9]"}`}>
                <summary className={`cursor-pointer text-sm font-semibold marker:text-[#5B2A86] ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>
                  Histórico do cliente
                </summary>

                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                      Compras
                    </p>
                    {client.purchaseHistory.length ? (
                      <ul className="space-y-2">
                        {client.purchaseHistory.slice(0, 5).map((purchase) => (
                          <li
                            key={purchase.id}
                            className={`rounded-xl border px-3 py-2.5 ${isDark ? "border-[#3C3155] bg-[#241D35]" : "border-[#E6DFF0] bg-white"}`}
                          >
                            <p>{formatDate(purchase.date)}</p>
                            <p className={isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}>
                              {formatCurrency(purchase.value)} · +{purchase.points} pts
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`rounded-xl border border-dashed px-3 py-2.5 ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#C3BAD9]" : "border-[#E6DFF0] bg-white text-[#6B6B6B]"}`}>
                        Nenhuma compra registrada ainda.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className={`mb-2 text-xs font-semibold uppercase tracking-wide ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                      Recompensas resgatadas
                    </p>
                    {client.redeemedRewards.length ? (
                      <ul className="space-y-2">
                        {client.redeemedRewards.slice(0, 3).map((reward) => (
                          <li
                            key={reward.id}
                            className={`rounded-xl border px-3 py-2.5 ${isDark ? "border-[#3C3155] bg-[#241D35]" : "border-[#E6DFF0] bg-white"}`}
                          >
                            <p>{reward.label}</p>
                            <p className={isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}>{formatDate(reward.date)}</p>
                            {reward.addons?.length ? (
                              <p className={`text-xs ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                                Adicionais: {reward.addons.join(", ")} ({formatCurrency(reward.additionalTotal || 0)})
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`rounded-xl border border-dashed px-3 py-2.5 ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#C3BAD9]" : "border-[#E6DFF0] bg-white text-[#6B6B6B]"}`}>
                        Sem resgates até agora.
                      </p>
                    )}
                  </div>
                </div>
              </details>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ClientList