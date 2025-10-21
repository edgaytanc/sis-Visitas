import React from 'react'
import {
  Box, Paper, Typography, TextField, Button, Stack, Link
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuthStore } from '../store/auth'
import { useNavigate } from 'react-router-dom'

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(4, 'Mínimo 4 caracteres')
})

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const {
    register, handleSubmit, formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const onSubmit = async (data) => {
    await login({ email: data.email })
    navigate('/dashboard')
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

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Correo"
                type="email"
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
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

              <Button
                variant="contained"
                type="submit"
                disabled={isSubmitting}
                size="large"
              >
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
