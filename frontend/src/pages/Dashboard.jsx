import React, { useEffect, useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Stack,
  // --- NUEVO ---
  useTheme // Para acceder a la paleta de colores del tema
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/People'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuthStore } from '../store/auth'
import { listActiveVisits, getDashboardStats } from '../api/visits'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()

  const [visitas, setVisitas] = useState([])
  const [stats, setStats] = useState({
    activos: 0,
    entradas_hoy: 0,
    salidas_hoy: 0,
  })

  // --- NUEVO ---
  const theme = useTheme() // Hook para acceder al tema de MUI

  useEffect(() => {
    async function loadData() {
      try {
        const v = await listActiveVisits()
        const s = await getDashboardStats()
        setVisitas(v)
        setStats(s)
      } catch (e) {
        console.error(e)
      }
    }
    loadData()
  }, [])

  const cards = [
    {
      title: 'Visitantes activos',
      value: stats.activos,
      icon: <PeopleIcon />,
      // --- MODIFICADO --- Ajuste de gradientes para usar colores de Material-UI o mantener la vibrancia
      gradient: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    },
    {
      title: 'Visitas registradas hoy',
      value: stats.entradas_hoy,
      icon: <HowToRegIcon />,
      gradient: `linear-gradient(135deg, ${theme.palette.info.main}, ${theme.palette.info.dark})`,
    },
    {
      title: 'Salidas registradas',
      value: stats.salidas_hoy,
      icon: <LogoutIcon />,
      gradient: `linear-gradient(135deg, ${theme.palette.success.main}, ${theme.palette.success.dark})`,
    },
  ]

  return (
    // --- MODIFICADO --- Fondo general del dashboard
    <Box sx={{ p: 0, bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
      {/* === ENCABEZADO === */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 5,
          borderRadius: 4,
          // --- MODIFICADO --- Gradiente y colores en sintonía con el azul del layout
          background: `linear-gradient(90deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          color: theme.palette.primary.contrastText, // Texto blanco sobre el gradiente
          boxShadow: theme.shadows[6], // Sombra más pronunciada
        }}
      >
        {/* --- MODIFICADO --- Color del título */}
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'inherit' }}>
          Dashboard
        </Typography>
        {/* --- MODIFICADO --- Color del subtítulo */}
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
          {fullName
            ? `Bienvenido, ${fullName}.`
            : `Bienvenido${user?.username ? `, ${user.username}` : ''}.`}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          {(user?.roles || []).map((r) => (
            <Chip
              key={r}
              label={r}
              sx={{
                // --- MODIFICADO --- Colores de los chips
                backgroundColor: 'rgba(255,255,255,0.2)', // Fondo semitransparente blanco
                color: 'white', // Texto blanco
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* === TARJETAS DE RESUMEN === */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {cards.map((card, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Paper
              elevation={4}
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderRadius: 4,
                color: 'white',
                background: card.gradient,
                boxShadow: theme.shadows[8], // Sombra más prominente para resaltar las tarjetas
                height: 120,
              }}
            >
              <Box>
                <Typography sx={{ fontSize: '0.95rem', opacity: 0.9 }}>
                  {card.title}
                </Typography>
                <Typography sx={{ fontSize: '2rem', fontWeight: 700 }}>
                  {card.value}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.25)',
                  width: 56,
                  height: 56,
                }}
              >
                {card.icon}
              </Avatar>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* === ACTIVIDAD RECIENTE === */}
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={8}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              borderRadius: 4,
              backgroundColor: '#FFFFFF', // Fondo blanco para la tarjeta de actividad
              boxShadow: theme.shadows[6], // Sombra consistente
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 3,
                // --- MODIFICADO --- Color del título de actividad
                color: theme.palette.primary.dark,
              }}
            >
              Actividad reciente
            </Typography>

            {visitas.length === 0 ? (
              <Typography sx={{ color: theme.palette.text.secondary }}>
                No hay registros recientes.
              </Typography>
            ) : (
              <List dense>
                {visitas.slice(0, 6).map((v) => (
                  <ListItem
                    key={v.id}
                    sx={{
                      // --- MODIFICADO --- Borde inferior más suave
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      py: 1.5,
                      '&:last-child': { borderBottom: 'none' }, // Quitar borde al último item
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          // --- MODIFICADO --- Color del avatar
                          bgcolor: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText
                        }}
                      >
                        <PeopleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography fontWeight={600} color={theme.palette.text.primary}>
                          {v.case?.citizen?.name || '—'}
                        </Typography>
                      }
                      secondary={
                        <Typography
                          component="span"
                          sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem' }}
                        >
                          {v.target_unit || '—'} •{' '}
                          {v.checkin_at
                            ? new Date(v.checkin_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}