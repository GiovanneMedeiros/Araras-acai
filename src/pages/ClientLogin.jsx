import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import ToastContainer from "../components/ui/ToastContainer.jsx"
import { supabase } from "../lib/supabase.js"
import { createOrLinkClientWithEmail } from "../services/clientsService.js"
import { getUserFriendlyErrorMessage } from "../utils/errorMessage.js"
import { formatPhoneInput } from "../utils/clientData.js"
import { useClientAuth } from "../hooks/useClientAuth.jsx"
import logoAraras from "../assets/logo-araras.png"

function ClientLogin() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useClientAuth()

  const [toasts, setToasts] = useState([])
  const [authMode, setAuthMode] = useState("login")
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerPhone, setRegisterPhone] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [loadingEmailLogin, setLoadingEmailLogin] = useState(false)
  const [loadingRegister, setLoadingRegister] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [forgotOpen, setForgotOpen] = useState(false)
  const [sendingResetEmail, setSendingResetEmail] = useState(false)

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

  useEffect(() => {
    if (authLoading) return
    if (!user) return

    // Redireciona usuario ja autenticado para area protegida
    navigate("/cliente", { replace: true })
  }, [authLoading, user, navigate])

  async function handleEmailLogin(event) {
    event.preventDefault()

    if (!supabase) {
      pushToast(
        "Serviço indisponível",
        "Não foi possível realizar o login. Tente novamente.",
        "error"
      )
      return
    }

    const cleanEmail = String(loginEmail || "").trim().toLowerCase()
    const cleanPassword = String(loginPassword || "")

    if (!cleanEmail || !cleanPassword) {
      pushToast(
        "Campos obrigatórios",
        "Informe e-mail e senha para continuar.",
        "warning"
      )
      return
    }

    setLoadingEmailLogin(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (error) {
        const message = String(error?.message || "").toLowerCase()

        if (
          message.includes("invalid login credentials") ||
          message.includes("invalid") ||
          message.includes("credentials")
        ) {
          pushToast("Falha no login", "E-mail ou senha incorretos.", "error")
          return
        }

        if (message.includes("email not confirmed") || message.includes("not confirmed")) {
          pushToast(
            "E-mail não confirmado",
            "Confirme seu e-mail antes de entrar na conta.",
            "warning"
          )
          return
        }

        pushToast(
          "Falha no login",
          "Não foi possível realizar o login. Tente novamente.",
          "error"
        )
        return
      }

      navigate("/cliente", { replace: true })
      pushToast("Login realizado com sucesso 🎉", "Sua conta foi carregada com sucesso.")
    } catch (error) {
      pushToast(
        "Falha no login",
        getUserFriendlyErrorMessage(error, "Não foi possível realizar o login. Tente novamente."),
        "error"
      )
    } finally {
      setLoadingEmailLogin(false)
    }
  }

  async function handleCreateAccount(event) {
    event.preventDefault()

    const cleanName = String(registerName || "").trim()
    const cleanPhone = String(registerPhone || "").trim()
    const cleanEmail = String(registerEmail || "").trim().toLowerCase()
    const cleanPassword = String(registerPassword || "")

    if (!cleanName || !cleanPhone || !cleanEmail || !cleanPassword) {
      pushToast(
        "Preencha todos os campos para continuar.",
        "Preencha todos os campos para continuar.",
        "warning"
      )
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      pushToast(
        "E-mail inválido",
        "Informe um e-mail válido para continuar.",
        "warning"
      )
      return
    }

    if (cleanPassword.length < 6) {
      pushToast(
        "Senha muito curta",
        "A senha deve ter pelo menos 6 caracteres.",
        "warning"
      )
      return
    }

    const phoneDigits = cleanPhone.replace(/\D/g, "")
    if (phoneDigits.length < 10) {
      pushToast(
        "Telefone inválido",
        "Informe um telefone válido para continuar.",
        "warning"
      )
      return
    }

    if (!supabase) {
      pushToast(
        "Serviço indisponível",
        "Não foi possível criar a conta. Tente novamente.",
        "error"
      )
      return
    }

    setLoadingRegister(true)

    try {
      const result = await createOrLinkClientWithEmail({
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        password: cleanPassword,
      })

      await supabase.auth.signOut()

      setRegisterName("")
      setRegisterPhone("")
      setRegisterEmail("")
      setRegisterPassword("")
      setLoginEmail(cleanEmail)
      setResetEmail(cleanEmail)
      setAuthMode("login")
      setForgotOpen(false)

      const successTitle = result.wasLinked
        ? "Conta criada e vinculada ao seu cadastro com sucesso 🎉"
        : "Conta criada com sucesso 🎉"

      pushToast(successTitle, successTitle)
    } catch (error) {
      console.error("[ClientLogin] Falha no cadastro com semi-vinculo:", error)
      await supabase.auth.signOut()

      const message = String(error?.message || "").toLowerCase()

      if (message.includes("telefone") && message.includes("vinculado")) {
        pushToast(
          "Telefone já vinculado",
          "Este telefone já está vinculado a outra conta. Faça login ou use outro número.",
          "error"
        )
        return
      }

      if (message.includes("pré-cadastro") || message.includes("pre-cadastro")) {
        pushToast(
          "Liberação manual necessária",
          "Seu telefone já existe em um pré-cadastro sem e-mail validado. Peça para a loja liberar o vínculo antes de criar o acesso.",
          "warning"
        )
        return
      }

      if (message.includes("pertence a outro cadastro")) {
        pushToast(
          "Telefone não confere",
          "O telefone informado já está associado a outro cadastro. Revise os dados ou fale com a loja.",
          "error"
        )
        return
      }

      if (
        message.includes("already registered") ||
        message.includes("already exists") ||
        (message.includes("e-mail") && (message.includes("uso") || message.includes("existe")))
      ) {
        pushToast("Este e-mail já está em uso.", "Este e-mail já está em uso.", "error")
        return
      }

      if (message.includes("preencha todos os campos")) {
        pushToast(
          "Preencha todos os campos para continuar.",
          "Preencha todos os campos para continuar.",
          "warning"
        )
        return
      }

      if (message.includes("não foi confirmado") || message.includes("nao foi confirmado")) {
        pushToast(
          "E-mail não confirmado",
          "Conta criada, mas você precisa confirmar seu e-mail para concluir o acesso.",
          "warning"
        )
        return
      }

      if (message.includes("faltou permissao para vincular o telefone")) {
        pushToast(
          "Permissão pendente no banco",
          "Seu usuário foi criado, mas o vínculo por telefone foi bloqueado pelas políticas RLS. Execute o SQL de atualização e tente novamente.",
          "error"
        )
        return
      }

      pushToast(
        "Não foi possível criar a conta. Tente novamente.",
        "Não foi possível criar a conta. Tente novamente.",
        "error"
      )
    } finally {
      setLoadingRegister(false)
    }
  }

  async function handleForgotPassword(event) {
    event.preventDefault()

    if (!supabase) {
      pushToast(
        "Serviço indisponível",
        "Não foi possível concluir a ação. Tente novamente.",
        "error"
      )
      return
    }

    const cleanEmail = String(resetEmail || loginEmail || "").trim().toLowerCase()

    if (!cleanEmail) {
      pushToast(
        "E-mail obrigatório",
        "Informe seu e-mail para continuar.",
        "warning"
      )
      return
    }

    setSendingResetEmail(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        throw new Error("Não foi possível concluir a ação. Tente novamente.")
      }

      pushToast(
        "E-mail enviado ✅",
        "Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha."
      )
      setForgotOpen(false)
    } catch (error) {
      pushToast(
        "Falha na recuperação",
        getUserFriendlyErrorMessage(error),
        "error"
      )
    } finally {
      setSendingResetEmail(false)
    }
  }

  return (
    <div className="min-h-full bg-[#F6F3EF] px-3 py-6 text-[#2B2B2B]">
      <div className="mx-auto w-full max-w-md space-y-4">
        <header className="rounded-2xl border border-[#D8D0E8] bg-gradient-to-r from-[#5B2A86] to-[#7A4FB3] p-5 text-white shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-white/16 p-3 ring-1 ring-white/25">
              <img
                src={logoAraras}
                alt="Logo Arara's Acai"
                className="h-14 w-auto max-w-[10.5rem] object-contain sm:h-16 sm:max-w-[12rem]"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/75">Área do Cliente</p>
              <h1 className="font-['Baloo_2'] text-2xl leading-tight text-white sm:text-3xl">Arara's Açaí</h1>
            </div>
          </div>
          <p className="mt-2 text-sm text-white/82">
            Entre na sua conta para acessar pontos, compras e recompensas.
          </p>
        </header>

        <section className="rounded-2xl border border-[#D8D0E8] bg-white p-5 text-[#2B2B2B] shadow-sm">
          <p className="text-xs uppercase tracking-[0.14em] text-[#6B6B6B]">Acesso com e-mail</p>
          <h2 className="mt-1 font-['Baloo_2'] text-2xl text-[#2B2B2B]">
            {authMode === "login" ? "Entrar na conta" : "Criar conta"}
          </h2>
          <p className="mt-2 text-sm text-[#6B6B6B]">
            {authMode === "login"
              ? "Faça login com e-mail e senha para acessar seus pontos e resgates."
              : "Crie sua conta para acompanhar pontos, compras e resgates."}
          </p>

          <div className="relative mt-4 rounded-2xl border border-[#D8D0E8] bg-[#F6F3EF] p-1 shadow-sm">
            <div
              className={`pointer-events-none absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl bg-white shadow-sm ring-1 ring-[#E6DFF0] transition-all duration-300 ${
                authMode === "login" ? "left-1" : "left-[calc(50%+0.125rem)]"
              }`}
            />
            <div className="relative grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login")
                }}
                className={`rounded-xl px-3 py-2.5 text-sm font-extrabold transition-colors duration-200 ${
                  authMode === "login"
                    ? "text-[#2B2B2B]"
                    : "text-[#6B6B6B] hover:text-[#2B2B2B]"
                }`}
                aria-pressed={authMode === "login"}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register")
                  setForgotOpen(false)
                }}
                className={`rounded-xl px-3 py-2.5 text-sm font-extrabold transition-colors duration-200 ${
                  authMode === "register"
                    ? "text-[#2B2B2B]"
                    : "text-[#6B6B6B] hover:text-[#2B2B2B]"
                }`}
                aria-pressed={authMode === "register"}
              >
                Criar conta
              </button>
            </div>
          </div>

          {authMode === "login" ? (
            <>
              <form onSubmit={handleEmailLogin} className="mt-3 space-y-2.5">
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={loginEmail}
                  onChange={(event) => {
                    setLoginEmail(event.target.value)
                    if (!resetEmail) setResetEmail(event.target.value)
                  }}
                  className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-sm font-semibold text-[#2B2B2B] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
                />
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-sm font-semibold text-[#2B2B2B] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
                />
                <button
                  type="submit"
                  disabled={loadingEmailLogin}
                  className="w-full rounded-2xl bg-[#5B2A86] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#6D3EA2]"
                >
                  {loadingEmailLogin ? "Entrando..." : "Entrar com e-mail e senha"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setForgotOpen((prev) => !prev)}
                className="mt-2 text-xs font-semibold text-[#6B6B6B] underline-offset-2 hover:text-[#2B2B2B] hover:underline"
              >
                Esqueci minha senha
              </button>

              {forgotOpen ? (
                <form onSubmit={handleForgotPassword} className="mt-3 rounded-2xl border border-[#C9BAE9] bg-[#F3EDF9] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6B6B6B]">
                    Recuperar senha
                  </p>
                  <p className="mt-1 text-xs text-[#6B6B6B]">
                    Informe seu e-mail para receber o link de redefinição.
                  </p>
                  <input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={resetEmail}
                    onChange={(event) => setResetEmail(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#D8D0E8] bg-white px-3 py-2.5 text-sm font-semibold text-[#2B2B2B] outline-none transition focus:border-[#5B2A86] focus:shadow-[0_0_0_4px_rgba(91,42,134,0.10)]"
                  />
                  <button
                    type="submit"
                    disabled={sendingResetEmail}
                    className="mt-2 w-full rounded-xl bg-[#5B2A86] px-3 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#6D3EA2]"
                  >
                    {sendingResetEmail ? "Enviando..." : "Enviar link de recuperação"}
                  </button>
                </form>
              ) : null}
            </>
          ) : null}

          {authMode !== "login" ? (
            <form onSubmit={handleCreateAccount} className="mt-3 space-y-2.5">
              <input
                type="text"
                placeholder="Seu nome"
                value={registerName}
                onChange={(event) => setRegisterName(event.target.value)}
                className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-sm font-semibold text-[#2B2B2B] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
              />
              <input
                type="tel"
                placeholder="Seu WhatsApp"
                value={registerPhone}
                onChange={(event) => setRegisterPhone(formatPhoneInput(event.target.value))}
                className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-sm font-semibold text-[#2B2B2B] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
              />
              <input
                type="email"
                placeholder="seuemail@exemplo.com"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-sm font-semibold text-[#2B2B2B] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
              />
              <input
                type="password"
                placeholder="Crie uma senha"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-sm font-semibold text-[#2B2B2B] outline-none transition focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
              />
              <button
                type="submit"
                disabled={loadingRegister}
                className="w-full rounded-2xl bg-[#5B2A86] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-[#6D3EA2]"
              >
                {loadingRegister ? "Criando conta..." : "Criar conta"}
              </button>
            </form>
          ) : null}
        </section>
      </div>

      <ToastContainer toasts={toasts} onCloseToast={closeToast} />
    </div>
  )
}

export default ClientLogin
