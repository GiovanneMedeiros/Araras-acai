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
      <div className="min-h-screen bg-[#F6F3EF] px-4 py-6 text-[#2B2B2B]">
        <main className="mx-auto flex min-h-[92vh] w-full max-w-md items-center">
          <section className="w-full rounded-2xl border border-[#E6DFF0] bg-white p-7 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B6B6B]">
              Configuração obrigatória
            </p>

            <h1 className="mt-2 font-['Baloo_2'] text-4xl leading-tight">
              Admin indisponível
            </h1>

            <p className="mt-2 text-sm text-[#6B6B6B]">
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
      <div className="grid min-h-screen place-items-center bg-[#F6F3EF] text-[#2B2B2B]">
        <p className="rounded-2xl border border-[#D8D0E8] bg-white px-4 py-3 text-sm font-semibold shadow-sm">
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
    <div className="min-h-screen bg-[#F6F3EF] px-4 py-6 text-[#2B2B2B]">
      <main className="mx-auto flex min-h-[92vh] w-full max-w-md items-center">
        <section className="w-full rounded-2xl border border-[#E6DFF0] bg-white p-7 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6B6B6B]">
            Acesso Restrito
          </p>

          <h1 className="mt-2 font-['Baloo_2'] text-4xl leading-tight text-[#2B2B2B]">
            Painel Admin
          </h1>

          <p className="mt-2 text-sm text-[#6B6B6B]">
            Entre com e-mail e senha para gerenciar clientes, compras e
            recompensas.
          </p>

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-3">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#6B6B6B]">
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
                className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-[#2B2B2B] outline-none transition placeholder:text-[#9A948D] focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-[#6B6B6B]">
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
                className="w-full rounded-2xl border border-[#E8D8C3] bg-[#F6F3EF] px-4 py-3 text-[#2B2B2B] outline-none transition placeholder:text-[#9A948D] focus:border-[#4B1E6D] focus:shadow-[0_0_0_4px_rgba(75,30,109,0.10)]"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#5B2A86] px-6 py-3 font-black text-white shadow-sm transition hover:bg-[#6D3EA2] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Entrando..." : "Entrar no painel"}
            </button>
          </form>

          {error ? (
            <p className="mt-4 rounded-2xl border border-[#E8D0CC] bg-[#FFF8F6] px-4 py-3 text-sm font-semibold text-[#9A5D52]">
              {error}
            </p>
          ) : null}

          <p className="mt-5 text-xs text-[#6B6B6B]">
            Acesso autorizado apenas para administradores cadastrados no
            Supabase.
          </p>
        </section>
      </main>
    </div>
  )
}

export default AdminLogin