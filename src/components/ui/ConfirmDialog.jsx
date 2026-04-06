function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-[#2B2B2B]/20 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#E6DFF0] bg-white p-6 text-[#2B2B2B] shadow-sm">
        <h3 className="text-xl font-bold text-[#2B2B2B]">{title}</h3>
        <p className="mt-2 text-[#6B6B6B]">{description}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 font-semibold text-[#6B6B6B] transition hover:bg-[#F1E9E2]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-[#5B2A86] px-4 py-3 font-semibold text-white transition hover:bg-[#6D3EA2]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog
