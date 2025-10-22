import React from 'react'
import {
  Paper, Box, Stack, Typography, TextField, Button, Alert, Divider, Chip
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import SearchIcon from '@mui/icons-material/Search'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { checkoutByBadge } from '../api/visits'
import RequireRole from '../hooks/RequireRole'

const schema = z.object({
  badge_code: z.string().trim().min(3, 'Ingresa el código del gafete'),
})

function flattenError(err) {
  const data = err?.response?.data
  if (!data) return 'Error desconocido'
  if (typeof data === 'string') return data
  const out = []
  const walk = (obj, path = []) => {
    if (Array.isArray(obj)) { out.push(`${path.join('.')}: ${obj.join(' ')}`); return }
    if (obj && typeof obj === 'object') { Object.entries(obj).forEach(([k, v]) => walk(v, [...path, k])); return }
    if (obj) out.push(`${path.join('.')}: ${String(obj)}`)
  }
  walk(data)
  return out.join(' | ') || 'Solicitud inválida'
}

export default function Checkout() {
  return (
    <RequireRole roles={['recepcion','supervisor','admin']}>
      <Box>
        <CheckoutForm />
      </Box>
    </RequireRole>
  )
}

function CheckoutForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { badge_code: '' }
  })

  const [okMsg, setOkMsg] = React.useState('')
  const [errMsg, setErrMsg] = React.useState('')
  const [visit, setVisit] = React.useState(null)

  const onSubmit = async (form) => {
    setOkMsg(''); setErrMsg(''); setVisit(null)
    try {
      const code = (form.badge_code || '').trim()
      const data = await checkoutByBadge(code)
      setVisit(data)
      const when = data?.checkout_at?.replace('T',' ').slice(0,16) || 'ahora'
      setOkMsg(`Salida registrada (${when}).`)
      setValue('badge_code', '')
    } catch (e) {
      const msg = flattenError(e)
      // UX: si ya tenía salida, el backend manda "La visita ya tiene checkout registrado."
      setErrMsg(msg)
    }
  }

  // Enter para enviar
  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Control de salida (Check-out)</Typography>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          startIcon={<LogoutIcon />}
          disabled={isSubmitting}
        >
          Registrar salida
        </Button>
      </Stack>

      {(okMsg || errMsg) && (
        <Alert severity={okMsg ? 'success' : 'error'} sx={{ mb: 2 }}>
          {okMsg || errMsg}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label="Código de gafete (ej. VIS-2025-000123)"
          {...register('badge_code')}
          onKeyDown={onKeyDown}
          error={!!errors.badge_code}
          helperText={errors.badge_code?.message || 'Escanéalo o escríbelo y presiona Enter.'}
          autoFocus
          fullWidth
        />

        {visit && (
          <>
            <Divider />
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip label={`Gafete: ${visit.badge_code}`} />
              {visit.case?.code_persistente && <Chip label={`Expediente: ${visit.case.code_persistente}`} />}
              {visit.case?.citizen?.name && <Chip label={`Ciudadano: ${visit.case.citizen.name}`} />}
              {visit.checkout_at && <Chip color="success" label={`Checkout: ${visit.checkout_at.replace('T',' ').slice(0,16)}`} />}
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  )
}
