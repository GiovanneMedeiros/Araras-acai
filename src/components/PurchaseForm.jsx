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
    <section className="rounded-2xl border border-[#E6DFF0] bg-white p-6 shadow-sm md:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B6B6B]">Ação rápida</p>
          <h2 className="text-xl font-bold text-[#2B2B2B] sm:text-2xl">Nova compra</h2>
        </div>
        <span className="rounded-full bg-[#E8D8C3] px-3 py-1 text-sm text-[#6B4E2E]">
          Pontuação automática
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
            Cliente
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-[#2B2B2B] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
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
          <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
            Valor da compra
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ex.: 39.90"
            value={purchaseValue}
            onChange={(e) => setPurchaseValue(e.target.value)}
            className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-[#2B2B2B] outline-none transition placeholder:text-[#9A948D] focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-[#5B2A86] px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-[#6D3EA2]"
        >
          Registrar e pontuar
        </button>
      </form>

      <p className="mt-5 text-sm text-[#6B6B6B]">
        Regra atual: a cada R$ 1 em compra, 1 ponto é creditado automaticamente.
      </p>
    </section>
  )
}

export default PurchaseForm