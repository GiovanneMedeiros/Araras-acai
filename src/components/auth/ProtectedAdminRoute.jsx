import { Navigate } from "react-router-dom"
import { useAuth } from "../../hooks/useAuth.jsx"

function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#F6F3EF] text-[#2B2B2B]">
        <div className="rounded-2xl border border-[#D8D0E8] bg-white px-5 py-4 text-sm font-semibold shadow-sm">
          Validando sessao administrativa...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  return children
}

export default ProtectedAdminRoute