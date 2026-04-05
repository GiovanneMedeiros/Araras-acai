import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase.js"

const ClientAuthContext = createContext(null)

export function ClientAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  async function linkProfileToAuthUser(authUser) {
    if (!supabase || !authUser?.id) return

    const email = String(authUser.email || "").trim().toLowerCase()
    if (!email) return

    const { error } = await supabase
      .from("profiles")
      .update({ auth_user_id: authUser.id })
      .eq("email", email)
      .is("auth_user_id", null)

    if (error) {
      console.error("[useClientAuth] Falha ao vincular profile com auth_user_id:", error)
    }
  }

  async function refreshUser() {
    if (!supabase) {
      setUser(null)
      setLoading(false)
      return
    }

    const {
      data: { user: currentUser },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      setUser(null)
      setLoading(false)
      return
    }

    setUser(currentUser ?? null)
    setLoading(false)
  }

  async function signOutClient() {
    if (!supabase) {
      console.error("[useClientAuth] Supabase nao configurado para signOut")
      setUser(null)
      setLoading(false)
      return
    }

    try {
      // Tenta logout global primeiro
      const { error: globalError } = await supabase.auth.signOut({ scope: "global" })

      if (globalError) {
        console.warn("[useClientAuth] Logout global falhou, tentando logout local", globalError)
        const { error: localError } = await supabase.auth.signOut()
        if (localError) {
          console.error("[useClientAuth] Logout local tambem falhou:", localError)
          throw localError
        }
      }
    } catch (error) {
      console.error("[useClientAuth] Erro ao fazer logout:", error)
      throw error
    } finally {
      // Sempre limpa o estado local após tentar logout
      setUser(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    async function bootstrap() {
      if (!supabase) {
        if (!mounted) return
        setUser(null)
        setLoading(false)
        return
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!mounted) return
      setUser(currentUser ?? null)
      setLoading(false)
    }

    bootstrap().catch(() => {
      if (!mounted) return
      setUser(null)
      setLoading(false)
    })

    if (!supabase) {
      return () => {
        mounted = false
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        // Evita deadlock do Supabase Auth: nao usar await dentro do callback.
        void linkProfileToAuthUser(session.user)
      }
    })

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      refreshUser,
      signOutClient,
    }),
    [user, loading]
  )

  return <ClientAuthContext.Provider value={value}>{children}</ClientAuthContext.Provider>
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext)

  if (!context) {
    throw new Error("useClientAuth deve ser usado dentro de ClientAuthProvider.")
  }

  return context
}
