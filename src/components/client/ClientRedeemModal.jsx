import { useMemo, useState } from "react"
import { formatCurrency } from "../../utils/format.js"

function ClientRedeemModal({
  isOpen,
  clientName,
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

  function handleToggle(topping) {
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

  function handleSubmit() {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 grid place-items-end bg-slate-950/45 p-3 backdrop-blur-sm sm:place-items-center">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] border border-white/20 bg-white p-5 text-slate-900 shadow-2xl sm:rounded-[2rem]">

        <div className="mb-3">
          <p className="text-xs uppercase tracking-[0.14em] text-fuchsia-700">Resgate</p>
          <h3 className="font-['Baloo_2'] text-3xl leading-tight text-fuchsia-950">Monte seu açaí</h3>
          <p className="text-sm text-slate-600">Cliente: {clientName}</p>
        </div>

        <div className="mb-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-fuchsia-700">Escolha o copo</p>
          {rewardOptions.map((option) => (
            <label
              key={option.id}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition-colors ${
                selectedOptionId === option.id
                  ? "border-fuchsia-400 bg-fuchsia-50"
                  : "border-slate-200 hover:border-fuchsia-200"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <input
                  type="radio"
                  name="reward-option-client"
                  value={option.id}
                  checked={selectedOptionId === option.id}
                  onChange={(event) => {
                    setSelectedOptionId(event.target.value)
                    setSelectionError("")
                  }}
                  className="h-4 w-4 accent-fuchsia-600"
                />
                {option.label}
              </span>
              <span className="text-right text-xs font-bold text-fuchsia-800">
                {option.points} pts · até {option.free_toppings_limit} grátis
              </span>
            </label>
          ))}
          {selectionError ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {selectionError}
            </p>
          ) : null}
        </div>

        {freeToppings.length > 0 ? (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-fuchsia-700">
                Complementos grátis
              </p>
              {selectedOption ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    freeToppingsChosen > limit
                      ? "bg-rose-100 text-rose-700"
                      : "bg-fuchsia-100 text-fuchsia-700"
                  }`}
                >
                  {freeToppingsChosen}/{limit}
                  {freeToppingsChosen > limit ? ` (+${extraFree} × R$2,00)` : " grátis"}
                </span>
              ) : (
                <span className="text-xs text-slate-400">Selecione o tamanho</span>
              )}
            </div>
            {selectedOption ? (
              <p className="mb-2 text-xs text-slate-500">
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
                        ? "border-fuchsia-400 bg-fuchsia-50"
                        : "border-slate-200 hover:border-fuchsia-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggle(topping)}
                      className="h-4 w-4 shrink-0 accent-fuchsia-600"
                    />
                    <span className="text-sm text-slate-800">{topping.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : null}

        {paidToppings.length > 0 ? (
          <div className="mb-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-amber-700">
              Adicionais pagos
            </p>
            <div className="grid grid-cols-2 gap-2">
              {paidToppings.map((topping) => {
                const checked = selectedToppings.some((item) => item.id === topping.id)
                return (
                  <label
                    key={topping.id}
                    className={`flex cursor-pointer items-center justify-between gap-1 rounded-xl border px-3 py-2 transition-colors ${
                      checked
                        ? "border-amber-400 bg-amber-50"
                        : "border-slate-200 hover:border-amber-200"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggle(topping)}
                        className="h-4 w-4 shrink-0 accent-amber-600"
                      />
                      <span className="text-sm text-slate-800">{topping.name}</span>
                    </span>
                    <span className="shrink-0 text-xs font-bold text-amber-700">
                      +{formatCurrency(topping.price)}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="mb-4 rounded-xl bg-fuchsia-50 px-3 py-3">
          <p className="text-xs uppercase tracking-[0.12em] text-fuchsia-600">Total adicional</p>
          {extraFree > 0 ? (
            <p className="mt-0.5 text-xs text-fuchsia-500">
              {extraFree} excedente(s) × R$2,00 = {formatCurrency(extraFreeTotal)}
              {paidToppingsTotal > 0 ? ` + pagos ${formatCurrency(paidToppingsTotal)}` : ""}
            </p>
          ) : null}
          <p className="mt-1 text-xl font-black text-fuchsia-900">{formatCurrency(additionalTotal)}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-500 px-3 py-2.5 text-sm font-bold text-white"
          >
            Enviar no WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

export default ClientRedeemModal
