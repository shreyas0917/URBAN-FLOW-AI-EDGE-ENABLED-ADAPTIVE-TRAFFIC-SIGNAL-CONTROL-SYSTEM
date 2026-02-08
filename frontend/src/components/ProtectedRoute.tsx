import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, token } = useAuthStore()

  if (!isAuthenticated || !user || !token) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole) {
    const userRole = user.role?.toLowerCase().replace('-', '_') || ''
    const requiredRoleLower = requiredRole.toLowerCase().replace('-', '_')
    
    // Handle role variations
    const roleMapping: Record<string, string[]> = {
      'super_admin': ['super_admin', 'superadmin', 'admin'],
      'operator': ['operator'],
      'viewer': ['viewer'],
    }
    
    const allowedRoles = roleMapping[requiredRoleLower] || [requiredRoleLower]
    const hasAccess = allowedRoles.includes(userRole) || userRole === requiredRoleLower
    
    if (!hasAccess) {
      console.warn(`Access denied: User role '${userRole}' does not match required role '${requiredRoleLower}'`)
      return <Navigate to="/login" replace />
    }
  }

  return <>{children}</>
}


