function VerificationCodeCard({
  code,
  onCodeChange,
  onSubmit,
  onResend,
  error,
  hintCode,
}) {
  return (
    <section className="rounded-2xl border border-[#E6DFF0] bg-white p-6 text-[#2B2B2B] shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B6B6B]">
        Confirmação de acesso
      </p>
      <h2 className="mt-1 font-['Baloo_2'] text-3xl leading-tight text-[#2B2B2B]">
        Digite o código SMS
      </h2>
      <p className="mt-1 text-sm text-[#6B6B6B]">
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
          className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-center text-2xl font-black tracking-[0.3em] text-[#2B2B2B] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
        />

        <button
          type="submit"
          className="w-full rounded-2xl bg-[#5B2A86] px-5 py-3 text-base font-black text-white hover:bg-[#6D3EA2]"
        >
          Entrar na minha conta
        </button>
      </form>

      <button
        type="button"
        onClick={onResend}
        className="mt-2 text-sm font-semibold text-[#6B6B6B] underline-offset-2 hover:text-[#2B2B2B] hover:underline"
      >
        Reenviar código
      </button>

      {error ? (
        <p className="mt-3 rounded-xl border border-[#F0DDD8] bg-[#FFF8F6] px-3 py-2 text-sm font-medium text-[#9A5D52]">
          {error}
        </p>
      ) : null}

      {hintCode ? (
        <p className="mt-3 rounded-xl border border-[#E8D8C3] bg-[#F6F3EF] px-3 py-2 text-xs font-semibold text-[#6B6B6B]">
          Ambiente de testes: código simulado {hintCode}
        </p>
      ) : null}
    </section>
  )
}

export default VerificationCodeCard
