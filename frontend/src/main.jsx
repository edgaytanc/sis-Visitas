import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import theme from './theme'
import App from './App'
import Login from './pages/login'
import Logout from './pages/Logout'
import Dashboard from './pages/Dashboard'
import ProtectedRoute from './hooks/ProtectedRoute'
import RequireRole from './hooks/RequireRole'

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
        path: '/admin',
        element: (
          <RequireRole roles={['admin']}>
            <Admin />
          </RequireRole>
        )
      }
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
