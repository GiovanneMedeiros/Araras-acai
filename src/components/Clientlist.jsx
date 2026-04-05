import { useMemo, useState } from "react"
import { formatCurrency, formatDate, normalizeText } from "../utils/format.js"

function ClientList({ clients, onRedeemReward, rewardCost }) {
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
    <section className="rounded-3xl border border-white/15 bg-slate-950/35 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-violet-100/75">Operação diária</p>
          <h2 className="text-2xl font-bold md:text-3xl">Clientes e recompensas</h2>
        </div>
        <span className="rounded-full border border-violet-200/30 bg-violet-300/20 px-3 py-1 text-sm text-violet-100">
          {clients.length} na base
        </span>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="rounded-2xl border border-white/15 bg-white/10 p-1.5">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="w-full rounded-xl bg-transparent px-3 py-2.5 text-white outline-none placeholder:text-white/50"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-2.5 text-xs font-semibold transition sm:text-sm lg:text-xs ${
                filter === item.id
                  ? "bg-amber-300 text-slate-900"
                  : "border border-white/20 bg-white/10 text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {!filteredClients.length ? (
        <div className="rounded-2xl border border-dashed border-white/25 bg-white/5 p-8 text-center">
          <h3 className="text-lg font-bold">Nenhum resultado por aqui</h3>
          <p className="mt-2 text-sm text-white/70">
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
              className={`rounded-2xl border p-5 shadow-lg transition hover:-translate-y-1 ${
                isVip
                  ? "border-amber-200/35 bg-gradient-to-br from-amber-300/15 via-slate-950/35 to-emerald-400/10"
                  : "border-white/15 bg-white/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold">{client.name}</h3>
                  <p className="mt-1 text-white/70">{client.phone}</p>
                </div>
                <div className="flex max-w-[48%] flex-col items-end gap-1">
                  {isVip ? (
                    <span className="rounded-full border border-amber-200/35 bg-amber-300/25 px-2.5 py-1 text-right text-xs font-semibold text-amber-50">
                      Cliente VIP
                    </span>
                  ) : null}
                  {nearReward ? (
                    <span className="rounded-full border border-amber-200/30 bg-amber-300/20 px-2.5 py-1 text-right text-xs font-semibold text-amber-100">
                      Faltam {pointsToReward} pts
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-white/75">Progresso do resgate</span>
                  <span>
                    {client.points}/{rewardCost}
                  </span>
                </div>

                <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-300 to-lime-300 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-white/80">
                  Total gasto: {formatCurrency(client.totalSpent)}
                </p>

                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    canRedeem
                      ? "bg-emerald-500/20 text-emerald-200"
                      : "bg-purple-900/60 text-white"
                  }`}
                >
                  {canRedeem ? "Resgate disponível" : "Em progresso"}
                </span>
              </div>

              <button
                onClick={() => onRedeemReward(client.id)}
                disabled={!canRedeem}
                className={`mt-4 w-full rounded-2xl px-4 py-3 font-semibold transition ${
                  canRedeem
                    ? "bg-gradient-to-r from-emerald-500 to-lime-400 text-slate-950 shadow-lg hover:brightness-110"
                    : "bg-white/10 text-white/40 cursor-not-allowed"
                }`}
              >
                Resgatar recompensa
              </button>

              <details className="mt-4 rounded-2xl border border-white/10 bg-slate-900/30 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-white/85 marker:text-amber-200">
                  Histórico do cliente
                </summary>

                <div className="mt-3 space-y-3 text-sm">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                      Compras
                    </p>
                    {client.purchaseHistory.length ? (
                      <ul className="space-y-2">
                        {client.purchaseHistory.slice(0, 5).map((purchase) => (
                          <li
                            key={purchase.id}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                          >
                            <p>{formatDate(purchase.date)}</p>
                            <p className="text-white/70">
                              {formatCurrency(purchase.value)} · +{purchase.points} pts
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-white/60">
                        Nenhuma compra registrada ainda.
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                      Recompensas resgatadas
                    </p>
                    {client.redeemedRewards.length ? (
                      <ul className="space-y-2">
                        {client.redeemedRewards.slice(0, 3).map((reward) => (
                          <li
                            key={reward.id}
                            className="rounded-xl border border-emerald-200/20 bg-emerald-500/10 px-3 py-2"
                          >
                            <p>{reward.label}</p>
                            <p className="text-white/70">{formatDate(reward.date)}</p>
                            {reward.addons?.length ? (
                              <p className="text-xs text-white/65">
                                Adicionais: {reward.addons.join(", ")} ({formatCurrency(reward.additionalTotal || 0)})
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-white/60">
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