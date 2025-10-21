import React from 'react'
import {
  Box, Paper, Typography, TextField, Button, Stack, Link, Alert
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../store/auth'
import { useLocation, useNavigate } from 'react-router-dom'

const schema = z.object({
  username: z.string().min(3, 'Ingresa tu usuario'),
  password: z.string().min(4, 'Mínimo 4 caracteres')
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)
  const [errorMsg, setErrorMsg] = React.useState('')

  const {
    register, handleSubmit, formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' }
  })

  const onSubmit = async (data) => {
    setErrorMsg('')
    try {
      await login({ username: data.username, password: data.password })
      const redirectTo = location.state?.from?.pathname || '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || 'No fue posible iniciar sesión.')
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #e0f2f1 100%)',
      p: 2
    }}>
      <Paper elevation={0} sx={{ p: 4, width: '100%', maxWidth: 420, border: '1px solid #e6eaf0' }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700} textAlign="center" color="primary.main">
            SisVisitas
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            Inicia sesión para continuar
          </Typography>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Usuario"
                autoComplete="username"
                {...register('username')}
                error={!!errors.username}
                helperText={errors.username?.message}
                fullWidth
              />
              <TextField
                label="Contraseña"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                fullWidth
              />
              <Button variant="contained" type="submit" disabled={isSubmitting} size="large">
                Entrar
              </Button>
            </Stack>
          </form>

          <Typography variant="caption" textAlign="center" color="text.secondary">
            ¿Olvidaste tu contraseña? <Link href="#" underline="hover">Recupérala</Link>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  )
}
