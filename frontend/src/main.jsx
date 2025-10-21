import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import theme from './theme'
import App from './App'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UseAuthGuard from './hooks/useAuthGuard'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      // Rutas públicas
      { path: '/login', element: <Login /> },
      // Rutas protegidas (dummy guard de estado local)
      { path: '/dashboard', element: <UseAuthGuard><Dashboard /></UseAuthGuard> },
      { index: true, element: <Login /> } // por defecto / -> /login
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
