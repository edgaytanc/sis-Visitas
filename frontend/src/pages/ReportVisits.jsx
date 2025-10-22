import React from 'react'
import {
  Paper, Box, Stack, Typography, TextField, Button, Alert, Divider,
  Table, TableHead, TableRow, TableCell, TableBody
} from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'
import { es } from 'date-fns/locale'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import SearchIcon from '@mui/icons-material/Search'
import { format } from 'date-fns'
import api from '../api/axios'
import { downloadVisitsReport } from '../api/reports'
import RequireRole from '../hooks/RequireRole'

export default function ReportVisits() {
  return (
    <RequireRole roles={['supervisor', 'admin']}>
      <Box>
        <VisitsReportScreen />
      </Box>
    </RequireRole>
  )
}

function VisitsReportScreen() {
  const [from, setFrom] = React.useState(new Date())
  const [to, setTo] = React.useState(new Date())
  const [citizen, setCitizen] = React.useState('')
  const [rows, setRows] = React.useState([])
  const [error, setError] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  // Vista previa simple (usa /visits endpoint para 10 filas)
  const previewReport = async () => {
    setError('')
    setLoading(true)
    try {
      const params = new URLSearchParams({
        from: format(from, 'yyyy-MM-dd'),
        to: format(to, 'yyyy-MM-dd'),
        citizen: citizen || '',
        format: 'json'
      })
      const { data } = await api.get(`/api/reports/visits?${params.toString()}`)
      setRows(data.results || [])
    } catch (e) {
      console.error(e)
      setError('No se pudieron cargar las visitas del rango indicado.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }


  const handleExport = async () => {
    setError('')
    try {
      const fromStr = format(from, 'yyyy-MM-dd')
      const toStr = format(to, 'yyyy-MM-dd')

      const blob = await downloadVisitsReport({
        from: fromStr,
        to: toStr,
        citizen,
        download: true,
      })

      const pdfUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = pdfUrl
      a.download = `reporte-visitas-${fromStr}_${toStr}.pdf`
      a.click()
      URL.revokeObjectURL(pdfUrl)
    } catch (e) {
      console.error('Export PDF error:', e)
      // e.message suele contener el HTML/JSON de error del backend → mostramos algo amigable
      setError('No se pudo generar el PDF. ' + (e.httpStatus ? `(HTTP ${e.httpStatus})` : ''))
    }
  }


  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Reporte de Visitas</Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<SearchIcon />}
              onClick={previewReport}
              disabled={loading}
            >
              Vista previa
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExport}
              disabled={loading}
            >
              Exportar PDF
            </Button>
          </Stack>
        </Stack>

        {(error) && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
          <DatePicker label="Desde" value={from} onChange={(v) => v && setFrom(v)} />
          <DatePicker label="Hasta" value={to} onChange={(v) => v && setTo(v)} />
          <TextField
            label="Ciudadano / DPI"
            value={citizen}
            onChange={(e) => setCitizen(e.target.value)}
            fullWidth
          />
        </Stack>

        <Divider sx={{ my: 2 }} />

        {rows.length > 0 ? (
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha ingreso</TableCell>
                  <TableCell>Ciudadano</TableCell>
                  <TableCell>Tema</TableCell>
                  <TableCell>Unidad destino</TableCell>
                  <TableCell>Badge</TableCell>
                  <TableCell>Salida</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.slice(0, 20).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.checkin_at?.slice(0, 16)}</TableCell>
                    <TableCell>{r.case?.citizen?.name}</TableCell>
                    <TableCell>{r.case?.topic?.name}</TableCell>
                    <TableCell>{r.target_unit}</TableCell>
                    <TableCell>{r.badge_code}</TableCell>
                    <TableCell>{r.checkout_at?.slice(0, 16) || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {loading ? 'Cargando...' : 'Sin resultados.'}
          </Typography>
        )}
      </Paper>
    </LocalizationProvider>
  )
}
