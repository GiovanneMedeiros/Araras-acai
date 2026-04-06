import { Navigate, useLocation } from "react-router-dom"
import { useClientAuth } from "../../hooks/useClientAuth.jsx"

function ProtectedClientRoute({ children }) {
  const { isAuthenticated, loading } = useClientAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F6F3EF] text-[#2B2B2B]">
        <div className="rounded-2xl border border-[#D8D0E8] bg-white px-5 py-4 text-sm font-semibold shadow-sm">
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
