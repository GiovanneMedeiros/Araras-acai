import { formatCurrency, formatDate } from "../../utils/format.js"

function ClientRedemptionHistory({ redemptions, isDark = false }) {
  if (!redemptions.length) {
    return (
      <section className={`rounded-2xl border p-6 text-center shadow-sm light-gold-surface ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#C3BAD9]" : "border-[#D8D0E8] bg-white text-[#6B6B6B]"}`}>
        <p className={`font-['Baloo_2'] text-2xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Nenhum resgate ainda.</p>
        <p className={`mt-2 text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
          Quando você resgatar um açaí grátis, ele aparecerá aqui.
        </p>
      </section>
    )
  }

  return (
    <section className={`rounded-2xl border p-6 shadow-sm light-gold-surface ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#D8D0E8] bg-white text-[#2B2B2B]"}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className={`font-['Baloo_2'] text-2xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Resgates realizados</h3>
        <span className="rounded-full bg-[#E8D8C3] px-3 py-1 text-sm font-semibold text-[#6B4E2E]">
          {redemptions.length} resgate(s)
        </span>
      </div>

      <ul className="space-y-2.5">
        {redemptions.map((redemption) => (
          <li
            key={redemption.id}
            className={`rounded-2xl border p-4 light-gold-surface ${isDark ? "border-[#3C3155] bg-[#1F1830]" : "border-[#E8D8C3] bg-[#F6F3EF]"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={`text-base font-semibold ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>{redemption.label}</p>
                <p className={`text-xs ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>{formatDate(redemption.date)}</p>
                {redemption.addons.length > 0 && (
                  <p className={`mt-1 text-xs ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                    Complementos: {redemption.addons.join(", ")}
                  </p>
                )}
                {redemption.additionalTotal > 0 && (
                  <p className={`mt-0.5 text-xs ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                    Adicionais: {formatCurrency(redemption.additionalTotal)}
                  </p>
                )}
              </div>
              <span className="shrink-0 rounded-full border border-[#C9BAE9] bg-[#F3EDF9] px-3 py-1 text-sm font-bold text-[#5B2A86]">
                -{redemption.cost} pts
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ClientRedemptionHistory
