import { formatCurrency } from "../../utils/format.js"
import { POINTS_EXPIRY_DAYS } from "../../constants/loyalty.js"

function ClientOverviewCard({ client, rewardCost, isDark = false }) {
  const progress = Math.min((client.points / rewardCost) * 100, 100)
  const pointsToNext = Math.max(rewardCost - client.points, 0)
  const availableRewards = Math.floor(client.points / rewardCost)

  return (
    <section className={`overflow-hidden rounded-2xl border p-6 shadow-sm light-gold-surface ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#E6DFF0] bg-white text-[#2B2B2B]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs uppercase tracking-[0.14em] ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>Cliente</p>
          <h2 className={`mt-1 font-['Baloo_2'] text-3xl leading-tight ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>{client.name}</h2>
          <p className={`text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>{client.phone}</p>
        </div>
        <span className="rounded-full border border-[#D6C7F3] bg-[#F3EDF9] px-3 py-1 text-sm font-semibold text-[#5B2A86]">
          {availableRewards} resgate(s)
        </span>
      </div>

      <div className="mt-6 rounded-2xl border border-[#D6C7F3] bg-[#F3EDF9] p-5 text-[#2B2B2B] shadow-sm">
        <p className="text-xs uppercase tracking-[0.14em] text-[#6B6B6B]">Pontos atuais</p>
        <p className="mt-1 text-4xl font-black leading-none text-[#2B2B2B]">{client.points}</p>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-[#6B6B6B]">
            <span>Progresso para o próximo açaí</span>
            <span>{client.points % rewardCost}/{rewardCost}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5B2A86] to-[#7A4FB3]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <article className={`rounded-2xl border p-4 shadow-sm ${!isDark ? "light-gold-surface bg-white" : "border-[#3C3155] bg-[#1F1830]"}`}>
          <p className={`text-xs uppercase tracking-[0.12em] ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>Total gasto</p>
          <p className={`mt-1 text-lg font-bold ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>{formatCurrency(client.totalSpent)}</p>
        </article>
        <article className={`rounded-2xl border p-4 shadow-sm ${!isDark ? "light-gold-surface bg-white" : "border-[#3C3155] bg-[#1F1830]"}`}>
          <p className={`text-xs uppercase tracking-[0.12em] ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>Recompensas</p>
          <p className={`mt-1 text-lg font-bold ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>{availableRewards} disponível(is)</p>
        </article>
      </div>

      <p className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-[#3C3155] bg-[#1F1830] text-[#C3BAD9]" : "border-[#D8D0E8] bg-white text-[#6B6B6B]"}`}>
        {pointsToNext > 0 ? (
          <>
            Faltam <span className="font-semibold text-[#B8956B]">{pointsToNext} ponto(s)</span> para o seu próximo açaí.
          </>
        ) : (
          "Você já pode resgatar seu açaí grátis."
        )}
      </p>

      <p className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${isDark ? "border-[#4A3A6D] bg-[#2E2444] text-[#D4C8F0]" : "border-[#C9BAE9] bg-[#F8F4FC] text-[#6B6B6B]"}`}>
        ⚠️ Atenção: seus pontos expiram <strong>{POINTS_EXPIRY_DAYS} dias</strong> após cada compra. Não deixe expirar!
      </p>
    </section>
  )
}

export default ClientOverviewCard
