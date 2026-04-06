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
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#2B2B2B]/20 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E6DFF0] bg-white p-6 text-[#2B2B2B] shadow-sm md:p-7">

        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold md:text-2xl">Resgatar recompensa</h3>
            <p className="mt-1 text-sm text-[#6B6B6B]">
              Cliente: <span className="font-semibold text-[#2B2B2B]">{client.name}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 rounded-xl border border-[#E8D8C3] bg-[#F6F3EF] px-3 py-1.5 text-sm text-[#6B6B6B] hover:bg-[#F1E9E2]"
          >
            Fechar
          </button>
        </div>

        <div className="rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6B6B6B]">
            Selecione o copo
          </p>
          <div className="mt-2 space-y-2">
            {rewardOptions.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E6DFF0] bg-white px-3 py-3"
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
                    className="h-4 w-4 accent-[#4B1E6D]"
                  />
                  {option.label}
                </span>
                <span className="text-right text-xs text-[#6B6B6B]">
                  {option.points} pts · até {option.free_toppings_limit} grátis
                </span>
              </label>
            ))}
          </div>
          {selectionError ? (
            <p className="mt-2 rounded-lg border border-[#F0DDD8] bg-[#FFF8F6] px-3 py-2 text-sm text-[#9A5D52]">
              {selectionError}
            </p>
          ) : null}
        </div>

        {freeToppings.length > 0 ? (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#2B2B2B]">Complementos grátis</p>
              {selectedOption ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    freeToppingsChosen > limit
                      ? "bg-[#FFF1ED] text-[#9A5D52]"
                      : "bg-[#E8D8C3] text-[#6B4E2E]"
                  }`}
                >
                  {freeToppingsChosen}/{limit}
                  {freeToppingsChosen > limit ? ` (+${extraFree} × R$2,00)` : " grátis"}
                </span>
              ) : (
                <span className="text-xs text-[#9A948D]">Selecione o tamanho primeiro</span>
              )}
            </div>
            {selectedOption ? (
              <p className="mb-2 text-xs text-[#6B6B6B]">
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
                        ? "border-[#D4C0AE] bg-[#F6F3EF]"
                        : "border-[#E6DFF0] bg-white hover:bg-[#F6F3EF]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleTopping(topping)}
                      className="h-4 w-4 shrink-0 rounded accent-[#4B1E6D]"
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
              <p className="mb-2 text-sm font-semibold text-[#2B2B2B]">Adicionais pagos</p>
            <div className="grid grid-cols-2 gap-2">
              {paidToppings.map((topping) => {
                const checked = selectedToppings.some((item) => item.id === topping.id)
                return (
                  <label
                    key={topping.id}
                    className={`flex cursor-pointer items-center justify-between gap-1 rounded-xl border px-3 py-2 transition-colors ${
                      checked
                        ? "border-[#E8D8C3] bg-[#F6EFE7]"
                        : "border-[#E6DFF0] bg-white hover:bg-[#F6F3EF]"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleTopping(topping)}
                        className="h-4 w-4 shrink-0 rounded accent-[#6B4E2E]"
                      />
                      <span className="text-sm">{topping.name}</span>
                    </span>
                    <span className="shrink-0 text-xs text-[#6B4E2E]">+{formatCurrency(topping.price)}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6B6B6B]">Total adicional</p>
          {extraFree > 0 ? (
            <p className="mt-1 text-xs text-[#6B6B6B]">
              {extraFree} excedente(s) × R$2,00 = {formatCurrency(extraFreeTotal)}
              {paidToppingsTotal > 0 ? ` + adicionais pagos ${formatCurrency(paidToppingsTotal)}` : ""}
            </p>
          ) : null}
          <p className="mt-1 text-2xl font-black text-[#2B2B2B]">{formatCurrency(additionalTotal)}</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-sm font-semibold text-[#6B6B6B] hover:bg-[#F1E9E2]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-2xl bg-[#5B2A86] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#6D3EA2]"
          >
            Enviar pedido no WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

export default RedeemRewardModal
