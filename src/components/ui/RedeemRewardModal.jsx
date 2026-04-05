import { useMemo, useState } from "react"
import { formatCurrency } from "../../utils/format.js"

function RedeemRewardModal({
  isOpen,
  client,
  rewardOptions = [],
  toppings = [],
  onClose,
  onConfirm,
}) {
  const [selectedToppings, setSelectedToppings] = useState([])
  const [selectedOptionId, setSelectedOptionId] = useState("")
  const [selectionError, setSelectionError] = useState("")

  const freeToppings = toppings.filter((t) => !t.is_paid)
  const paidToppings = toppings.filter((t) => t.is_paid)

  const selectedOption = useMemo(
    () => rewardOptions.find((o) => o.id === selectedOptionId) ?? null,
    [rewardOptions, selectedOptionId]
  )

  const limit = selectedOption?.free_toppings_limit ?? 0
  const freeToppingsChosen = selectedToppings.filter((t) => !t.is_paid).length
  const extraFree = Math.max(0, freeToppingsChosen - limit)
  const extraFreeTotal = extraFree * 2

  const paidToppingsTotal = useMemo(
    () => selectedToppings.filter((t) => t.is_paid).reduce((acc, t) => acc + t.price, 0),
    [selectedToppings]
  )

  const additionalTotal = extraFreeTotal + paidToppingsTotal

  function handleToggleTopping(topping) {
    setSelectedToppings((prev) => {
      const exists = prev.some((item) => item.id === topping.id)
      if (exists) return prev.filter((item) => item.id !== topping.id)
      return [...prev, topping]
    })
  }

  function handleClose() {
    setSelectedToppings([])
    setSelectedOptionId("")
    setSelectionError("")
    onClose()
  }

  function handleConfirm() {
    if (!selectedOption) {
      setSelectionError("Selecione um tamanho de açaí para continuar.")
      return
    }

    onConfirm({
      selectedOption,
      addons: selectedToppings,
      additionalTotal,
      extraFreeCount: extraFree,
    })

    setSelectedToppings([])
    setSelectedOptionId("")
    setSelectionError("")
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/15 bg-slate-900/95 p-5 text-white shadow-2xl md:p-6">

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold md:text-2xl">Resgatar recompensa</h3>
            <p className="mt-1 text-sm text-white/75">
              Cliente: <span className="font-semibold text-white">{client.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-lg border border-white/15 px-2.5 py-1 text-sm text-white/75 hover:bg-white/10"
          >
            Fechar
          </button>
        </div>

        <div className="rounded-2xl border border-emerald-200/20 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-emerald-100/80">
            Selecione o copo
          </p>
          <div className="mt-2 space-y-2">
            {rewardOptions.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2.5"
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name="reward-option-admin"
                    value={option.id}
                    checked={selectedOptionId === option.id}
                    onChange={(event) => {
                      setSelectedOptionId(event.target.value)
                      setSelectionError("")
                    }}
                    className="h-4 w-4 accent-emerald-400"
                  />
                  {option.label}
                </span>
                <span className="text-right text-xs text-emerald-100">
                  {option.points} pts · até {option.free_toppings_limit} grátis
                </span>
              </label>
            ))}
          </div>
          {selectionError ? (
            <p className="mt-2 rounded-lg border border-rose-300/40 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
              {selectionError}
            </p>
          ) : null}
        </div>

        {freeToppings.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white/85">Complementos grátis</p>
              {selectedOption ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    freeToppingsChosen > limit
                      ? "bg-rose-400/20 text-rose-200"
                      : "bg-emerald-400/20 text-emerald-200"
                  }`}
                >
                  {freeToppingsChosen}/{limit}
                  {freeToppingsChosen > limit ? ` (+${extraFree} × R$2,00)` : " grátis"}
                </span>
              ) : (
                <span className="text-xs text-white/40">Selecione o tamanho primeiro</span>
              )}
            </div>
            {selectedOption ? (
              <p className="mb-2 text-xs text-white/50">
                Você pode escolher até {limit} complemento(s) grátis. Excedentes custam R$2,00 cada.
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              {freeToppings.map((topping) => {
                const checked = selectedToppings.some((item) => item.id === topping.id)
                return (
                  <label
                    key={topping.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
                      checked
                        ? "border-emerald-400/50 bg-emerald-500/15"
                        : "border-white/15 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleTopping(topping)}
                      className="h-4 w-4 shrink-0 rounded accent-emerald-400"
                    />
                    <span className="text-sm">{topping.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : null}

        {paidToppings.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-white/85">Adicionais pagos</p>
            <div className="grid grid-cols-2 gap-2">
              {paidToppings.map((topping) => {
                const checked = selectedToppings.some((item) => item.id === topping.id)
                return (
                  <label
                    key={topping.id}
                    className={`flex cursor-pointer items-center justify-between gap-1 rounded-xl border px-3 py-2 transition-colors ${
                      checked
                        ? "border-amber-400/50 bg-amber-500/15"
                        : "border-white/15 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleTopping(topping)}
                        className="h-4 w-4 shrink-0 rounded accent-amber-300"
                      />
                      <span className="text-sm">{topping.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-amber-200">+{formatCurrency(topping.price)}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-amber-200/25 bg-amber-300/10 p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-amber-100/80">Total adicional</p>
          {extraFree > 0 ? (
            <p className="mt-1 text-xs text-amber-200/70">
              {extraFree} excedente(s) × R$2,00 = {formatCurrency(extraFreeTotal)}
              {paidToppingsTotal > 0 ? ` + adicionais pagos ${formatCurrency(paidToppingsTotal)}` : ""}
            </p>
          ) : null}
          <p className="mt-1 text-2xl font-black text-amber-100">{formatCurrency(additionalTotal)}</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-white/20 px-4 py-3 text-sm font-semibold text-white/85 hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-lime-400 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg hover:brightness-110"
          >
            Enviar pedido no WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

export default RedeemRewardModal
