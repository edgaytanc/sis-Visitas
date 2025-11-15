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
  Container,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  // --- NUEVO --- (Imports para el Dialog)
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
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
import PeopleIcon from '@mui/icons-material/People'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

import { useAuthStore } from '../store/auth'

// ----------------------- Menú (sin cambios) -----------------------
const MENU_ITEMS = [
  // ... (Tu lista de menú sigue igual)
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
    roles: ['admin', 'supervisor', 'recepcion']
  },
  {
    key: 'temas',
    label: 'Temas',
    icon: <LabelIcon />,
    path: '/catalogos/temas',
    roles: ['admin']
  },
  {
    key: 'admin-users',
    label: 'Usuarios',
    icon: <ManageAccountsIcon />,
    path: '/admin/usuarios',
    roles: ['admin']
  },
  {
    key: 'check-in',
    label: 'Registro de Visita',
    icon: <HowToRegIcon />,
    path: '/visitas/check-in',
    roles: ['admin', 'supervisor', 'recepcion']
  },
  {
    key: 'visit-activos',
    label: 'Visitantes activos',
    icon: <PeopleIcon />,
    path: '/visitas/activos',
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
// ----------------------- Fin Menú -----------------------

const DRAWER_WIDTH = 280

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = React.useState(false)
  // --- NUEVO --- (Estado para el modal de confirmación)
  const [confirmLogout, setConfirmLogout] = React.useState(false)

  const theme = useTheme()
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  const user = useAuthStore((state) => state.user)

  const toggleDrawer = () => setOpen((p) => !p)

  const go = (path) => {
    navigate(path)
    if (!isMdUp) {
      setOpen(false)
    }
  }

  // --- NUEVO --- (Función para manejar el logout)
  const handleLogout = () => {
    setConfirmLogout(false) // Cierra el modal
    navigate('/logout') // Redirige a la ruta de logout
  }

  const userRoles = user?.roles || []
  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    if (!userRoles.length) return false
    return item.roles.some((r) => userRoles.includes(r))
  })

  // --- Contenido del Menú Lateral (Drawer) ---
  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2.5,
          justifyContent: 'flex-start'
        }}
      >
        <Avatar sx={{ bgcolor: '#3F51B5' }}>SV</Avatar>
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
          Panel Principal
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
      <List sx={{ p: 2 }}>
        {visibleMenuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <ListItemButton
              key={item.key}
              onClick={() => go(item.path)}
              selected={isActive}
              sx={{
                mb: 1,
                borderRadius: '8px',
                '& .MuiListItemIcon-root': {
                  color: '#FFFFFF',
                  minWidth: '40px'
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 500
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)'
                  }
                }
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          )
        })}
      </List>
    </Box>
  )
  // --- Fin Contenido del Menú Lateral ---

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* --- AppBar (Barra Superior) --- */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: '#FFFFFF',
          color: 'text.primary',
          borderBottom: '1px solid #E0E0E0',
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` }
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {visibleMenuItems.find((item) => item.path === location.pathname)
              ?.label || 'SisVisitas'}
          </Typography>

          {/* --- MODIFICADO --- (onClick ahora abre el modal) */}
          <IconButton onClick={() => setConfirmLogout(true)} title="Salir">
            <LogoutIcon sx={{ color: 'error.main' }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* --- Drawer (Menú Lateral) --- */}
      <Drawer
        variant={isMdUp ? 'permanent' : 'temporary'}
        open={isMdUp ? true : open}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            backgroundColor: '#1E2A45',
            color: '#FFFFFF',
            borderRight: 'none'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* --- Contenido Principal --- */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: '#F4F6F8',
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>

      {/* --- NUEVO --- (Modal de confirmación de salida) */}
      <Dialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirmar salida
        </DialogTitle>
        <DialogContent>
          ¿Desea salir del sistema?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLogout(false)}>No</Button>
          <Button onClick={handleLogout} color="error" variant="contained" autoFocus>
            Sí
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}