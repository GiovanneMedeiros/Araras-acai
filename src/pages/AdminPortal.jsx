import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import ClientForm from "../components/ClientForm.jsx"
import ClientList from "../components/Clientlist.jsx"
import DashboardCards from "../components/DashboardCards.jsx"
import PurchaseForm from "../components/PurchaseForm.jsx"
import RedeemRewardModal from "../components/ui/RedeemRewardModal.jsx"
import ConfirmDialog from "../components/ui/ConfirmDialog.jsx"
import ToastContainer from "../components/ui/ToastContainer.jsx"
import {
  BUSINESS_WHATSAPP,
  REWARD_COST,
} from "../constants/loyalty.js"
import { useAuth } from "../hooks/useAuth.jsx"
import { useThemeMode } from "../hooks/useThemeMode.jsx"
import {
  createClientRecord,
  deleteClientById,
  listClientsWithDetails,
} from "../services/clientsService.js"
import { registerPurchaseForClient } from "../services/purchasesService.js"
import {
  countClientRedemptions,
  getRedemptionsMetrics,
  listRewardOptions,
  listToppings,
  redeemClientReward,
} from "../services/rewardsService.js"
import { getUserFriendlyErrorMessage } from "../utils/errorMessage.js"
import { formatCurrency } from "../utils/format.js"
import { generateWhatsAppLink, generateWhatsAppMessage } from "../utils/whatsapp.js"
import logoAraras from "../assets/logo-araras.png"

function AdminPortal() {
  const { signOut } = useAuth()
  const { isDark, toggleTheme } = useThemeMode()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [toasts, setToasts] = useState([])
  const [redeemTarget, setRedeemTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
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

    try {
      await redeemClientReward({
        clientId: redeemTarget.id,
        cost: selectedOption.points,
        label: selectedOption.label,
        addons: addonLabels,
        additionalTotal,
      })

      await Promise.all([fetchClients(), fetchRedemptionsMetrics()])

      const totalResgates = await countClientRedemptions({
        clientId: redeemTarget.id,
        phone: redeemTarget.phone,
      })

      const whatsappMessage = generateWhatsAppMessage({
        nome: redeemTarget.name,
        telefone: redeemTarget.phone,
        recompensa: selectedOption.label,
        pontos: selectedOption.points,
        totalResgates,
        complementos: addonLabels,
        valorAdicionais: additionalTotal,
      })

      const whatsappUrl = generateWhatsAppLink({
        numeroLoja: BUSINESS_WHATSAPP,
        mensagem: whatsappMessage,
      })

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

  function handleRequestDeleteClient(client) {
    setDeleteTarget(client)
  }

  async function handleConfirmDeleteClient() {
    if (!deleteTarget?.id) return

    try {
      const targetName = deleteTarget.name
      await deleteClientById(deleteTarget.id)
      setDeleteTarget(null)
      await Promise.all([fetchClients(), fetchRedemptionsMetrics()])

      pushToast(
        "Cliente excluido com sucesso",
        `${targetName} e seus registros relacionados foram removidos.`
      )
    } catch (error) {
      pushToast(
        "Nao foi possivel excluir o cliente",
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
    <div className={`relative min-h-screen ${isDark ? "bg-[#171321] text-[#EDE7FA]" : "bg-[#F6F3EF] text-[#2B2B2B]"}`}>
      <div className="pointer-events-none fixed inset-0 tropical-bg" />

      <div className="relative mx-auto max-w-7xl px-4 py-5 md:px-6 md:py-7">
        <header className={`mb-10 rounded-2xl border px-5 py-5 text-white shadow-sm md:px-7 md:py-6 ${isDark ? "border-[#3C3155] bg-gradient-to-r from-[#3C2458] to-[#5A3A82]" : "border-[#D8D0E8] bg-gradient-to-r from-[#5B2A86] to-[#7A4FB3]"}`}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
              <div>
                <img
                  src={logoAraras}
                  alt="Logo Arara's Acai"
                  className="h-[5rem] w-auto max-w-[13rem] object-contain sm:h-[5.5rem] sm:max-w-[15rem]"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-white/75">
                  Sistema de Fidelidade
                </p>
                <h1 className="mt-1.5 text-2xl font-black leading-tight text-white sm:text-3xl md:text-4xl">Arara's Açaí</h1>
                <p className="mt-1.5 max-w-2xl text-sm text-white/82 md:text-base">
                  Gestão de relacionamento com clientes, pontos e recompensas em um só lugar.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="light-gold-button hidden w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-xs font-semibold text-[#5B2A86] lg:inline-flex hover:bg-white"
              >
                <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
                {isDark ? "Modo claro" : "Modo dark"}
              </button>
              <Link
                to="/cliente"
                className="light-gold-button hidden w-full items-center justify-center whitespace-nowrap rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-xs font-semibold text-[#5B2A86] lg:inline-flex hover:bg-white"
              >
                Área do cliente
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="light-gold-button hidden w-full items-center justify-center whitespace-nowrap rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-xs font-semibold text-[#5B2A86] lg:inline-flex hover:bg-white"
              >
                Sair do Admin
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="light-gold-button inline-flex items-center rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-xs font-semibold text-[#5B2A86] lg:hidden"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-nav"
              >
                {mobileMenuOpen ? "Fechar menu" : "Menu"}
              </button>
            </div>
          </div>

          <nav className="mt-5 hidden flex-wrap gap-2 text-sm text-white md:flex">
            <a href="#dashboard" className="rounded-full border border-white/35 bg-white/15 px-3 py-1.5 hover:bg-white/22">
              Dashboard
            </a>
            <a href="#acoes" className="rounded-full border border-white/35 bg-white/15 px-3 py-1.5 hover:bg-white/22">
              Ações
            </a>
            <a href="#clientes" className="rounded-full border border-white/35 bg-white/15 px-3 py-1.5 hover:bg-white/22">
              Clientes
            </a>
            <Link to="/admin/tamanhos" className="rounded-full border border-white/18 bg-[#E8D8C3] px-3 py-1.5 text-[#6B4E2E] hover:bg-[#E2CFB7]">
              Tamanhos de Açaí
            </Link>
          </nav>

          {mobileMenuOpen ? (
            <nav id="mobile-nav" className="mt-4 grid grid-cols-1 gap-2 lg:hidden">
              <a
                href="#dashboard"
                onClick={handleNavigate}
                className="rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#5B2A86]"
              >
                Dashboard
              </a>
              <a
                href="#acoes"
                onClick={handleNavigate}
                className="rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#5B2A86]"
              >
                Ações
              </a>
              <a
                href="#clientes"
                onClick={handleNavigate}
                className="rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#5B2A86]"
              >
                Clientes
              </a>
              <Link
                to="/admin/tamanhos"
                onClick={handleNavigate}
                className="rounded-2xl border border-white/18 bg-[#E8D8C3] px-4 py-2.5 text-sm font-semibold text-[#6B4E2E]"
              >
                Tamanhos de Açaí
              </Link>
              <Link
                to="/cliente"
                onClick={handleNavigate}
                className="rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#5B2A86]"
              >
                Área do cliente
              </Link>
              <button
                type="button"
                onClick={() => {
                  toggleTheme()
                  handleNavigate()
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#5B2A86]"
              >
                <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
                {isDark ? "Modo claro" : "Modo dark"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  handleNavigate()
                  await handleLogout()
                }}
                className="rounded-2xl border border-white/35 bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#5B2A86]"
              >
                Sair do Admin
              </button>
            </nav>
          ) : null}
        </header>

        {screenError ? (
          <section className="mb-6 rounded-2xl border border-[#E8D0CC] bg-[#FFF8F6] p-4 text-sm text-[#9A5D52]">
            {screenError}
          </section>
        ) : null}

        {loading ? (
          <section className={`rounded-2xl border p-6 text-sm font-semibold shadow-sm ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#C3BAD9]" : "border-[#D8D0E8] bg-white text-[#6B6B6B]"}`}>
            Carregando dados do painel...
          </section>
        ) : (
          <main className="space-y-10 md:space-y-12">
            <section id="dashboard" className="scroll-mt-28 space-y-4">
              <div>
                <h2 className={`text-2xl font-bold md:text-3xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Visão geral</h2>
                <p className={`text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                  Métricas principais do programa para leitura rápida e tomada de decisão.
                </p>
              </div>
              <DashboardCards summary={summary} isDark={isDark} />
            </section>

            <section id="acoes" className="scroll-mt-28 space-y-4">
              <div>
                <h2 className={`text-2xl font-bold md:text-3xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Área de ações</h2>
                <p className={`text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
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

            <section className={`rounded-2xl border p-5 shadow-sm md:p-6 light-gold-surface ${isDark ? "border-[#3C3155] bg-[#241D35]" : "border-[#D8D0E8] bg-white"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className={`text-lg font-bold ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Clientes próximos da recompensa</h3>
                <span className={`rounded-full px-3 py-1 text-sm ${isDark ? "border border-[#4D3A72] bg-[#2E2444] text-[#D4C8F0]" : "bg-[#E8D8C3] text-[#6B4E2E]"}`}>
                  até 3 pts
                </span>
              </div>

              {urgentClients.length ? (
                <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {urgentClients.map((client) => (
                    <li key={client.id} className={`rounded-2xl border px-4 py-3 shadow-sm ${isDark ? "border-[#4A3A6D] bg-[#1F1830]" : "border-[#EADCC2] bg-[#FFFCF7]"}`}>
                      <p className={`font-semibold ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>{client.name}</p>
                      <p className={`text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                        Faltam {activeRewardCost - client.points} ponto(s) para resgatar.
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`mt-4 rounded-2xl border border-dashed p-4 text-sm ${isDark ? "border-[#4A3A6D] bg-[#1F1830] text-[#C3BAD9]" : "border-[#E8D8C3] bg-[#F6F3EF] text-[#6B6B6B]"}`}>
                  Nenhum cliente próximo no momento.
                </p>
              )}
            </section>

            <section id="clientes" className="scroll-mt-28 space-y-4">
              <div>
                <h2 className={`text-2xl font-bold md:text-3xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Seção de clientes</h2>
                <p className={`text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                  Consulta, filtros, progresso e histórico em uma área separada e organizada.
                </p>
              </div>

              <ClientList
                clients={clients}
                rewardCost={activeRewardCost}
                onRedeemReward={handleOpenRedeem}
                onDeleteClient={handleRequestDeleteClient}
                isDark={isDark}
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
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir ${deleteTarget?.name || "este cliente"}? Esta acao remove historico de compras e resgates.`}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDeleteClient}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export default AdminPortal
