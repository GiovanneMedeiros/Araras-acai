import { Navigate, Route, Routes } from "react-router-dom"
import ProtectedAdminRoute from "./components/auth/ProtectedAdminRoute.jsx"
import ProtectedClientRoute from "./components/auth/ProtectedClientRoute.jsx"
import Footer from "./components/Footer.jsx"
import AdminPortal from "./pages/AdminPortal.jsx"
import AdminLogin from "./pages/AdminLogin.jsx"
import AdminRewardSizes from "./pages/AdminRewardSizes.jsx"
import ClientPortal from "./pages/ClientPortal.jsx"
import ClientLogin from "./pages/ClientLogin.jsx"
import PrivacyPolicy from "./pages/PrivacyPolicy.jsx"
import UpdatePassword from "./pages/UpdatePassword.jsx"

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
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
          <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
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
      </main>

      <Footer />
    </div>
  )
}

export default App
