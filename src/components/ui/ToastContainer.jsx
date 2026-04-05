function ToastContainer({ toasts, onCloseToast }) {
  if (!toasts.length) return null

  function getToastStyle(type) {
    if (type === "error") {
      return {
        border: "border-rose-300/40",
        dot: "bg-rose-400",
        title: "text-rose-100",
        message: "text-rose-100/85",
      }
    }

    if (type === "warning") {
      return {
        border: "border-amber-300/40",
        dot: "bg-amber-300",
        title: "text-amber-100",
        message: "text-amber-100/85",
      }
    }

    return {
      border: "border-emerald-300/35",
      dot: "bg-emerald-400",
      title: "text-emerald-100",
      message: "text-emerald-100/85",
    }
  }

  return (
    <div className="fixed top-5 right-4 z-50 flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => {
        const style = getToastStyle(toast.type)

        return (
          <div
            key={toast.id}
            className={`animate-slide-in rounded-2xl border bg-slate-950/90 p-4 text-sm shadow-2xl backdrop-blur-xl ${style.border}`}
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
                className="rounded-lg px-2 py-1 text-white/70 transition hover:bg-white/10 hover:text-white"
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
