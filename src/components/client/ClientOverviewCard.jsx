import { formatCurrency } from "../../utils/format.js"

function ClientOverviewCard({ client, rewardCost }) {
  const progress = Math.min((client.points / rewardCost) * 100, 100)
  const pointsToNext = Math.max(rewardCost - client.points, 0)
  const availableRewards = Math.floor(client.points / rewardCost)

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/20 bg-[linear-gradient(165deg,#2c0d47_0%,#4f1466_55%,#6f1a62_100%)] p-5 text-white shadow-[0_24px_90px_rgba(22,10,40,0.45)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-amber-100/80">Cliente</p>
          <h2 className="mt-1 font-['Baloo_2'] text-3xl leading-tight">{client.name}</h2>
          <p className="text-sm text-fuchsia-100/80">{client.phone}</p>
        </div>
        <span className="rounded-full border border-emerald-200/40 bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-100">
          {availableRewards} resgate(s)
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-amber-100/75">Pontos atuais</p>
        <p className="mt-1 text-4xl font-black leading-none">{client.points}</p>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-white/80">
            <span>Progresso para o próximo açaí</span>
            <span>{client.points % rewardCost}/{rewardCost}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-lime-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <article className="rounded-2xl border border-white/15 bg-white/10 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-white/70">Total gasto</p>
          <p className="mt-1 text-lg font-bold">{formatCurrency(client.totalSpent)}</p>
        </article>
        <article className="rounded-2xl border border-white/15 bg-white/10 p-3">
          <p className="text-xs uppercase tracking-[0.12em] text-white/70">Recompensas</p>
          <p className="mt-1 text-lg font-bold">{availableRewards} disponível(is)</p>
        </article>
      </div>

      <p className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-50">
        {pointsToNext > 0
          ? `Faltam ${pointsToNext} ponto(s) para o seu próximo açaí.`
          : "Você já pode resgatar seu açaí grátis."}
      </p>
    </section>
  )
}

export default ClientOverviewCard
