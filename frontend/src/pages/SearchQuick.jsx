import React from 'react'
import {
  Paper, Box, Stack, Typography, TextField, InputAdornment, IconButton,
  Chip, Button, Alert, Divider, Card, CardContent, CardActions, Grid
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import ReplayIcon from '@mui/icons-material/Replay'
import LaunchIcon from '@mui/icons-material/Launch'
import PersonSearchIcon from '@mui/icons-material/PersonSearch'
import NumbersIcon from '@mui/icons-material/Numbers'
import BadgeIcon from '@mui/icons-material/Badge'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import { useNavigate } from 'react-router-dom'
import { searchVisitContext } from '../api/visits'
import RequireRole from '../hooks/RequireRole'

const MODES = [
  { key: 'dpi', label: 'DPI', icon: <BadgeIcon fontSize="small" /> },
  { key: 'phone', label: 'Teléfono', icon: <PhoneIphoneIcon fontSize="small" /> },
  { key: 'name', label: 'Nombre', icon: <PersonSearchIcon fontSize="small" /> },
  { key: 'code', label: 'Código', icon: <NumbersIcon fontSize="small" /> }, // case_code o topic
]

export default function SearchQuick() {
  return (
    <RequireRole roles={['recepcion','supervisor','admin']}>
      <Box>
        <QuickSearchScreen />
      </Box>
    </RequireRole>
  )
}

function QuickSearchScreen() {
  const [mode, setMode] = React.useState('dpi')
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [data, setData] = React.useState(null)
  const navigate = useNavigate()

  const runSearch = async () => {
    setError(''); setLoading(true); setData(null)
    try {
      const params = { dpi: '', phone: '', name: '', case_code: '', topic: '' }
      if (mode === 'dpi') params.dpi = q.trim()
      if (mode === 'phone') params.phone = q.trim()
      if (mode === 'name') params.name = q.trim()
      if (mode === 'code') {
        // Acepta CASE-..., VIS-..., TRAM-... o id numérico
        // Para reutilizar el backend:
        // - case_code (CASE-XXX) va en case_code
        // - topic acepta id, code o name → lo pasamos en topic si no parece CASE
        if (/^CASE-/i.test(q.trim())) params.case_code = q.trim()
        else params.topic = q.trim()
      }
      const res = await searchVisitContext(params)
      setData(res)
    } catch (e) {
      setError('No fue posible realizar la búsqueda.')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!q.trim()) return
    runSearch()
  }

  const toCheckin = (prefill = {}) => {
    const usp = new URLSearchParams()
    if (prefill.dpi) usp.set('dpi', prefill.dpi)
    if (prefill.phone) usp.set('phone', prefill.phone)
    if (prefill.name) usp.set('name', prefill.name)
    if (prefill.origin) usp.set('origin', prefill.origin)
    if (prefill.topic_id) usp.set('topic', String(prefill.topic_id))
    if (prefill.topic_code) usp.set('topic', prefill.topic_code)
    navigate(`/visitas/check-in?${usp.toString()}`)
  }

  const CitizenCard = ({ citizen }) => (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>{citizen.name}</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {citizen.dpi && <Chip size="small" label={`DPI: ${citizen.dpi}`} />}
          {citizen.phone && <Chip size="small" label={`Tel: ${citizen.phone}`} />}
          {citizen.origin && <Chip size="small" label={`Proc: ${citizen.origin}`} />}
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={<LaunchIcon />}
          onClick={() => toCheckin({
            dpi: citizen.dpi, phone: citizen.phone, name: citizen.name, origin: citizen.origin
          })}
        >
          Usar en check-in
        </Button>
      </CardActions>
    </Card>
  )

  const CaseCard = ({ caseObj, last_visit }) => (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="subtitle1" gutterBottom>
          Expediente: {caseObj.code_persistente}
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip size="small" label={`Ciudadano: ${caseObj.citizen?.name || '—'}`} />
          <Chip size="small" label={`Tema: ${caseObj.topic?.name || '—'}`} />
          <Chip size="small" label={`Estado: ${caseObj.state}`} />
          {last_visit?.badge_code && <Chip size="small" label={`Últ. VIS: ${last_visit.badge_code}`} />}
        </Stack>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={<LaunchIcon />}
          onClick={() => toCheckin({
            dpi: caseObj.citizen?.dpi,
            name: caseObj.citizen?.name,
            phone: caseObj.citizen?.phone,
            origin: caseObj.citizen?.origin,
            topic_id: caseObj.topic
          })}
        >
          Nueva visita
        </Button>
      </CardActions>
    </Card>
  )

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Header + acciones */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Búsqueda rápida</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => { setQ(''); setData(null); setError('') }}>
            <ReplayIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* Input + chips */}
      <form onSubmit={onSubmit}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center">
          <TextField
            placeholder="Buscar por DPI, teléfono, nombre o código (CASE, TRAM, etc.)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={loading}>
            Buscar
          </Button>
        </Stack>
      </form>

      <Stack direction="row" spacing={1} mt={1} mb={2} flexWrap="wrap">
        {MODES.map(m => (
          <Chip
            key={m.key}
            icon={m.icon}
            label={m.label}
            color={mode === m.key ? 'primary' : 'default'}
            onClick={() => setMode(m.key)}
            variant={mode === m.key ? 'filled' : 'outlined'}
            clickable
          />
        ))}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Resultados */}
      {data && (
        <Box>
          {/* Hallazgos claros */}
          <Grid container spacing={2}>
            {/* Ciudadano principal */}
            {data.citizen && (
              <Grid item xs={12} md={6}>
                <CitizenCard citizen={data.citizen} />
              </Grid>
            )}

            {/* Caso principal */}
            {data.case && (
              <Grid item xs={12} md={6}>
                <CaseCard caseObj={data.case} last_visit={data.last_visit} />
              </Grid>
            )}
          </Grid>

          {/* Candidatos */}
          {(data.citizen_candidates?.length > 0 || data.topic_candidates?.length > 0) && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Candidatos</Typography>
            </>
          )}

          {/* Candidatos de ciudadano */}
          {data.citizen_candidates?.length > 0 && (
            <Grid container spacing={2}>
              {data.citizen_candidates.map((c) => (
                <Grid key={c.id} item xs={12} md={6}>
                  <CitizenCard citizen={c} />
                </Grid>
              ))}
            </Grid>
          )}

          {/* Candidatos de tema */}
          {data.topic_candidates?.length > 0 && (
            <Grid container spacing={2} mt={0.5}>
              {data.topic_candidates.map((t) => (
                <Grid key={t.id} item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {t.code} — {t.name}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        startIcon={<LaunchIcon />}
                        onClick={() => toCheckin({ topic_id: t.id, topic_code: t.code })}
                      >
                        Usar en check-in
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Paper>
  )
}
