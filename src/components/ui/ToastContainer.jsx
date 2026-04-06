function ToastContainer({ toasts, onCloseToast }) {
  if (!toasts.length) return null

  function getToastStyle(type) {
    if (type === "error") {
      return {
        border: "border-[#F0DDD8]",
        dot: "bg-[#C47E72]",
        title: "text-[#9A5D52]",
        message: "text-[#9A5D52]",
      }
    }

    if (type === "warning") {
      return {
        border: "border-[#EADCC2]",
        dot: "bg-[#B89452]",
        title: "text-[#6B4E2E]",
        message: "text-[#6B4E2E]",
      }
    }

    return {
      border: "border-[#E8D8C3]",
      dot: "bg-[#5B2A86]",
      title: "text-[#2B2B2B]",
      message: "text-[#6B6B6B]",
    }
  }

  return (
    <div className="fixed top-5 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type)

        return (
          <div
            key={toast.id}
            className={`animate-slide-in rounded-2xl border bg-[#FBF8F5] p-4 text-sm text-[#2B2B2B] shadow-sm ${style.border}`}
          >
            <div className="flex items-start gap-3">
              <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${style.dot}`} />
              <div className="flex-1">
                <p className={`font-semibold ${style.title}`}>{toast.title}</p>
                {toast.message ? <p className={`mt-1 ${style.message}`}>{toast.message}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => onCloseToast(toast.id)}
                className="rounded-lg px-2 py-1 text-[#9A948D] transition hover:bg-[#F5F2EE] hover:text-[#2B2B2B]"
                aria-label="Fechar notificação"
              >
                x
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default ToastContainer
