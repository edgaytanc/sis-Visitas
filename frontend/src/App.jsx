import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Layout from './components/Layout'

export default function App() {
  const location = useLocation()
  const isAuthRoute = location.pathname.startsWith('/dashboard')

  // Si estamos en /dashboard*, usamos el layout con AppBar/Drawer.
  // Si estamos en /login, renderizamos sin layout.
  return isAuthRoute ? <Layout /> : <Outlet />
}
