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
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

const drawerWidth = 260

export default function Layout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
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
          <IconButton onClick={() => { logout(); navigate('/login') }} title="Salir">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        open={open}
        onClose={toggleDrawer}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: drawerWidth } }}
      >
        <Toolbar />
        <List>
          <ListItemButton onClick={() => go('/dashboard')}>
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
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
