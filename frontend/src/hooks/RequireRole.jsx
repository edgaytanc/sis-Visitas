import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

// roles: array, e.g. ['admin'] o ['supervisor', 'admin']
export default function RequireRole({ roles = [], children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasAnyRole = useAuthStore((s) => s.hasAnyRole)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!hasAnyRole(roles)) {
    // Redirige si no tiene rol necesario (podrías mandar a 403 o dashboard)
    return <Navigate to="/dashboard" replace />
  }
  return children
}
