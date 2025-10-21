import React from 'react'
import { Paper, Typography, Box, Chip, Stack } from '@mui/material'
import { useAuthStore } from '../store/auth'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Dashboard</Typography>
      <Box mb={2}>
        {fullName
          ? <>Bienvenido, {fullName}.</>
          : <>Bienvenido{user?.username ? `, ${user.username}` : ''}.</>}
      </Box>
      <Stack direction="row" spacing={1}>
        {(user?.roles || []).map((r) => <Chip key={r} label={r} />)}
      </Stack>
    </Paper>
  )
}
