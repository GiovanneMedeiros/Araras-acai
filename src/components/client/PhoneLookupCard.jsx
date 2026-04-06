function PhoneLookupCard({
  phone,
  onPhoneChange,
  onSubmit,
  isLoading = false,
  error,
  infoMessage,
}) {
  return (
    <section className="rounded-2xl border border-[#E6DFF0] bg-white p-6 text-[#2B2B2B] shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B6B6B]">
        Clube de Fidelidade
      </p>
      <h1 className="mt-2 font-['Baloo_2'] text-3xl leading-tight text-[#2B2B2B]">
        Arara's Açaí
      </h1>
      <p className="mt-1.5 text-sm text-[#6B6B6B]">
        Consulte seus pontos em segundos e acompanhe quando seu próximo açaí grátis estará disponível.
      </p>

      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-[#6B6B6B]">
          WhatsApp
        </label>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 90000-0000"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-lg font-semibold tracking-wide text-[#2B2B2B] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-2xl bg-[#5B2A86] px-5 py-3 text-base font-black text-white shadow-sm transition hover:bg-[#6D3EA2] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Consultando..." : "Consultar meus pontos"}
        </button>
      </form>

      {error ? (
        <p className="mt-3 rounded-xl border border-[#F0DDD8] bg-[#FFF8F6] px-3 py-2 text-sm font-medium text-[#9A5D52]">
          {error}
        </p>
      ) : null}

      {!error && infoMessage ? (
        <p className="mt-3 rounded-xl border border-[#E8D8C3] bg-[#F6F3EF] px-3 py-2 text-sm font-medium text-[#6B6B6B]">
          {infoMessage}
        </p>
      ) : null}
    </section>
  )
}

export default PhoneLookupCard
