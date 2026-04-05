import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import ClientOverviewCard from "../components/client/ClientOverviewCard.jsx"
import ClientPurchaseHistory from "../components/client/ClientPurchaseHistory.jsx"
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
import logoAraras from "../assets/logo-araras.png"

function ClientPortal() {
  const navigate = useNavigate()
  const { user, signOutClient } = useClientAuth()
  const [activeClient, setActiveClient] = useState(null)
  const [clientLoading, setClientLoading] = useState(true)
  const [clientError, setClientError] = useState(null)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [rewardOptions, setRewardOptions] = useState([])
  const [toppings, setToppings] = useState([])
  const [toasts, setToasts] = useState([])
  const [signingOut, setSigningOut] = useState(false)

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,#ffefc0_0%,transparent_28%),radial-gradient(circle_at_80%_0%,#f4c1ff_0%,transparent_25%),linear-gradient(180deg,#27063f_0%,#390b57_52%,#210432_100%)] px-3 py-5 text-white">
      <div className="mx-auto w-full max-w-md space-y-4">
        <header className="rounded-[1.75rem] border border-white/15 bg-white/10 p-4 shadow-xl backdrop-blur-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-2 shadow-lg ring-1 ring-white/15">
                <img
                  src={logoAraras}
                  alt="Logo Arara's Acai"
                  className="h-14 w-auto max-w-[9.5rem] object-contain sm:h-16 sm:max-w-[11rem]"
                />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-amber-100/90">Área do Cliente</p>
                <h1 className="font-['Baloo_2'] text-3xl leading-tight">Arara's Açaí</h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-xl border border-white/35 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
            >
              {signingOut ? "Saindo..." : "Sair"}
            </button>
          </div>
          <p className="mt-2 text-sm text-fuchsia-100/85">
            Seu miniapp de fidelidade para acompanhar pontos, compras e resgates com rapidez.
          </p>
        </header>

        {clientLoading ? (
          <section className="rounded-[1.75rem] border border-amber-100 bg-amber-50/95 p-4 text-amber-900 shadow-[0_16px_70px_rgba(32,16,56,0.2)]">
            <h3 className="font-['Baloo_2'] text-2xl">Carregando seu cadastro</h3>
            <p className="mt-1 text-sm">
              Estamos vinculando sua conta aos dados do clube. Se esse aviso permanecer, faça login novamente.
            </p>
          </section>
        ) : null}

        {!clientLoading && clientError ? (
          <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50/95 p-4 text-rose-900 shadow-[0_16px_70px_rgba(32,16,56,0.2)]">
            <h3 className="font-['Baloo_2'] text-2xl">Não foi possível carregar sua conta</h3>
            <p className="mt-1 text-sm">{clientError}</p>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {signingOut ? "Saindo..." : "Refazer login"}
            </button>
          </section>
        ) : null}

        {!clientLoading && !clientError && activeClient ? (
          <>
            <ClientOverviewCard client={activeClient} rewardCost={activeRewardCost} />

            <section className="rounded-[1.75rem] border border-white/15 bg-white/90 p-4 text-slate-900 shadow-[0_16px_70px_rgba(32,16,56,0.2)]">
              <h3 className="font-['Baloo_2'] text-2xl text-fuchsia-950">Resgate e delivery</h3>
              <p className="mt-1 text-sm text-slate-600">
                Quando estiver com pontos suficientes, você resgata e finaliza pelo WhatsApp em poucos toques.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-2">
                <button
                  type="button"
                  disabled={availableRewards < 1 || rewardOptions.length === 0}
                  onClick={() => setRedeemOpen(true)}
                  className="rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-400 px-4 py-3 text-sm font-black text-slate-950 shadow-lg disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {availableRewards > 0
                    ? "Resgatar recompensa"
                    : "Você ainda não tem pontos para resgatar"}
                </button>

                <button
                  type="button"
                  onClick={handleContinueWhatsapp}
                  className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800"
                >
                  Continuar pedido no WhatsApp
                </button>
              </div>
            </section>

            <ClientPurchaseHistory purchases={activeClient.purchaseHistory} />
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
