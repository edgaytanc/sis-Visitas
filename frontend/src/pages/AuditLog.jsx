import React from 'react'
import {
  Paper, Box, Stack, Typography, TextField, Button, Alert, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip, Tooltip, Pagination
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { es } from 'date-fns/locale'
import { format, startOfDay, endOfDay } from 'date-fns'
import { listAuditLogs } from '../api/auditlog'
import RequireRole from '../hooks/RequireRole'

export default function AuditLog() {
  return (
    <RequireRole roles={['supervisor','admin']}>
      <Box>
        <AuditLogScreen />
    </Box>
    </RequireRole>
  )
}

function AuditLogScreen() {
  // filtros
  const [action, setAction] = React.useState('')
  const [entity, setEntity] = React.useState('')
  const [userSearch, setUserSearch] = React.useState('') // username o ip (va en ?search=)
  const [from, setFrom] = React.useState(null)
  const [to, setTo] = React.useState(null)

  // datos
  const [rows, setRows] = React.useState([])
  const [count, setCount] = React.useState(0)
  const [page, setPage] = React.useState(1)
  const [pageSize] = React.useState(25)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [payloadRow, setPayloadRow] = React.useState(null)

  const fetchLogs = async (opts = {}) => {
    setLoading(true); setError('')
    try {
      const data = await listAuditLogs({
        action, entity,
        search: userSearch,         // backend: busca en username/ip/entity
        page, page_size: pageSize,
        ...opts
      })
      let items = data.results || []
      // Filtro por fecha en CLIENTE (el backend actual no expone ts en filterset)
      if (from || to) {
        const min = from ? startOfDay(from).getTime() : -Infinity
        const max = to ? endOfDay(to).getTime() : Infinity
        items = items.filter(r => {
          const t = new Date(r.ts).getTime()
          return t >= min && t <= max
        })
      }
      setRows(items)
      setCount(data.count || items.length)
    } catch (e) {
      setError('No se pudieron cargar los registros.',e.message)
      setRows([]); setCount(0)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const onSearch = () => {
    setPage(1)
    fetchLogs({ page: 1 })
  }

  const onReset = () => {
    setAction(''); setEntity(''); setUserSearch(''); setFrom(null); setTo(null)
    setPage(1)
    fetchLogs({ page: 1 })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Bitácora</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<SearchIcon />} onClick={onSearch} disabled={loading}>
              Buscar
            </Button>
            <Button variant="text" startIcon={<RestartAltIcon />} onClick={onReset} disabled={loading}>
              Limpiar
            </Button>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Filtros */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mb={2}>
          <TextField label="Acción" value={action} onChange={e => setAction(e.target.value)} />
          <TextField label="Entidad" value={entity} onChange={e => setEntity(e.target.value)} />
          <TextField
            label="Usuario/IP/ID entidad (búsqueda)"
            helperText="Busca por username, IP, entity o entity_id"
            value={userSearch}
            onChange={e => setUserSearch(e.target.value)}
            fullWidth
          />
          <DatePicker label="Desde" value={from} onChange={(v) => setFrom(v)} />
          <DatePicker label="Hasta" value={to} onChange={(v) => setTo(v)} />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Tabla */}
        <Box sx={{ overflow: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Acción</TableCell>
                <TableCell>Entidad</TableCell>
                <TableCell>Entidad ID</TableCell>
                <TableCell>IP</TableCell>
                <TableCell align="right">Payload</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.ts?.replace('T',' ').slice(0,19)}</TableCell>
                  <TableCell>{r.user_username || '—'}</TableCell>
                  <TableCell><Chip size="small" label={r.action} /></TableCell>
                  <TableCell>{r.entity}</TableCell>
                  <TableCell>{r.entity_id}</TableCell>
                  <TableCell>{r.ip || '—'}</TableCell>
                  <TableCell align="right">
                    {r.payload ? (
                      <Tooltip title="Ver payload JSON">
                        <IconButton onClick={() => setPayloadRow(r)} size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {!loading && rows.length === 0 && (
                <TableRow><TableCell colSpan={7}>Sin resultados.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Paginación */}
        <Stack direction="row" justifyContent="flex-end" mt={2}>
          <Pagination
            count={Math.max(1, Math.ceil((count || 0) / pageSize))}
            page={page}
            onChange={(_, p) => setPage(p)}
            size="small"
          />
        </Stack>

        {/* Modal simple para payload */}
        {payloadRow && (
          <Paper
            elevation={8}
            sx={{
              position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2, zIndex: 2000
            }}
            onClick={() => setPayloadRow(null)}
          >
            <Paper sx={{ maxWidth: 700, width: '100%', maxHeight: '80vh', overflow: 'auto', p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Payload</Typography>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(payloadRow.payload, null, 2)}
              </pre>
            </Paper>
          </Paper>
        )}
      </Paper>
    </LocalizationProvider>
  )
}
