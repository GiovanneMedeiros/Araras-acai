import { formatCurrency, formatDate } from "../../utils/format.js"

function ClientPurchaseHistory({ purchases }) {
  if (!purchases.length) {
    return (
      <section className="rounded-[1.75rem] border border-white/15 bg-white/90 p-5 text-center text-slate-700 shadow-[0_16px_70px_rgba(32,16,56,0.2)]">
        <p className="font-['Baloo_2'] text-2xl text-fuchsia-900">Seu histórico ainda está vazio.</p>
        <p className="mt-1 text-sm text-slate-600">
          Quando sua próxima compra for registrada, ela aparece aqui com os pontos gerados.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-[1.75rem] border border-white/15 bg-white/90 p-5 text-slate-900 shadow-[0_16px_70px_rgba(32,16,56,0.2)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-['Baloo_2'] text-2xl text-fuchsia-950">Histórico de compras</h3>
        <span className="rounded-full bg-fuchsia-100 px-2.5 py-1 text-xs font-semibold text-fuchsia-800">
          {purchases.length} registro(s)
        </span>
      </div>

      <ul className="space-y-2.5">
        {purchases.map((purchase) => (
          <li
            key={purchase.id}
            className="rounded-2xl border border-fuchsia-100 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {formatCurrency(purchase.value)}
                </p>
                <p className="text-xs text-slate-500">{formatDate(purchase.date)}</p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
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
