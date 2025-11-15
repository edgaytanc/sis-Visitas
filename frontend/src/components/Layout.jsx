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
  Avatar, // Para el logo 'SV'
  Divider, // Para separar el header del menú
  useTheme, // Para usar los breakpoints
  useMediaQuery // Para detectar el tamaño de pantalla
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
import { Outlet, useNavigate, useLocation } from 'react-router-dom' // Importar useLocation

import { useAuthStore } from '../store/auth'

// ----------------------- Menú (sin cambios) -----------------------
const MENU_ITEMS = [
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

// Ancho del menú lateral
const DRAWER_WIDTH = 280

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation() // Hook para saber la ruta activa
  const [open, setOpen] = React.useState(false) // Estado del drawer en móvil

  const theme = useTheme()
  // `isMdUp` será `true` en pantallas medianas o más grandes (desktop)
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'))

  const user = useAuthStore((state) => state.user)

  const toggleDrawer = () => setOpen((p) => !p)

  const go = (path) => {
    navigate(path)
    if (!isMdUp) {
      // Si estamos en móvil, cerramos el drawer al navegar
      setOpen(false)
    }
  }

  const userRoles = user?.roles || []

  // Lógica de filtrado (sin cambios)
  const visibleMenuItems = MENU_ITEMS.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    if (!userRoles.length) return false
    return item.roles.some((r) => userRoles.includes(r))
  })

  // --- Contenido del Menú Lateral (Drawer) ---
  const drawerContent = (
    <Box sx={{ overflow: 'auto' }}>
      {/* Header del Drawer (Logo 'SV' y Título) */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2.5, // Más padding
          justifyContent: 'flex-start'
        }}
      >
        <Avatar sx={{ bgcolor: '#3F51B5' /* Un azul más claro para el logo */ }}>
          SV
        </Avatar>
        <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
          Panel Principal
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

      {/* Lista de Items del Menú */}
      <List sx={{ p: 2 }}>
        {visibleMenuItems.map((item) => {
          // Comprobamos si el item está activo
          const isActive = location.pathname === item.path

          return (
            <ListItemButton
              key={item.key}
              onClick={() => go(item.path)}
              selected={isActive} // Prop para marcar como seleccionado
              sx={{
                mb: 1, // Margen inferior para separar items
                borderRadius: '8px', // Bordes redondeados
                '& .MuiListItemIcon-root': {
                  color: '#FFFFFF', // Iconos blancos
                  minWidth: '40px'
                },
                '& .MuiListItemText-primary': {
                  fontWeight: 500
                },
                // Estilos al pasar el mouse
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                },
                // Estilos cuando está seleccionado (activo)
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
        elevation={0} // Sin sombra, para un look más plano
        sx={{
          // Fondo blanco y borde sutil
          backgroundColor: '#FFFFFF',
          color: 'text.primary',
          borderBottom: '1px solid #E0E0E0',
          // En desktop, ajustamos el ancho y la posición
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` }
        }}
      >
        <Toolbar>
          {/* Botón de Menú (Solo visible en móvil) */}
          <IconButton
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2, display: { md: 'none' } }} // Oculto en desktop
          >
            <MenuIcon />
          </IconButton>

          {/* Título (puedes cambiarlo si quieres) */}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {/* Buscamos el label de la ruta activa para ponerlo de título */}
            {visibleMenuItems.find((item) => item.path === location.pathname)
              ?.label || 'SisVisitas'}
          </Typography>

          {/* Botón de Salir (Rojo como en la imagen) */}
          <IconButton onClick={() => go('/logout')} title="Salir">
            <LogoutIcon sx={{ color: 'error.main' }} />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* --- Drawer (Menú Lateral) --- */}
      <Drawer
        variant={isMdUp ? 'permanent' : 'temporary'} // Responsivo
        open={isMdUp ? true : open} // Control de estado
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            // Color de fondo azul oscuro, como en la imagen
            backgroundColor: '#1E2A45',
            color: '#FFFFFF', // Texto e iconos blancos
            borderRight: 'none' // Quitamos el borde
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
          // Fondo gris claro, como en la imagen
          backgroundColor: '#F4F6F8',
          p: 3, // Padding general
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }
        }}
      >
        {/* Este Toolbar actúa como un espaciador para el AppBar fijo */}
        <Toolbar />
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}