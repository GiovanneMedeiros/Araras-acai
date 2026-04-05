function VerificationCodeCard({
  code,
  onCodeChange,
  onSubmit,
  onResend,
  error,
  hintCode,
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/15 bg-white/95 p-5 text-slate-900 shadow-[0_16px_70px_rgba(32,16,56,0.2)]">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700/80">
        Confirmação de acesso
      </p>
      <h2 className="mt-1 font-['Baloo_2'] text-3xl leading-tight text-fuchsia-950">
        Digite o código SMS
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Enviamos um código para o seu número. Valide para visualizar seus pontos e seu histórico.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-2xl border border-fuchsia-200 bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.3em] text-slate-900 outline-none ring-fuchsia-300 transition focus:ring-4"
        />

        <button
          type="submit"
          className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-500 px-5 py-3 text-base font-black text-white"
        >
          Entrar na minha conta
        </button>
      </form>

      <button
        type="button"
        onClick={onResend}
        className="mt-2 text-sm font-semibold text-fuchsia-700 underline-offset-2 hover:underline"
      >
        Reenviar código
      </button>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {hintCode ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Ambiente de testes: código simulado {hintCode}
        </p>
      ) : null}
    </section>
  )
}

export default VerificationCodeCard
