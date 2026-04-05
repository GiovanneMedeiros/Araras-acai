import { useState } from "react"

function PurchaseForm({ clients, onRegisterPurchase }) {
  const [selectedClientId, setSelectedClientId] = useState("")
  const [purchaseValue, setPurchaseValue] = useState("")

  function handleSubmit(event) {
    event.preventDefault()

    if (!selectedClientId || !purchaseValue) return

    onRegisterPurchase({
      clientId: selectedClientId,
      value: purchaseValue,
    })

    setPurchaseValue("")
    setSelectedClientId("")
  }

  return (
    <section className="rounded-3xl border border-white/15 bg-slate-950/35 p-5 shadow-xl backdrop-blur-xl md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-amber-100/80">Ação rápida</p>
          <h2 className="text-xl font-bold sm:text-2xl">Nova compra</h2>
        </div>
        <span className="rounded-full border border-amber-200/30 bg-amber-300/20 px-3 py-1 text-xs text-amber-100">
          Pontuação automática
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
            Cliente
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full rounded-2xl border border-white/20 bg-white/95 px-4 py-3 text-gray-900 outline-none transition focus:border-violet-500 focus:shadow-[0_0_0_4px_rgba(167,139,250,0.2)]"
          >
            <option value="">Selecione um cliente</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
            Valor da compra
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex.: 39.90"
            value={purchaseValue}
            onChange={(e) => setPurchaseValue(e.target.value)}
            className="w-full rounded-2xl border border-white/20 bg-white/95 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-violet-500 focus:shadow-[0_0_0_4px_rgba(167,139,250,0.2)]"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-300 px-6 py-3 font-semibold text-slate-950 shadow-lg transition hover:brightness-105"
        >
          Registrar e pontuar
        </button>
      </form>

      <p className="mt-4 text-sm text-white/75">
        Regra atual: a cada R$ 10 em compra, 1 ponto é creditado automaticamente.
      </p>
    </section>
  )
}

export default PurchaseForm