import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import ClientOverviewCard from "../components/client/ClientOverviewCard.jsx"
import ClientPurchaseHistory from "../components/client/ClientPurchaseHistory.jsx"
import ClientRedemptionHistory from "../components/client/ClientRedemptionHistory.jsx"
import ClientRedeemModal from "../components/client/ClientRedeemModal.jsx"
import ToastContainer from "../components/ui/ToastContainer.jsx"
import {
  BUSINESS_WHATSAPP,
  REWARD_COST,
} from "../constants/loyalty.js"
import {
  findClientByAuthUserId,
  findClientByEmail,
  getClientByIdWithDetails,
  linkClientByEmailToAuthUser,
} from "../services/clientsService.js"
import { listRewardOptions, listToppings, redeemClientReward } from "../services/rewardsService.js"
import { getUserFriendlyErrorMessage } from "../utils/errorMessage.js"
import { formatCurrency } from "../utils/format.js"
import { useClientAuth } from "../hooks/useClientAuth.jsx"
import { useThemeMode } from "../hooks/useThemeMode.jsx"
import logoAraras from "../assets/logo-araras.png"

function ClientPortal() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useThemeMode()
  const { user, signOutClient } = useClientAuth()
  const [activeClient, setActiveClient] = useState(null)
  const [clientLoading, setClientLoading] = useState(true)
  const [clientError, setClientError] = useState(null)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [rewardOptions, setRewardOptions] = useState([])
  const [toppings, setToppings] = useState([])
  const [toasts, setToasts] = useState([])
  const [signingOut, setSigningOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const activeRewardCost =
    rewardOptions.length > 0
      ? Math.min(...rewardOptions.map((option) => option.points))
      : REWARD_COST

  const availableRewards = useMemo(
    () => (activeClient ? Math.floor(activeClient.points / activeRewardCost) : 0),
    [activeClient, activeRewardCost]
  )

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

  async function resolveAuthenticatedClient({ user, emailFallback }) {
    if (!user?.id) return null

    const byAuthId = await findClientByAuthUserId(user.id)
    if (byAuthId) return byAuthId

    const byEmail = await findClientByEmail(emailFallback || user.email)
    if (byEmail) return byEmail

    const linkedByEmail = await linkClientByEmailToAuthUser({
      authUserId: user.id,
      email: emailFallback || user.email,
    })

    return linkedByEmail
  }

  useEffect(() => {
    let mounted = true

    async function loadOptions() {
      try {
        const [options, tops] = await Promise.all([
          listRewardOptions(),
          listToppings(),
        ])
        if (!mounted) return
        setRewardOptions(options)
        setToppings(tops)
      } catch (error) {
        if (!mounted) return
        pushToast(
          "Erro ao carregar dados",
          "Não foi possível carregar as opções de recompensa. Verifique sua conexão.",
          "error"
        )
      }
    }

    loadOptions()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadAuthenticatedClient() {
      if (!mounted) return

      if (!user) {
        setActiveClient(null)
        setClientError(null)
        setClientLoading(false)
        return
      }

      setClientLoading(true)
      setClientError(null)

      try {
        const linkedClient = await resolveAuthenticatedClient({
          user,
          emailFallback: user.email,
        })

        if (!mounted) return

        if (!linkedClient) {
          setActiveClient(null)
          setClientError("Não foi possível vincular sua conta aos dados do clube.")
          return
        }

        setActiveClient(linkedClient)
        setClientError(null)
      } catch (error) {
        console.error("[ClientPortal] Falha ao resolver cliente autenticado:", error)
        if (!mounted) return
        setActiveClient(null)
        setClientError("Não foi possível vincular sua conta aos dados do clube.")
      } finally {
        if (!mounted) return
        setClientLoading(false)
      }
    }

    loadAuthenticatedClient()

    return () => {
      mounted = false
    }
  }, [user])

  async function refreshActiveClient(clientId) {
    const latestClient = await getClientByIdWithDetails(clientId)
    setActiveClient(latestClient)
  }

  async function handleConfirmRedeem({ selectedOption, addons, additionalTotal, extraFreeCount = 0 }) {
    if (!activeClient) return
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
        clientId: activeClient.id,
        cost: selectedOption.points,
        label: selectedOption.label,
        addons: addonLabels,
        additionalTotal,
      })

      await refreshActiveClient(activeClient.id)
      setRedeemOpen(false)
      pushToast(
        "Resgate realizado com sucesso 🎉",
        "Seu pedido foi preparado e você foi direcionado para o WhatsApp."
      )

      const addonText = addonLabels.length ? addonLabels.join(", ") : "Nenhum"

      const whatsappMessage = [
        "Olá, Arara's Açaí!",
        "",
        "Quero resgatar minha recompensa do clube.",
        `Cliente: ${activeClient.name}`,
        `Telefone: ${activeClient.phone}`,
        `Recompensa: ${selectedOption.label}`,
        `Pontos usados: ${selectedOption.points}`,
        `Complementos: ${addonText}`,
        extraFreeCount > 0
          ? `Excedente grátis: ${extraFreeCount} × R$2,00 = ${formatCurrency(extraFreeCount * 2)}`
          : null,
        `Valor dos adicionais: ${formatCurrency(additionalTotal)}`,
        "",
        "Podem confirmar meu pedido para delivery, por favor?",
      ].filter(Boolean).join("\n")

      window.open(
        `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(whatsappMessage)}`,
        "_blank",
        "noopener,noreferrer"
      )
    } catch (error) {
      pushToast(
        "Não foi possível registrar o resgate",
        getUserFriendlyErrorMessage(error),
        "error"
      )
    }
  }

  function handleContinueWhatsapp() {
    if (!activeClient) return

    const message = [
      "Olá, Arara's Açaí!",
      `Sou ${activeClient.name} (${activeClient.phone}) e quero continuar meu pedido no delivery.`,
      `Saldo atual: ${activeClient.points} pontos no clube.`,
    ].join("\n")

    window.open(
      `https://wa.me/${BUSINESS_WHATSAPP}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    )
  }

  async function handleSignOut() {
    if (signingOut) return

    setSigningOut(true)
    setMobileMenuOpen(false)

    try {
      // Completa logout antes de navegar para evitar race condition
      await signOutClient()
    } catch (error) {
      console.error("[ClientPortal] Erro no logout:", error)
      pushToast(
        "Não foi possível sair",
        "Tente novamente em instantes.",
        "error"
      )
    } finally {
      setSigningOut(false)
      // Navega DEPOIS de completar logout e estado estar limpo
      navigate("/login", { replace: true })
    }
  }

  return (
    <div className={`relative min-h-screen px-3 py-6 ${isDark ? "bg-[#171321] text-[#EDE7FA]" : "bg-[#F6F3EF] text-[#2B2B2B]"}`}>
      <div className="pointer-events-none fixed right-4 top-6 z-30 hidden md:block">
        <div className="pointer-events-auto flex w-[9rem] flex-col gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="light-gold-button inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-[#CDBB92] bg-[#FFF8E8] px-4 py-2.5 text-xs font-bold text-[#5B2A86] shadow-sm transition hover:bg-white"
          >
            <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
            {isDark ? "Modo claro" : "Modo dark"}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="light-gold-button inline-flex w-full items-center justify-center whitespace-nowrap rounded-2xl border border-[#CDBB92] bg-[#FFF8E8] px-4 py-2.5 text-xs font-bold text-[#5B2A86] shadow-sm transition hover:bg-white"
          >
            {signingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-md space-y-5">
        <header className={`relative rounded-2xl border p-5 text-white shadow-sm ${isDark ? "border-[#3C3155] bg-gradient-to-r from-[#3C2458] to-[#5A3A82]" : "border-[#D8D0E8] bg-gradient-to-r from-[#5B2A86] to-[#7A4FB3]"}`}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="light-gold-button absolute right-4 top-4 inline-flex items-center justify-center rounded-xl border border-white/35 bg-white/90 px-3 py-2 text-sm font-black text-[#5B2A86] md:hidden"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>

          {mobileMenuOpen ? (
            <div className="absolute right-4 top-16 z-20 w-44 space-y-2 rounded-2xl border border-white/35 bg-white/95 p-3 shadow-lg md:hidden">
              <button
                type="button"
                onClick={() => {
                  toggleTheme()
                  setMobileMenuOpen(false)
                }}
                className="light-gold-button inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[#D8C08B] bg-[#FFF8E8] px-3 py-2 text-xs font-bold text-[#5B2A86]"
              >
                <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
                {isDark ? "Modo claro" : "Modo dark"}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="light-gold-button inline-flex w-full items-center justify-center whitespace-nowrap rounded-xl border border-[#D8C08B] bg-[#FFF8E8] px-3 py-2 text-xs font-bold text-[#5B2A86]"
              >
                {signingOut ? "Saindo..." : "Sair"}
              </button>
            </div>
          ) : null}

          <div className="flex items-start gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-5">
              <div>
                <img
                  src={logoAraras}
                  alt="Logo Arara's Acai"
                  className="h-[4.5rem] w-auto max-w-[11rem] object-contain sm:h-[5rem] sm:max-w-[12.5rem]"
                />
              </div>
              <div className="min-w-0 pl-2 sm:pl-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/75">Área do Cliente</p>
                <h1 className="font-['Baloo_2'] text-3xl leading-tight text-white">Arara's Açaí</h1>
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/82">
            Seu miniapp de fidelidade para acompanhar pontos, compras e resgates com rapidez.
          </p>
        </header>

        {clientLoading ? (
          <section className={`rounded-2xl border p-5 shadow-sm ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#D8D0E8] bg-white text-[#2B2B2B]"}`}>
            <h3 className="font-['Baloo_2'] text-2xl">Carregando seu cadastro</h3>
            <p className={`mt-2 text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
              Estamos vinculando sua conta aos dados do clube. Se esse aviso permanecer, faça login novamente.
            </p>
          </section>
        ) : null}

        {!clientLoading && clientError ? (
          <section className={`rounded-2xl border p-5 shadow-sm ${isDark ? "border-[#5E3F4A] bg-[#2A1F2A] text-[#E8C8D0]" : "border-[#E8D0CC] bg-[#FFF8F6] text-[#9A5D52]"}`}>
            <h3 className={`font-['Baloo_2'] text-2xl ${isDark ? "text-[#F4DCE2]" : "text-[#2B2B2B]"}`}>Não foi possível carregar sua conta</h3>
            <p className={`mt-2 text-sm ${isDark ? "text-[#E8C8D0]" : ""}`}>{clientError}</p>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="mt-4 rounded-2xl bg-[#5B2A86] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#6D3EA2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? "Saindo..." : "Refazer login"}
            </button>
          </section>
        ) : null}

        {!clientLoading && !clientError && activeClient ? (
          <>
            <section
              className={`rounded-2xl border p-4 shadow-sm light-gold-surface ${
                isDark
                  ? "border-[#C49633] bg-[#8A6420] text-[#F7E7B8]"
                  : "border-[#D4A53A] bg-[#D39B2E] text-[#FFF1D2]"
              }`}
            >
              <div className="text-center">
                <p className="text-xl font-black uppercase leading-tight text-white sm:text-2xl">
                  Primeiro açaí resgatado com frete grátis!
                </p>
                <p className={`mt-1 text-center text-xs sm:text-sm ${isDark ? "text-[#F2D98A]" : "text-[#F8ECD1]"}`}>
                  No primeiro resgate, sua entrega sai com frete grátis.
                  <br />
                  A partir do segundo pedido grátis, o frete é cobrado normalmente.
                </p>
              </div>
            </section>

            <ClientOverviewCard client={activeClient} rewardCost={activeRewardCost} isDark={isDark} />

            <section className={`rounded-2xl border p-5 shadow-sm light-gold-surface ${isDark ? "border-[#3C3155] bg-[#241D35] text-[#EDE7FA]" : "border-[#D8D0E8] bg-white text-[#2B2B2B]"}`}>
              <h3 className={`font-['Baloo_2'] text-2xl ${isDark ? "text-[#EDE7FA]" : "text-[#2B2B2B]"}`}>Resgate e delivery</h3>
              <p className={`mt-2 text-sm ${isDark ? "text-[#C3BAD9]" : "text-[#6B6B6B]"}`}>
                Quando estiver com pontos suficientes, você resgata e finaliza pelo WhatsApp em poucos toques.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <button
                  type="button"
                  disabled={availableRewards < 1 || rewardOptions.length === 0}
                  onClick={() => setRedeemOpen(true)}
                  className="light-gold-button rounded-2xl bg-[#5B2A86] px-4 py-3 text-sm font-black text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-45 hover:bg-[#6D3EA2]"
                >
                  {availableRewards > 0
                    ? "Resgatar recompensa"
                    : "Você ainda não tem pontos para resgatar"}
                </button>

                <button
                  type="button"
                  onClick={handleContinueWhatsapp}
                  className={`light-gold-button rounded-2xl border px-4 py-3 text-sm font-bold ${isDark ? "border-[#4A3A6D] bg-[#1F1830] text-[#D4C8F0]" : "border-[#D6C7F3] bg-[#F3EDF9] text-[#6B6B6B]"}`}
                >
                  Continuar pedido no WhatsApp
                </button>
              </div>
            </section>

            <ClientPurchaseHistory purchases={activeClient.purchaseHistory} isDark={isDark} />
            <ClientRedemptionHistory redemptions={activeClient.redeemedRewards} isDark={isDark} />
          </>
        ) : null}
      </div>

      <ClientRedeemModal
        isOpen={redeemOpen}
        clientName={activeClient?.name}
        rewardOptions={rewardOptions}
        toppings={toppings}
        onClose={() => setRedeemOpen(false)}
        onConfirm={handleConfirmRedeem}
      />
      <ToastContainer toasts={toasts} onCloseToast={closeToast} />
    </div>
  )
}

export default ClientPortal
