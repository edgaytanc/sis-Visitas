import React from 'react'
import {
  Box, Paper, Typography, TextField, Button, Stack, Alert, InputAdornment, IconButton
} from '@mui/material'
import { Visibility, VisibilityOff, Person, Lock } from '@mui/icons-material'
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
  const [showPassword, setShowPassword] = React.useState(false)

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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #b3e5fc 0%, #e3f2fd 50%, #e8f5e9 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 5,
          width: '100%',
          maxWidth: 420,
          borderRadius: 5,
          background: '#ffffffdd',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)'
        }}
      >
        <Stack spacing={3}>
          <Box textAlign="center">
            <Typography variant="h4" fontWeight={800} color="#1565C0">
              SisVisitas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inicia sesión para continuar
            </Typography>
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {errorMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2}>
              <TextField
                label="Usuario"
                autoComplete="username"
                {...register('username')}
                error={!!errors.username}
                helperText={errors.username?.message}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: '#1565C0' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: '#1565C0' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((p) => !p)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="contained"
                type="submit"
                disabled={isSubmitting}
                size="large"
                sx={{
                  py: 1.3,
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: 3,
                  background: 'linear-gradient(90deg, #1565C0 0%, #42A5F5 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #0D47A1 0%, #2196F3 100%)',
                  },
                  boxShadow: '0 4px 14px rgba(21,101,192,0.3)'
                }}
              >
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Box>
  )
}
