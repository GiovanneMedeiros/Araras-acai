import { useEffect, useState } from "react"

const EMPTY_FORM = {
  name: "",
  volume_ml: "",
  points_required: "",
  free_toppings_limit: "3",
  is_active: true,
  sort_order: "0",
}

function field(label, children, error) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-400">{error}</p>
      ) : null}
    </div>
  )
}

function inputClass(hasError) {
  return `w-full rounded-xl border ${hasError ? "border-[#DCA7A0]" : "border-[#E8D8C3]"} bg-[#F6F3EF] px-3 py-2.5 text-sm text-[#2B2B2B] placeholder:text-[#9A948D] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_3px_rgba(75,30,109,0.10)]`
}

function RewardSizeFormModal({ isOpen, size, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [pointsTouched, setPointsTouched] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    if (size) {
      setForm({
        name: size.name,
        volume_ml: String(size.volume_ml),
        points_required: String(size.points_required),
        free_toppings_limit: String(size.free_toppings_limit),
        is_active: size.is_active,
        sort_order: String(size.sort_order),
      })
      setPointsTouched(true)
    } else {
      setForm(EMPTY_FORM)
      setPointsTouched(false)
    }

    setErrors({})
    setSaving(false)
  }, [size, isOpen])

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  function handleVolumeChange(value) {
    setForm((prev) => {
      const next = { ...prev, volume_ml: value }
      if (!pointsTouched && value !== "") {
        next.points_required = value
      }
      return next
    })
    setErrors((prev) => ({ ...prev, volume_ml: undefined, points_required: undefined }))
  }

  function handlePointsChange(value) {
    setPointsTouched(true)
    handleChange("points_required", value)
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = "Nome é obrigatório."
    if (!form.volume_ml || Number(form.volume_ml) <= 0)
      e.volume_ml = "Volume deve ser maior que 0."
    if (!form.points_required || Number(form.points_required) <= 0)
      e.points_required = "Pontos devem ser maior que 0."
    if (form.free_toppings_limit === "" || Number(form.free_toppings_limit) < 0)
      e.free_toppings_limit = "Limite não pode ser negativo."
    if (form.sort_order === "") e.sort_order = "Ordem é obrigatória."
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      await onSave({
        name: form.name.trim(),
        volume_ml: Number(form.volume_ml),
        points_required: Number(form.points_required),
        free_toppings_limit: Number(form.free_toppings_limit),
        is_active: form.is_active,
        sort_order: Number(form.sort_order),
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const isEditing = Boolean(size)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#2B2B2B]/20 px-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#D8D0E8] bg-white p-7 text-[#2B2B2B] shadow-sm">

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#6B6B6B]">
              {isEditing ? "Editar tamanho" : "Novo tamanho"}
            </p>
            <h3 className="mt-1 font-['Baloo_2'] text-2xl leading-tight">
              {isEditing ? form.name || "Editar" : "Cadastrar tamanho"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl border border-[#E8D8C3] bg-[#F6F3EF] px-3 py-1.5 text-sm text-[#6B6B6B] transition hover:bg-[#F1E9E2]"
          >
            Fechar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {field(
            "Nome do tamanho",
            <input
              type="text"
              placeholder="Ex.: Açaí 500ml"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputClass(errors.name)}
            />,
            errors.name
          )}

          <div className="grid grid-cols-2 gap-3">
            {field(
              "Volume (ml)",
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ex.: 500"
                value={form.volume_ml}
                onChange={(e) => handleVolumeChange(e.target.value)}
                className={inputClass(errors.volume_ml)}
              />,
              errors.volume_ml
            )}

            {field(
              "Pontos necessários",
              <div className="space-y-1">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex.: 500"
                  value={form.points_required}
                  onChange={(e) => handlePointsChange(e.target.value)}
                  className={inputClass(errors.points_required)}
                />
                {!pointsTouched && form.volume_ml ? (
                  <p className="text-xs text-[#6B6B6B]">
                    Sugestão automática com base no volume
                  </p>
                ) : null}
              </div>,
              errors.points_required
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field(
              "Compl. grátis (limite)",
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Ex.: 3"
                value={form.free_toppings_limit}
                onChange={(e) => handleChange("free_toppings_limit", e.target.value)}
                className={inputClass(errors.free_toppings_limit)}
              />,
              errors.free_toppings_limit
            )}

            {field(
              "Ordem de exibição",
              <input
                type="number"
                step="1"
                placeholder="Ex.: 1"
                value={form.sort_order}
                onChange={(e) => handleChange("sort_order", e.target.value)}
                className={inputClass(errors.sort_order)}
              />,
              errors.sort_order
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[#2B2B2B]">Status</p>
              <p className="text-xs text-[#6B6B6B]">
                {form.is_active ? "Visível para o cliente" : "Oculto para o cliente"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange("is_active", !form.is_active)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                form.is_active ? "bg-[#5B2A86]" : "bg-[#D8CFC4]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  form.is_active ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-2.5 text-sm font-semibold text-[#6B6B6B] transition hover:bg-[#F1E9E2] disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#5B2A86] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#6D3EA2] disabled:opacity-60"
            >
              {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RewardSizeFormModal
