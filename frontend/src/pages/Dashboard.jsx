import React from 'react'
import { Paper, Typography, Box } from '@mui/material'

export default function Dashboard() {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Dashboard</Typography>
      <Box>
        Bienvenido. Aquí irán métricas y accesos rápidos (próximos bloques FE).
      </Box>
    </Paper>
  )
}
