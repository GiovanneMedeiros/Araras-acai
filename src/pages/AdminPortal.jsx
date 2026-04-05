import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import ClientForm from "../components/ClientForm.jsx"
import ClientList from "../components/Clientlist.jsx"
import DashboardCards from "../components/DashboardCards.jsx"
import PurchaseForm from "../components/PurchaseForm.jsx"
import RedeemRewardModal from "../components/ui/RedeemRewardModal.jsx"
import ToastContainer from "../components/ui/ToastContainer.jsx"
import {
  BUSINESS_WHATSAPP,
  REWARD_COST,
} from "../constants/loyalty.js"
import { useAuth } from "../hooks/useAuth.jsx"
import { createClientRecord, listClientsWithDetails } from "../services/clientsService.js"
import { registerPurchaseForClient } from "../services/purchasesService.js"
import {
  getRedemptionsMetrics,
  listRewardOptions,
  listToppings,
  redeemClientReward,
} from "../services/rewardsService.js"
import { getUserFriendlyErrorMessage } from "../utils/errorMessage.js"
import { formatCurrency } from "../utils/format.js"
import logoAraras from "../assets/logo-araras.png"

function AdminPortal() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [toasts, setToasts] = useState([])
  const [redeemTarget, setRedeemTarget] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [screenError, setScreenError] = useState("")
  const [rewardOptions, setRewardOptions] = useState([])
  const [toppings, setToppings] = useState([])
  const [redemptionsMetrics, setRedemptionsMetrics] = useState({
    totalResgatados: 0,
    acaiMaisResgatado: "Nenhum resgate",
  })

  const activeRewardCost =
    rewardOptions.length > 0
      ? Math.min(...rewardOptions.map((option) => option.points))
      : REWARD_COST

  async function fetchClients() {
    const data = await listClientsWithDetails()
    setClients(data)
  }

  async function fetchRedemptionsMetrics() {
    const metrics = await getRedemptionsMetrics()
    setRedemptionsMetrics(metrics)
  }

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      setLoading(true)

      try {
        const [data, options, tops, metrics] = await Promise.all([
          listClientsWithDetails(),
          listRewardOptions(),
          listToppings(),
          getRedemptionsMetrics(),
        ])

        if (!mounted) return
        setClients(data)
        setRewardOptions(options)
        setToppings(tops)
        setRedemptionsMetrics(metrics)
        setScreenError("")
      } catch (error) {
        if (!mounted) return
        setScreenError(getUserFriendlyErrorMessage(error, "Erro ao carregar o painel do admin."))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    bootstrap()

    return () => {
      mounted = false
    }
  }, [])

  function pushToast(title, message, type = "success") {
    const newToast = {
      id: Date.now() + Math.random(),
      title,
      message,
      type,
    }

    setToasts((prev) => [newToast, ...prev].slice(0, 4))

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== newToast.id))
    }, 3200)
  }

  function closeToast(id) {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  async function handleAddClient(newClient) {
    try {
      const createdClient = await createClientRecord(newClient)
      setClients((prevClients) => [createdClient, ...prevClients])
      
      const hasAuthAccess = Boolean(newClient.email && newClient.password)
      const successTitle = hasAuthAccess
        ? "Cliente e acesso cadastrados com sucesso 🎉"
        : "Cliente cadastrado com sucesso 🎉"
      const successMessage = hasAuthAccess
        ? `${createdClient.name} agora pode acessar a área de cliente com suas credenciais.`
        : `${createdClient.name} agora faz parte do clube Arara's Açaí. Acesso pode ser adicionado depois.`
      
      pushToast(successTitle, successMessage)
    } catch (error) {
      pushToast(
        "Não foi possível concluir o cadastro",
        getUserFriendlyErrorMessage(error, "Não foi possível cadastrar o cliente. Tente novamente."),
        "error"
      )
    }
  }

  async function handleRegisterPurchase({ clientId, value }) {
    try {
      const result = await registerPurchaseForClient({ clientId, value })
      await Promise.all([fetchClients(), fetchRedemptionsMetrics()])

      pushToast(
        "Pontos adicionados com sucesso ✅",
        `${result.clientName} somou ${result.earnedPoints} pontos com ${formatCurrency(result.purchaseValue)}.`
      )
    } catch (error) {
      pushToast(
        "Não foi possível registrar a compra",
        getUserFriendlyErrorMessage(error),
        "error"
      )
    }
  }

  function handleOpenRedeem(clientId) {
    const selectedClient = clients.find((client) => client.id === clientId)
    if (!selectedClient) return
    if (!rewardOptions.length) {
      pushToast(
        "Opções indisponíveis",
        "Nenhuma opção de recompensa foi encontrada no momento.",
        "warning"
      )
      return
    }
    if (selectedClient.points < activeRewardCost) return

    setRedeemTarget(selectedClient)
  }

  async function handleConfirmRedeem({ selectedOption, addons, additionalTotal, extraFreeCount = 0 }) {
    if (!redeemTarget) return
    if (!selectedOption || !selectedOption.label || !selectedOption.points) {
      pushToast(
        "Selecione um tamanho de açaí",
        "Selecione um tamanho de açaí para continuar.",
        "warning"
      )
      return
    }

    const addonLabels = addons.map((addon) => addon.label)
    const addonText = addonLabels.length ? addonLabels.join(", ") : "Nenhum"

    try {
      await redeemClientReward({
        clientId: redeemTarget.id,
        cost: selectedOption.points,
        label: selectedOption.label,
        addons: addonLabels,
        additionalTotal,
      })

      await Promise.all([fetchClients(), fetchRedemptionsMetrics()])

      const message = [
        "Olá, Arara's Açaí!",
        "",
        "Quero resgatar meu açaí grátis no programa de fidelidade.",
        `Cliente: ${redeemTarget.name}`,
        `Produto: ${selectedOption.label}`,
        `Pontos usados: ${selectedOption.points}`,
        `Complementos: ${addonText}`,
        extraFreeCount > 0
          ? `Excedente grátis: ${extraFreeCount} × R$2,00 = ${formatCurrency(extraFreeCount * 2)}`
          : null,
        `Valor dos adicionais: ${formatCurrency(additionalTotal)}`,
        "",
        "Pode confirmar meu pedido, por favor?",
      ].filter(Boolean).join("\n")

      const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(message)}`

      pushToast(
        "Resgate realizado com sucesso 🎉",
        `${redeemTarget.name} foi direcionado para o WhatsApp para concluir o pedido.`
      )

      setRedeemTarget(null)
      window.open(whatsappUrl, "_blank", "noopener,noreferrer")
    } catch (error) {
      pushToast(
        "Não foi possível registrar o resgate",
        getUserFriendlyErrorMessage(error),
        "error"
      )
    }
  }

  const summary = useMemo(() => {
    const totalClients = clients.length
    const totalPoints = clients.reduce((acc, client) => acc + client.points, 0)
    const totalSpent = clients.reduce(
      (acc, client) => acc + Number(client.totalSpent || 0),
      0
    )
    const totalRedeemedRewards = clients.reduce(
      (acc, client) => acc + client.redeemedRewards.length,
      0
    )

    const topClient =
      clients.length > 0
        ? clients.reduce((top, current) =>
            current.points > top.points ? current : top
          )
        : null

    const ranking = [...clients]
      .sort((a, b) => b.points - a.points || b.totalSpent - a.totalSpent)
      .slice(0, 5)

    const nearlyReward = clients.filter(
      (client) => client.points < activeRewardCost && activeRewardCost - client.points <= 3
    )

    return {
      totalClients,
      totalPoints,
      totalSpent,
      topClient,
      totalResgatados: redemptionsMetrics.totalResgatados,
      acaiMaisResgatado: redemptionsMetrics.acaiMaisResgatado,
      ranking,
      totalRedeemedRewards,
      nearlyReward,
    }
  }, [activeRewardCost, clients, redemptionsMetrics])

  const urgentClients = summary.nearlyReward.slice(0, 3)

  function handleNavigate() {
    setMobileMenuOpen(false)
  }

  async function handleLogout() {
    await signOut()
    navigate("/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#240540_0%,#3f1263_48%,#5e1f7a_100%)] text-white">
      <div className="pointer-events-none fixed inset-0 tropical-bg" />

      <div className="relative mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-7">
        <header className="mb-8 rounded-3xl border border-white/15 bg-gradient-to-r from-violet-950/90 via-violet-900/85 to-fuchsia-900/80 px-4 py-4 shadow-2xl backdrop-blur-xl md:px-6 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-2 shadow-lg ring-1 ring-white/15">
                <img
                  src={logoAraras}
                  alt="Logo Arara's Acai"
                  className="h-16 w-auto max-w-[12rem] object-contain sm:h-20 sm:max-w-[14rem]"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200/85">
                  Sistema de Fidelidade
                </p>
                <h1 className="mt-1.5 text-2xl font-black leading-tight sm:text-3xl md:text-4xl">Arara's Açaí</h1>
                <p className="mt-1.5 max-w-2xl text-sm text-violet-100/85 md:text-base">
                  Gestão de relacionamento com clientes, pontos e recompensas em um só lugar.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Link
                to="/cliente"
                className="hidden rounded-xl border border-emerald-200/35 bg-emerald-400/20 px-3 py-2 text-xs font-semibold text-emerald-50 md:inline-flex"
              >
                Ir para a área do cliente
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-xl border border-rose-200/40 bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100 md:inline-flex"
              >
                Sair do Admin
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 md:hidden"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav"
              >
                {mobileMenuOpen ? "Fechar menu" : "Menu"}
              </button>
            </div>
          </div>

          <nav className="mt-4 hidden flex-wrap gap-2 text-sm text-white/85 md:flex">
            <a href="#dashboard" className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 hover:bg-white/20">
              Dashboard
            </a>
            <a href="#acoes" className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 hover:bg-white/20">
              Ações
            </a>
            <a href="#clientes" className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 hover:bg-white/20">
              Clientes
            </a>
          </nav>

          {mobileMenuOpen ? (
            <nav id="mobile-nav" className="mt-4 grid grid-cols-1 gap-2 md:hidden">
              <a
                href="#dashboard"
                onClick={handleNavigate}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90"
              >
                Dashboard
              </a>
              <a
                href="#acoes"
                onClick={handleNavigate}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90"
              >
                Ações
              </a>
              <a
                href="#clientes"
                onClick={handleNavigate}
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold text-white/90"
              >
                Clientes
              </a>
              <Link
                to="/cliente"
                onClick={handleNavigate}
                className="rounded-xl border border-emerald-200/35 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-100"
              >
                Área do cliente
              </Link>
              <button
                type="button"
                onClick={async () => {
                  handleNavigate()
                  await handleLogout()
                }}
                className="rounded-xl border border-rose-200/40 bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-100"
              >
                Sair do Admin
              </button>
            </nav>
          ) : null}
        </header>

        {screenError ? (
          <section className="mb-5 rounded-2xl border border-rose-300/40 bg-rose-400/10 p-4 text-sm text-rose-100">
            {screenError}
          </section>
        ) : null}

        {loading ? (
          <section className="rounded-2xl border border-white/15 bg-white/10 p-5 text-sm font-semibold text-white/90 backdrop-blur-xl">
            Carregando dados do painel...
          </section>
        ) : (
          <main className="space-y-8 md:space-y-9">
            <section id="dashboard" className="scroll-mt-28 space-y-3">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Visão geral</h2>
                <p className="text-sm text-white/70">
                  Métricas principais do programa para leitura rápida e tomada de decisão.
                </p>
              </div>
              <DashboardCards summary={summary} />
            </section>

            <section id="acoes" className="scroll-mt-28 space-y-3">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Área de ações</h2>
                <p className="text-sm text-white/70">
                  Cadastre clientes e registre compras em blocos dedicados.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
                <ClientForm onAddClient={handleAddClient} />
                <PurchaseForm
                  clients={clients}
                  onRegisterPurchase={handleRegisterPurchase}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/15 bg-slate-950/35 p-4 shadow-xl backdrop-blur-xl md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold">Clientes próximos da recompensa</h3>
                <span className="rounded-full border border-lime-300/30 bg-lime-300/10 px-2.5 py-1 text-xs text-lime-100">
                  até 3 pts
                </span>
              </div>

              {urgentClients.length ? (
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {urgentClients.map((client) => (
                    <li key={client.id} className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3">
                      <p className="font-semibold text-white">{client.name}</p>
                      <p className="text-sm text-amber-100/90">
                        Faltam {activeRewardCost - client.points} ponto(s) para resgatar.
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-white/20 bg-white/5 p-3 text-sm text-white/65">
                  Nenhum cliente próximo no momento.
                </p>
              )}
            </section>

            <section id="clientes" className="scroll-mt-28 space-y-3">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Seção de clientes</h2>
                <p className="text-sm text-white/70">
                  Consulta, filtros, progresso e histórico em uma área separada e organizada.
                </p>
              </div>

              <ClientList
                clients={clients}
                rewardCost={activeRewardCost}
                onRedeemReward={handleOpenRedeem}
              />
            </section>
          </main>
        )}
      </div>

      <ToastContainer toasts={toasts} onCloseToast={closeToast} />
      <RedeemRewardModal
        isOpen={Boolean(redeemTarget)}
        client={redeemTarget}
        rewardOptions={rewardOptions}
        toppings={toppings}
        onClose={() => setRedeemTarget(null)}
        onConfirm={handleConfirmRedeem}
      />
    </div>
  )
}

export default AdminPortal
