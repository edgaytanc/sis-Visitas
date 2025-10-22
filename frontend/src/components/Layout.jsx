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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import { Outlet, useNavigate } from 'react-router-dom'
import HowToRegIcon from '@mui/icons-material/HowToReg'

import LabelIcon from '@mui/icons-material/Label'
import ManageSearchIcon from '@mui/icons-material/ManageSearch'
// import { useAuthStore } from '../store/auth' // si necesitas roles dinámicos

export default function Layout() {
  const navigate = useNavigate()
  const [open, setOpen] = React.useState(false)

  const toggleDrawer = () => setOpen((p) => !p)

  const go = (path) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar color="inherit" position="fixed">
        <Toolbar>
          <IconButton edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            SisVisitas
          </Typography>
          <IconButton onClick={() => go('/logout')} title="Salir">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        open={open}
        onClose={toggleDrawer}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: 260 } }}
      >
        <Toolbar />
        <List>
          <ListItemButton onClick={() => go('/dashboard')}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>

          {/* Ejemplos de secciones por rol */}
          <ListItemButton onClick={() => go('/recepcion')}>
            <ListItemIcon><AssignmentIndIcon /></ListItemIcon>
            <ListItemText primary="Recepción" />
          </ListItemButton>

          <ListItemButton onClick={() => go('/supervision')}>
            <ListItemIcon><SupervisorAccountIcon /></ListItemIcon>
            <ListItemText primary="Supervisión" />
          </ListItemButton>

          <ListItemButton onClick={() => go('/admin')}>
            <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
            <ListItemText primary="Administración" />
          </ListItemButton>

          <ListItemButton onClick={() => go('/catalogos/temas')}>
            <ListItemIcon><LabelIcon /></ListItemIcon>
            <ListItemText primary="Temas" />
          </ListItemButton>

          <ListItemButton onClick={() => go('/visitas/check-in')}>
            <ListItemIcon><HowToRegIcon /></ListItemIcon>
            <ListItemText primary="Registro de Visita" />
          </ListItemButton>

          <ListItemButton onClick={() => go('/visitas/check-out')}>
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText primary="Control de salida" />
          </ListItemButton>

          <ListItemButton onClick={() => go('/busqueda')}>
            <ListItemIcon><ManageSearchIcon /></ListItemIcon>
            <ListItemText primary="Búsqueda rápida" />
          </ListItemButton>

        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, pt: 10, pb: 4 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
    </Box>
  )
}
