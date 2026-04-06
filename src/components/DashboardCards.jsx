import { formatCurrency } from "../utils/format.js"

function DashboardCards({ summary, isDark = false }) {
  const cards = [
    {
      label: "Total de clientes",
      value: summary.totalClients,
      subtitle: "Clientes cadastrados no programa.",
      tone: isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#E6DFF0] bg-white text-[#2B2B2B]",
      muted: isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]",
    },
    {
      label: "Total de pontos",
      value: summary.totalPoints,
      subtitle: "Pontuação total acumulada na base.",
      tone: isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#E6DFF0] bg-white text-[#2B2B2B]",
      muted: isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]",
    },
    {
      label: "Total gasto",
      value: formatCurrency(summary.totalSpent),
      subtitle: "Valor total gasto pelos clientes.",
      tone: isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#E6DFF0] bg-white text-[#2B2B2B]",
      muted: isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]",
    },
    {
      label: "Total de açaís resgatados",
      value: summary.totalResgatados,
      subtitle: "Quantidade total de resgates realizados no programa.",
      tone: isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#E6DFF0] bg-white text-[#2B2B2B]",
      muted: isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]",
    },
    {
      label: "Açaí mais resgatado",
      value: summary.acaiMaisResgatado || "Nenhum resgate",
      subtitle: "Tamanho mais resgatado no programa.",
      tone: isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#E6DFF0] bg-white text-[#2B2B2B]",
      muted: isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]",
    },
    {
      label: "Cliente destaque",
      value: summary.topClient ? summary.topClient.name : "Sem dados",
      subtitle: "Cliente com maior pontuação atual.",
      tone: isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#E6DFF0] bg-white text-[#2B2B2B]",
      muted: isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]",
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => (
        <article
          key={card.label}
          className={`flex min-h-44 flex-col justify-between rounded-2xl border p-6 shadow-sm light-gold-surface ${card.tone}`}
        >
          <p className={`text-sm ${card.muted}`}>{card.label}</p>
          <h3 className={`mt-3 text-2xl font-black leading-tight md:text-3xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>{card.value}</h3>
          <p className={`mt-4 text-xs ${card.muted}`}>{card.subtitle}</p>
        </article>
      ))}
    </section>
  )
}

export default DashboardCards