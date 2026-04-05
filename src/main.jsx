import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { ClientAuthProvider } from './hooks/useClientAuth.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ClientAuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClientAuthProvider>
    </AuthProvider>
  </StrictMode>,
)
