import React, { useEffect } from 'react'
import { useAuthStore } from '../store/auth'
import { Navigate } from 'react-router-dom'

export default function Logout() {
  const logout = useAuthStore((s) => s.logout)
  useEffect(() => {
    logout()
  }, [logout])
  return <Navigate to="/login" replace />
}
