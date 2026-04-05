import { formatCurrency } from "../utils/format.js"

function DashboardCards({ summary }) {
  const cards = [
    {
      label: "Total de clientes",
      value: summary.totalClients,
      subtitle: "Clientes cadastrados no programa.",
      tone: "border-violet-200/25 bg-violet-300/10",
    },
    {
      label: "Total de pontos",
      value: summary.totalPoints,
      subtitle: "Pontuação total acumulada na base.",
      tone: "border-amber-200/25 bg-amber-300/10",
    },
    {
      label: "Total gasto",
      value: formatCurrency(summary.totalSpent),
      subtitle: "Valor total gasto pelos clientes.",
      tone: "border-emerald-200/25 bg-emerald-400/10",
    },
    {
      label: "Total de açaís resgatados",
      value: summary.totalResgatados,
      subtitle: "Quantidade total de resgates realizados no programa.",
      tone: "border-cyan-200/25 bg-cyan-300/10",
    },
    {
      label: "Açaí mais resgatado",
      value: summary.acaiMaisResgatado || "Nenhum resgate",
      subtitle: "Tamanho mais resgatado no programa.",
      tone: "border-rose-200/25 bg-rose-300/10",
    },
    {
      label: "Cliente destaque",
      value: summary.topClient ? summary.topClient.name : "Sem dados",
      subtitle: "Cliente com maior pontuação atual.",
      tone: "border-fuchsia-200/25 bg-fuchsia-300/10",
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`flex min-h-40 flex-col justify-between rounded-3xl border p-5 shadow-xl backdrop-blur-xl ${card.tone}`}
        >
          <p className="text-sm text-white/75">{card.label}</p>
          <h3 className="mt-3 text-2xl font-black leading-tight md:text-3xl">{card.value}</h3>
          <p className="mt-4 text-xs text-white/60">{card.subtitle}</p>
        </article>
      ))}
    </section>
  )
}

export default DashboardCards