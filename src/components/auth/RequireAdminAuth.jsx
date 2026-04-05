import { Navigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth.jsx"

function RequireAdminAuth({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(145deg,#25053f_0%,#40115f_52%,#5f1a7a_100%)] text-white">
        <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm font-semibold backdrop-blur-xl">
          Validando sessao administrativa...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}

export default RequireAdminAuth
