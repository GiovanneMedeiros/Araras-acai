import { Navigate, Route, Routes } from "react-router-dom"
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute.jsx"
import ProtectedClientRoute from "./components/auth/ProtectedClientRoute.jsx"
import AdminPortal from "./pages/AdminPortal.jsx"
import AdminLogin from "./pages/AdminLogin.jsx"
import AdminRewardSizes from "./pages/AdminRewardSizes.jsx"
import ClientPortal from "./pages/ClientPortal.jsx"
import ClientLogin from "./pages/ClientLogin.jsx"
import UpdatePassword from "./pages/UpdatePassword.jsx"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedAdminRoute>
            <AdminPortal />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/tamanhos"
        element={
          <ProtectedAdminRoute>
            <AdminRewardSizes />
          </ProtectedAdminRoute>
        }
      />
      <Route path="/login" element={<ClientLogin />} />
      <Route
        path="/cliente"
        element={
          <ProtectedClientRoute>
            <ClientPortal />
          </ProtectedClientRoute>
        }
      />
      <Route path="/update-password" element={<UpdatePassword />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
