import { createContext, useContext, useEffect, useMemo, useState } from "react"
import {
  getCurrentAuthState,
  onAdminAuthStateChange,
  signInAdmin,
  signOutAdmin,
} from "../services/authService.js"
import { isSupabaseConfigured } from "../lib/supabase.js"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  async function reloadAuth() {
    try {
      const auth = await getCurrentAuthState()
      setSession(auth.session)
      setUser(auth.user)
      setIsAdmin(auth.isAdmin)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    let mounted = true

    async function bootstrap() {
      try {
        const auth = await getCurrentAuthState()
        if (!mounted) return

        setSession(auth.session)
        setUser(auth.user)
        setIsAdmin(auth.isAdmin)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    bootstrap().catch(() => {
      if (!mounted) return
      setSession(null)
      setUser(null)
      setIsAdmin(false)
      setLoading(false)
    })

    const unsubscribe = onAdminAuthStateChange(() => {
      if (!mounted) return

      // Evita deadlock do Supabase Auth: nao usar await dentro do callback.
      void reloadAuth().catch(() => {
        if (!mounted) return
        setSession(null)
        setUser(null)
        setIsAdmin(false)
        setLoading(false)
      })
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    await signInAdmin(email, password)
    await reloadAuth()
  }

  async function signOut() {
    await signOutAdmin()
    await reloadAuth()
  }

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      isAdmin,
      isAuthenticated: Boolean(session && user && isAdmin),
      signIn,
      signOut,
      reloadAuth,
    }),
    [session, user, loading, isAdmin]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.")
  }

  return context
}
