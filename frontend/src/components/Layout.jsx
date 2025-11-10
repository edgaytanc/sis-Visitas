import React from 'react'
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Container
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import LogoutIcon from '@mui/icons-material/Logout'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import LabelIcon from '@mui/icons-material/Label'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
import ListAltIcon from '@mui/icons-material/ListAlt'
import { Outlet, useNavigate } from 'react-router-dom'

import { useAuthStore } from '../store/auth'

// ----------------------- Menú con roles -----------------------
const MENU_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: ['admin', 'supervisor', 'recepcion'] // todos
  },
  {
    key: 'temas',
    label: 'Temas',
    icon: <LabelIcon />,
    path: '/catalogos/temas',
    roles: ['admin'] // solo admin
  },
  {
    key: 'admin-users',
    label: 'Usuarios',
    icon: <ManageAccountsIcon />, // (Importar ManageAccountsIcon de @mui/icons-material)
    path: '/admin/usuarios',
    roles: ['admin'] // Clave para que solo lo vean admins
  },
  {
    key: 'check-in',
    label: 'Registro de Visita',
    icon: <HowToRegIcon />,
    path: '/visitas/check-in',
    roles: ['admin', 'supervisor', 'recepcion']
  },
  {
    key: 'check-out',
    label: 'Control de salida',
    icon: <LogoutIcon />,
    path: '/visitas/check-out',
    roles: ['admin', 'supervisor', 'recepcion']
  },
  {
    key: 'busqueda',
    label: 'Búsqueda rápida',
    icon: <ManageSearchIcon />,
    path: '/busqueda',
    roles: ['admin', 'supervisor', 'recepcion']
  },
  {
    key: 'reporte-visitas',
    label: 'Reporte de visitas',
    icon: <PictureAsPdfIcon />,
    path: '/reportes/visitas',
    roles: ['admin', 'supervisor']
  },
  {
    key: 'bitacora',
    label: 'Bitácora',
    icon: <ListAltIcon />,
    path: '/bitacora',
    roles: ['admin', 'supervisor']
  }
]

export default function Layout() {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)

  // Solo leemos el usuario del store
  const user = useAuthStore((state) => state.user)

  const toggleDrawer = () => setOpen((p) => !p)

  const go = (path) => {
    navigate(path)
    setOpen(false)
  }

  // 👇 Aquí usamos directamente user.roles para filtrar el menú
  const userRoles = user?.roles || []

  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    // Si el item no define roles, se muestra siempre
    if (!item.roles || item.roles.length === 0) return true
    // Si el usuario no tiene roles aún, no mostramos items restringidos
    if (!userRoles.length) return false
    // Mostrar si alguno de los roles requeridos está en los roles del usuario
    return item.roles.some((r) => userRoles.includes(r))
  })

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar color='inherit' position='fixed'>
        <Toolbar>
          <IconButton edge='start' onClick={toggleDrawer} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant='h6' sx={{ flexGrow: 1 }}>
            SisVisitas
          </Typography>
          <IconButton onClick={() => go('/logout')} title='Salir'>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        open={open}
        onClose={toggleDrawer}
        variant='temporary'
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: 260 } }}
      >
        <Toolbar />
        <List>
          {visibleMenuItems.map((item) => (
            <ListItemButton key={item.key} onClick={() => go(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component='main' sx={{ flexGrow: 1, pt: 10, pb: 4 }}>
        <Container maxWidth='lg'>
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
