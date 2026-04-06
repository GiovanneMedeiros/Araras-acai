import { formatCurrency, formatDate } from "../../utils/format.js"
import { POINTS_EXPIRY_DAYS } from "../../constants/loyalty.js"

function getExpiryInfo(dateStr) {
  const expiry = new Date(dateStr)
  expiry.setDate(expiry.getDate() + POINTS_EXPIRY_DAYS)
  const daysLeft = Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24))
  return { expiry, daysLeft }
}

function ClientPurchaseHistory({ purchases, isDark = false }) {
  if (!purchases.length) {
    return (
      <section className={`rounded-2xl border p-6 text-center shadow-sm light-gold-surface ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#C3BAD9]" : "border-[#E6DFF0] bg-white text-[#6B6B6B]"}`}>
        <p className={`font-['Baloo_2'] text-2xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Seu histórico ainda está vazio.</p>
        <p className={`mt-2 text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
          Quando sua próxima compra for registrada, ela aparece aqui com os pontos gerados.
        </p>
      </section>
    )
  }

  return (
    <section className={`rounded-2xl border p-6 shadow-sm light-gold-surface ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#E6DFF0] bg-white text-[#2B2B2B]"}`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className={`font-['Baloo_2'] text-2xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Histórico de compras</h3>
        <span className="rounded-full bg-[#E8D8C3] px-3 py-1 text-sm font-semibold text-[#6B4E2E]">
          {purchases.length} registro(s)
        </span>
      </div>

      <ul className="space-y-2.5">
        {purchases.map((purchase) => (
          <li
            key={purchase.id}
            className={`rounded-2xl border p-4 light-gold-surface ${isDark ? "border-[#3C3155] bg-[#1F1830]" : "border-[#E8D8C3] bg-[#F6F3EF]"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-base font-semibold ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>
                  {formatCurrency(purchase.value)}
                </p>
                <p className={`text-xs ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>{formatDate(purchase.date)}</p>
                {(() => {
                  const { expiry, daysLeft } = getExpiryInfo(purchase.date)
                  if (daysLeft <= 0)
                    return <p className="mt-0.5 text-xs font-semibold text-red-600">Pontos expirados</p>
                  if (daysLeft <= 7)
                    return <p className="mt-0.5 text-xs font-semibold text-orange-600">⚠️ Expira em {daysLeft} dia(s)!</p>
                  return <p className={`mt-0.5 text-xs ${isDark ? "text-[#AFA3C7]" : "text-[#8F8A84]"}`}>Expira em {formatDate(expiry)}</p>
                })()}
              </div>
              <span className="rounded-full border border-[#D6C7F3] bg-[#F3EDF9] px-3 py-1 text-sm font-bold text-[#5B2A86]">
                +{purchase.points} pts
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ClientPurchaseHistory
