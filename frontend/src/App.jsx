import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminPanel from './pages/AdminPanel'
import VerifyEmail from './pages/VerifyEmail'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { ThemeProvider } from './context/ThemeContext'
import { initializePushNotifications } from './utils/pushNotifications'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--terminal-green)',
        fontFamily: "'JetBrains Mono', monospace"
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'pulse 1.5s ease-in-out infinite' }}>
          ⚡
        </div>
        <div style={{ fontSize: '14px', letterSpacing: '2px' }}>
          <span className="terminal-prompt">&gt;</span> AUTHENTICATING...
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(0.95); }
            50% { opacity: 1; transform: scale(1.05); }
          }
        `}</style>
      </div>
    )
  }

  return user ? children : <Navigate to="/login" />
}

// PWA Action Handler - Gère les raccourcis PWA
function PWAActionHandler() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    const action = searchParams.get('action')

    if (action === 'add' && user) {
      // Redirige vers le dashboard avec un état pour ouvrir le modal
      navigate('/dashboard', {
        state: { openAddModal: true },
        replace: true
      })
    }
  }, [searchParams, navigate, user])

  return null
}

// Redirect to dashboard while preserving query params
function RootRedirect() {
  const [searchParams] = useSearchParams()
  const search = searchParams.toString()
  const destination = search ? `/dashboard?${search}` : '/dashboard'

  return <Navigate to={destination} replace />
}

function App() {
  useEffect(() => {
    // Initialize push notifications on app load
    initializePushNotifications();
  }, []);

  return (
    <ThemeProvider>
      <CurrencyProvider>
        <AuthProvider>
          <Router>
            <PWAActionHandler />
            <div className="app">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <PrivateRoute>
                      <AdminPanel />
                    </PrivateRoute>
                  }
                />
                <Route path="/" element={<RootRedirect />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </CurrencyProvider>
    </ThemeProvider>
  )
}

export default App