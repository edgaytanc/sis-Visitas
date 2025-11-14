import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import theme from './theme'
import App from './App'
import Login from './pages/Login'
import Logout from './pages/Logout'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './hooks/ProtectedRoute'
import RequireRole from './hooks/RequireRole'
import Temas from './pages/Temas'
import Checkin from './pages/Checkin'
import Checkout from './pages/Checkout'
import SearchQuick from './pages/SearchQuick'
import ReportVisits from './pages/ReportVisits'
import AuditLog from './pages/AuditLog'
import AdminUsers from './pages/AdminUsers.jsx'
import Activos from './pages/Activos'

// Páginas “dummy” por rol:
const Recepcion = () => <div>Panel Recepción (solo rol: recepcion)</div>
const Supervision = () => <div>Panel Supervisión (solo rol: supervisor)</div>
const Admin = () => <div>Panel Administración (solo rol: admin)</div>

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Públicas
      { path: '/login', element: <Login /> },
      { path: '/logout', element: <Logout /> },
      { index: true, element: <Login /> },

      // Privadas (requieren login):
      {
        path: '/dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: '/recepcion',
        element: (
          <RequireRole roles={['recepcion']}>
            <Recepcion />
          </RequireRole>
        )
      },
      {
        path: '/supervision',
        element: (
          <RequireRole roles={['supervisor']}>
            <Supervision />
          </RequireRole>
        )
      },
      {
        path: '/panel-admin',
        element: (
          <RequireRole roles={['admin']}>
            <Admin />
          </RequireRole>
        )
      },
      {
        path: '/catalogos/temas',
        element: (
          <RequireRole roles={['supervisor', 'admin']}>
            <Temas />
          </RequireRole>
        )
      },

      {
        path: '/visitas/check-in',
        element: (<RequireRole roles={['recepcion', 'supervisor', 'admin']}>
          <Checkin />
        </RequireRole>
        )
      },

      {
        path: '/visitas/check-out',
        element: (<RequireRole roles={['recepcion', 'supervisor', 'admin']}>
          <Checkout />
        </RequireRole>
        )
      },

      {
        path: '/busqueda', element: (
          <RequireRole roles={['recepcion', 'supervisor', 'admin']}>
            <SearchQuick />
          </RequireRole>
        )
      },

      {
        path: '/reportes/visitas', element: (
          <RequireRole roles={['supervisor', 'admin']}>
            <ReportVisits />
          </RequireRole>
        )
      },

      {
        path: '/bitacora', element: (
          <RequireRole roles={['supervisor', 'admin']}>
            <AuditLog />
          </RequireRole>
        )
      },

      {
        path: '/admin/usuarios',
        element: (
          <RequireRole roles={['admin']}>
            <AdminUsers />
          </RequireRole>
        )
      },
      {
        path: '/visitas/activos',
        element: (
          <RequireRole roles={['recepcion', 'supervisor', 'admin']}>
            <Activos />
          </RequireRole>
        )
      },
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
)
