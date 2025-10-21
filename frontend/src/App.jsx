import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Layout from './components/Layout'

export default function App() {
  const location = useLocation()
  // Rutas con layout (todas menos /login y /logout)
  const noLayout = location.pathname.startsWith('/login') || location.pathname.startsWith('/logout')
  return noLayout ? <Outlet /> : <Layout />
}
