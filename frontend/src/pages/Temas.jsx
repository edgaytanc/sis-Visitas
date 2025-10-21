import React from 'react'
import {
  Paper, Box, Stack, Typography, TextField, Button, IconButton, Tooltip,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Chip, Switch, Dialog, DialogTitle, DialogContent, DialogActions,
  FormControlLabel, Alert, InputAdornment
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  listTemas, createTema, updateTema, toggleTema, deleteTema
} from '../api/temas'
import RequireRole from '../hooks/RequireRole'

const CODE_RE = /^[A-Z0-9\-_.]{3,32}$/

const schema = z.object({
  codigo: z.string()
    .transform((v) => (v || '').toUpperCase().trim())
    .refine((v) => CODE_RE.test(v), {
      message: "Código inválido. Usa A-Z, 0-9, '-', '_' o '.', longitud 3–32."
    }),
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  unidad: z.string().trim().min(2, 'La unidad debe tener al menos 2 caracteres.'),
  descripcion: z.string().optional(),
  activo: z.boolean().default(true)
})

function TemaDialog({ open, onClose, onSave, initial }) {
  const {
    register, handleSubmit, formState: { errors, isSubmitting }, reset, watch, setValue
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: initial || {
      codigo: '',
      nombre: '',
      unidad: '',
      descripcion: '',
      activo: true
    }
  })

  React.useEffect(() => {
    reset(initial || {
      codigo: '',
      nombre: '',
      unidad: '',
      descripcion: '',
      activo: true
    })
  }, [initial, reset])

  const submit = async (values) => {
    await onSave(values)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial?.id ? 'Editar Tema' : 'Nuevo Tema'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Código"
            {...register('codigo')}
            error={!!errors.codigo}
            helperText={errors.codigo?.message}
            fullWidth
            inputProps={{ style: { textTransform: 'uppercase' }, maxLength: 32 }}
            onChange={(e) => { e.target.value = e.target.value.toUpperCase() }}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Nombre"
              {...register('nombre')}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
              fullWidth
            />
            <TextField
              label="Unidad"
              {...register('unidad')}
              error={!!errors.unidad}
              helperText={errors.unidad?.message}
              fullWidth
            />
          </Stack>
          <TextField
            label="Descripción"
            multiline minRows={3}
            {...register('descripcion')}
            error={!!errors.descripcion}
            helperText={errors.descripcion?.message}
            fullWidth
          />
          <FormControlLabel
            control={
              <Switch
                checked={!!watch('activo')}
                onChange={(e) => setValue('activo', e.target.checked)}
              />
            }
            label="Activo"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit(submit)} variant="contained" disabled={isSubmitting}>
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function TemasTable() {
  const [rows, setRows] = React.useState([])
  const [count, setCount] = React.useState(0)
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [dlgOpen, setDlgOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [formError, setFormError] = React.useState('')

  const fetchData = React.useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { items, count } = await listTemas({ search: q, page: page + 1, pageSize: rowsPerPage })
      setRows(items)
      setCount(count)
    } catch {
      setError('No fue posible cargar los temas.')
    } finally {
      setLoading(false)
    }
  }, [q, page, rowsPerPage])

  React.useEffect(() => { fetchData() }, [fetchData])

  const extractBackendErrors = (err) => {
    // DRF suele devolver { field: ["msg", ...], non_field_errors: [...] }
    const data = err?.response?.data
    if (!data) return 'Error desconocido'
    if (typeof data === 'string') return data
    const msgs = []
    Object.entries(data).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        msgs.push(`${k}: ${v.join(' ')}`)
      } else if (typeof v === 'string') {
        msgs.push(`${k}: ${v}`)
      }
    })
    return msgs.join(' | ') || 'Solicitud inválida'
  }

  const handleCreate = async (values) => {
    setFormError('')
    try {
      await createTema(values)
      await fetchData()
    } catch (e) {
      setFormError(extractBackendErrors(e))
      throw e // para que el dialog no se cierre si falla
    }
  }

  const handleUpdate = async (values) => {
    setFormError('')
    try {
      await updateTema(editing.id, values)
      await fetchData()
    } catch (e) {
      setFormError(extractBackendErrors(e))
      throw e
    }
  }

  const onToggle = async (row) => {
    setFormError('')
    try {
      await toggleTema(row.id, !row.activo)
      await fetchData()
    } catch (e) {
      setFormError(extractBackendErrors(e))
    }
  }

  const onDelete = async (row) => {
    if (!confirm(`¿Eliminar el tema "${row.nombre}"?`)) return
    setFormError('')
    try {
      await deleteTema(row.id)
      await fetchData()
    } catch (e) {
      setFormError(extractBackendErrors(e))
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2} spacing={2}>
        <Typography variant="h6">Catálogo de Temas</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0) }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditing(null); setDlgOpen(true) }}
          >
            Nuevo
          </Button>
        </Stack>
      </Stack>

      {(error || formError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || formError}
        </Alert>
      )}

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Código</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Unidad</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell align="center">Estado</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell>{row.codigo}</TableCell>
              <TableCell>{row.nombre}</TableCell>
              <TableCell>{row.unidad}</TableCell>
              <TableCell sx={{ maxWidth: 420 }}>
                <Typography variant="body2" color="text.secondary" noWrap title={row.descripcion}>
                  {row.descripcion || '—'}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                  <Chip size="small" label={row.activo ? 'Activo' : 'Inactivo'} color={row.activo ? 'success' : 'default'} />
                  <Switch checked={row.activo} onChange={() => onToggle(row)} />
                </Stack>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Editar">
                  <IconButton onClick={() => { setEditing(row); setDlgOpen(true) }}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton onClick={() => onDelete(row)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {(!loading && rows.length === 0) && (
            <TableRow><TableCell colSpan={6} align="center">Sin datos</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <TemaDialog
        open={dlgOpen}
        onClose={() => setDlgOpen(false)}
        onSave={editing ? handleUpdate : handleCreate}
        initial={editing}
      />
    </Paper>
  )
}

export default function Temas() {
  return (
    <RequireRole roles={['supervisor', 'admin']}>
      <Box>
        <TemasTable />
      </Box>
    </RequireRole>
  )
}
