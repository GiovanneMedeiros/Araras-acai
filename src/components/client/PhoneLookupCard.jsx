function PhoneLookupCard({
  phone,
  onPhoneChange,
  onSubmit,
  isLoading = false,
  error,
  infoMessage,
}) {
  return (
    <section className="rounded-[2rem] border border-white/15 bg-white/95 p-5 text-slate-900 shadow-[0_24px_90px_rgba(22,10,40,0.35)] backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-700/80">
        Clube de Fidelidade
      </p>
      <h1 className="mt-2 font-['Baloo_2'] text-3xl leading-tight text-fuchsia-950">
        Arara's Açaí
      </h1>
      <p className="mt-1.5 text-sm text-slate-700">
        Consulte seus pontos em segundos e acompanhe quando seu próximo açaí grátis estará disponível.
      </p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
          WhatsApp
        </label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 90000-0000"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          className="w-full rounded-2xl border border-fuchsia-200 bg-white px-4 py-3 text-lg font-semibold tracking-wide text-slate-900 outline-none ring-fuchsia-300 transition focus:ring-4"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-500 to-amber-400 px-5 py-3 text-base font-black text-white shadow-lg shadow-fuchsia-900/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Consultando..." : "Consultar meus pontos"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      {!error && infoMessage ? (
        <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          {infoMessage}
        </p>
      ) : null}
    </section>
  )
}

export default PhoneLookupCard
