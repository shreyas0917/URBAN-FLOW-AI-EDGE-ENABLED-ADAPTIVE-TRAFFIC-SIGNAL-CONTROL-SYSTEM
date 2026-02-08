import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { wsService } from './lib/websocket'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import OperatorDashboard from './pages/OperatorDashboard'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import ViewerDashboard from './pages/ViewerDashboard'

function App() {
  const { user, token, isAuthenticated, setAuth } = useAuthStore()

  useEffect(() => {
    // Ensure isAuthenticated is set correctly
    if (user && token && !isAuthenticated) {
      setAuth(user, token)
    }

    // Connect WebSocket if authenticated
    if (token && isAuthenticated) {
      wsService.connect(token)
      return () => {
        wsService.disconnect()
      }
    }
  }, [user, token, isAuthenticated, setAuth])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/operator"
            element={
              <ProtectedRoute requiredRole="operator">
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="super_admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/viewer"
            element={
              <ProtectedRoute requiredRole="viewer">
                <ViewerDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App


