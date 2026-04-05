import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import ToastContainer from "../components/ui/ToastContainer"
import { supabase } from "../lib/supabase"
import { getUserFriendlyErrorMessage } from "../utils/errorMessage"

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasRecoverySession, setHasRecoverySession] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [recoveryNotice, setRecoveryNotice] = useState("")
  const [toasts, setToasts] = useState([])

  function pushToast(title, message, type = "success") {
    const id = Date.now() + Math.random()
    setToasts((previous) => [...previous, { id, title, message, type }])
    setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id))
    }, 4600)
  }

  useEffect(() => {
    let mounted = true

    async function validateRecoverySession() {
      if (!supabase) {
        if (mounted) {
          setIsCheckingSession(false)
          setHasRecoverySession(false)
          setRecoveryNotice("Serviço de autenticação indisponível no momento.")
        }
        return
      }

      const currentUrl = window.location.href
      const url = new URL(currentUrl)
      const hashRaw = window.location.hash || ""
      const hashParams = new URLSearchParams(hashRaw.startsWith("#") ? hashRaw.slice(1) : hashRaw)
      const hasCodeInQuery = Boolean(url.searchParams.get("code"))
      const hasRecoveryHashTokens = Boolean(
        hashParams.get("access_token") && hashParams.get("refresh_token")
      )
      const hasRecoveryTokenHash = Boolean(url.searchParams.get("token_hash"))
      const hasRecoveryType =
        url.searchParams.get("type") === "recovery" || hashParams.get("type") === "recovery"

      const openedFromRecoveryLink =
        hasCodeInQuery || hasRecoveryHashTokens || hasRecoveryTokenHash || hasRecoveryType

      let exchangedSession = null

      if (hasCodeInQuery) {
        const code = url.searchParams.get("code")
        const { data: exchangeData, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code)

        if (!exchangeError && exchangeData?.session) {
          exchangedSession = exchangeData.session
        }
      }

      if (!exchangedSession && hasRecoveryTokenHash && hasRecoveryType) {
        const tokenHash = url.searchParams.get("token_hash")

        const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        })

        if (!verifyError && verifyData?.session) {
          exchangedSession = verifyData.session
        }
      }

      if (!exchangedSession && hasRecoveryHashTokens) {
        const access_token = hashParams.get("access_token")
        const refresh_token = hashParams.get("refresh_token")

        const { data: setSessionData, error: setSessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        })

        if (!setSessionError && setSessionData?.session) {
          exchangedSession = setSessionData.session
        }
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (!mounted) return

      const validSession = Boolean(exchangedSession || sessionData?.session)

      setHasRecoverySession(validSession)

      if (validSession) {
        setRecoveryNotice("")
      } else if (!openedFromRecoveryLink) {
        setRecoveryNotice("Abra esta página pelo link enviado no seu e-mail de recuperação.")
      } else {
        setRecoveryNotice("Link inválido ou expirado. Solicite um novo e-mail de recuperação.")
      }

      setIsCheckingSession(false)
    }

    validateRecoverySession()

    if (!supabase) {
      return () => {
        mounted = false
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === "PASSWORD_RECOVERY") {
        setHasRecoverySession(true)
        setRecoveryNotice("")
      } else {
        const hasSession = Boolean(session)
        setHasRecoverySession(hasSession)
        if (hasSession) {
          setRecoveryNotice("")
        }
      }

      setIsCheckingSession(false)
    })

    return () => {
      mounted = false
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()

    if (!supabase) {
      pushToast("Serviço indisponível", "Não foi possível concluir a ação. Tente novamente.", "error")
      return
    }

    if (!newPassword || !confirmPassword) {
      pushToast("Campos obrigatórios", "Preencha os dois campos para continuar.", "warning")
      return
    }

    if (newPassword.length < 6) {
      pushToast("Senha muito curta", "A senha deve ter pelo menos 6 caracteres.", "warning")
      return
    }

    if (newPassword !== confirmPassword) {
      pushToast("Senhas diferentes", "As senhas informadas não coincidem.", "warning")
      return
    }

    if (!hasRecoverySession) {
      pushToast(
        "Link inválido ou expirado",
        "Solicite um novo e-mail de recuperação para redefinir sua senha.",
        "error"
      )
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        const message = String(error?.message || "").toLowerCase()
        const invalidRecoveryLink =
          message.includes("expired") ||
          message.includes("invalid") ||
          message.includes("jwt") ||
          message.includes("token") ||
          message.includes("session")

        if (invalidRecoveryLink) {
          throw new Error("Link inválido ou expirado. Solicite um novo e-mail de recuperação.")
        }

        throw new Error("Não foi possível atualizar sua senha. Tente novamente.")
      }

      pushToast("Senha atualizada ✅", "Sua senha foi redefinida com sucesso.")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      pushToast(
        "Erro ao atualizar senha",
        getUserFriendlyErrorMessage(error, "Tente novamente em instantes."),
        "error"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-white px-4 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-6 shadow-[0_24px_65px_-25px_rgba(244,114,182,0.35)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-700">Recuperação de conta</p>
        <h1 className="mt-2 text-2xl font-black leading-tight text-slate-900">Defina sua nova senha</h1>
        <p className="mt-2 text-sm text-slate-600">
          Digite sua nova senha para concluir a recuperação de acesso.
        </p>

        {isCheckingSession ? (
          <div className="mt-4 rounded-2xl border border-fuchsia-100 bg-fuchsia-50 px-4 py-3 text-sm font-semibold text-fuchsia-700">
            Validando seu link de recuperação...
          </div>
        ) : null}

        {!isCheckingSession && !hasRecoverySession ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            {recoveryNotice || "Link inválido ou expirado. Solicite um novo e-mail de recuperação."}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="password"
            placeholder="Nova senha"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-2xl border border-fuchsia-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-fuchsia-300 transition focus:ring-4"
          />
          <input
            type="password"
            placeholder="Confirme a nova senha"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-2xl border border-fuchsia-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-fuchsia-300 transition focus:ring-4"
          />

          <button
            type="submit"
            disabled={isSubmitting || isCheckingSession || !hasRecoverySession}
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-fuchsia-200/60 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Atualizando..." : "Atualizar senha"}
          </button>
        </form>

        <Link to="/cliente" className="mt-4 inline-block text-xs font-semibold text-fuchsia-700 underline-offset-2 hover:underline">
          Voltar para o portal do cliente
        </Link>
      </div>

      <ToastContainer toasts={toasts} />
    </main>
  )
}
