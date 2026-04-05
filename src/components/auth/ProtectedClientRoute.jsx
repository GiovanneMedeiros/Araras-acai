import { Navigate, useLocation } from "react-router-dom"
import { useClientAuth } from "../../hooks/useClientAuth.jsx"

function ProtectedClientRoute({ children }) {
  const { isAuthenticated, loading } = useClientAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(145deg,#25053f_0%,#40115f_52%,#5f1a7a_100%)] text-white">
        <div className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm font-semibold backdrop-blur-xl">
          Validando sessão do cliente...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}

export default ProtectedClientRoute
