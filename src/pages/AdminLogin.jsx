import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/useAuth.jsx"
import { isSupabaseConfigured, supabase } from "../lib/supabase.js"
import { getUserFriendlyErrorMessage } from "../utils/errorMessage.js"

function AdminLogin() {
  const { reloadAuth, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,#f7df9f_0%,transparent_22%),radial-gradient(circle_at_86%_14%,#ffc7db_0%,transparent_24%),linear-gradient(160deg,#26063f_0%,#441061_46%,#71173f_100%)] px-4 py-6 text-white">
        <main className="mx-auto flex min-h-[92vh] w-full max-w-md items-center">
          <section className="w-full rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/85">
              Configuração obrigatória
            </p>

            <h1 className="mt-2 font-['Baloo_2'] text-4xl leading-tight">
              Admin indisponível
            </h1>

            <p className="mt-2 text-sm text-fuchsia-100/90">
              Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo
              .env.local para liberar o login real.
            </p>
          </section>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(145deg,#25053f_0%,#40115f_52%,#5f1a7a_100%)] text-white">
        <p className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur-xl">
          Carregando sessão...
        </p>
      </div>
    )
  }

  async function handleAdminLogin(event) {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const cleanEmail = String(email || "").trim().toLowerCase()
      const cleanPassword = String(password || "")

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      })

      if (signInError) {
        throw new Error(getUserFriendlyErrorMessage(signInError, "Falha no login administrativo."))
      }

      const user = signInData?.user || signInData?.session?.user || null
      const userId = String(user?.id || "")

      if (!userId) {
        await supabase.auth.signOut()
        throw new Error("Nao foi possivel validar o usuario autenticado.")
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, role")
        .eq("id", userId)
        .maybeSingle()

      if (profileError) {
        await supabase.auth.signOut()
        throw new Error("Nao foi possivel validar permissao administrativa.")
      }

      const role = String(profile?.role || "").toLowerCase()
      if (role !== "admin") {
        await supabase.auth.signOut()
        throw new Error("Acesso negado. Este usuario nao possui permissao de administrador.")
      }

      await reloadAuth()
      navigate("/admin/dashboard", { replace: true })
    } catch (currentError) {
      setError(getUserFriendlyErrorMessage(currentError, "Falha no login administrativo."))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,#f7df9f_0%,transparent_22%),radial-gradient(circle_at_86%_14%,#ffc7db_0%,transparent_24%),linear-gradient(160deg,#26063f_0%,#441061_46%,#71173f_100%)] px-4 py-6 text-white">
      <main className="mx-auto flex min-h-[92vh] w-full max-w-md items-center">
        <section className="w-full rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/85">
            Acesso Restrito
          </p>

          <h1 className="mt-2 font-['Baloo_2'] text-4xl leading-tight">
            Painel Admin
          </h1>

          <p className="mt-1.5 text-sm text-fuchsia-100/85">
            Entre com e-mail e senha para gerenciar clientes, compras e
            recompensas.
          </p>

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                E-mail
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  if (error) setError("")
                }}
                placeholder="admin@ararasacai.com"
                className="w-full rounded-2xl border border-white/20 bg-white/95 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-fuchsia-500 focus:shadow-[0_0_0_4px_rgba(217,70,239,0.2)]"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                Senha
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  if (error) setError("")
                }}
                placeholder="Digite sua senha"
                className="w-full rounded-2xl border border-white/20 bg-white/95 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-fuchsia-500 focus:shadow-[0_0_0_4px_rgba(217,70,239,0.2)]"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-500 to-amber-400 px-6 py-3 font-black text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>

          {error ? (
            <p className="mt-3 rounded-xl border border-rose-200/50 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-100">
              {error}
            </p>
          ) : null}

          <p className="mt-5 text-xs text-white/60">
            Acesso autorizado apenas para administradores cadastrados no
            Supabase.
          </p>
        </section>
      </main>
    </div>
  )
}

export default AdminLogin