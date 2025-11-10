import React from 'react'
import {
  Paper, Box, Stack, Typography, TextField, Button, IconButton, Tooltip,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  Chip, Alert, InputAdornment, LinearProgress,
  // --- TAREA 7: Nuevas importaciones ---
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  FormControlLabel, Checkbox, Autocomplete
  // --- FIN TAREA 7 ---
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'

// --- TAREA 7: Nuevas importaciones ---
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  listUsers, deleteUser, listAvailableGroups, createUser, updateUser
} from '../api/admin_users'
// --- FIN TAREA 7 ---

import RequireRole from '../hooks/RequireRole'

// --- TAREA 7: Schema de validación Zod ---
const userSchema = z.object({
  id: z.number().nullable().optional(),
  username: z.string().trim().min(3, 'Usuario debe tener al menos 3 caracteres.'),
  email: z.string().email('Email inválido.').min(1, 'Email es requerido.'),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  
  // La contraseña es opcional, pero si se provee, debe ser > 8 caracteres
  password: z.string().optional().refine(val => !val || val.length >= 8, {
    message: 'La contraseña debe tener al menos 8 caracteres.'
  }),
  passwordConfirm: z.string().optional(),
  
  groups: z.array(z.string()).default([]), // Almacena los *nombres* de los grupos
  isActive: z.boolean().default(true),
  isStaff: z.boolean().default(false),
  isSuperuser: z.boolean().default(false),
})
.refine(data => {
  // Si se está creando (no hay id), la contraseña es requerida
  if (!data.id && !data.password) return false
  return true
}, {
  message: 'La contraseña es requerida al crear un usuario.',
  path: ['password']
})
.refine(data => {
  // Si se escribió una contraseña, la confirmación debe coincidir
  if (data.password && data.password !== data.passwordConfirm) return false
  return true
}, {
  message: 'Las contraseñas no coinciden.',
  path: ['passwordConfirm']
})
// --- FIN TAREA 7 ---


// --- TAREA 7: Componente UserDialog ---
function UserDialog({ open, onClose, onSave, initialData, availableGroups, formError }) {
  
  const isEditing = !!initialData?.id

  const {
    register, handleSubmit, formState: { errors, isSubmitting }, reset, control
  } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: initialData || {
      id: null,
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      passwordConfirm: '',
      groups: [],
      isActive: true,
      isStaff: false,
      isSuperuser: false,
    }
  })

  // Resetea el formulario cuando cambia 'initialData'
  React.useEffect(() => {
    if (open) {
      reset(initialData || {
        id: null,
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        passwordConfirm: '',
        groups: [],
        isActive: true,
        isStaff: false,
        isSuperuser: false,
      })
    }
  }, [initialData, open, reset])

  const submit = async (values) => {
    try {
      // La API normaliza el objeto (firstName -> first_name)
      await onSave(values) 
      onClose() // Cierra solo si onSave tiene éxito
    } catch  {
      // El error ya se maneja en el componente padre (UsersTable)
      // y se pasa aquí como 'formError'
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
      <DialogContent dividers>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {formError}
          </Alert>
        )}
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Usuario (username)"
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
              fullWidth
              autoFocus
              disabled={isEditing} // No se puede cambiar el username
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nombre"
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Apellido"
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={isEditing ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message || (isEditing ? 'Dejar en blanco para no cambiar' : '')}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Confirmar Contraseña"
              type="password"
              {...register('passwordConfirm')}
              error={!!errors.passwordConfirm}
              helperText={errors.passwordConfirm?.message}
              fullWidth
              disabled={isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Controller
              name="groups"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  multiple
                  options={availableGroups.map(g => g.name)} // Opciones son strings
                  getOptionLabel={(option) => option}
                  onChange={(_, newValue) => field.onChange(newValue)}
                  value={field.value || []}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Roles (Grupos)"
                      error={!!errors.groups}
                      helperText={errors.groups?.message}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <Checkbox {...field} checked={field.value} />
                  )}
                />
              }
              label="Activo"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Controller
                  name="isStaff"
                  control={control}
                  render={({ field }) => (
                    <Checkbox {...field} checked={field.value} />
                  )}
                />
              }
              label="Staff (acceso al admin de Django)"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Controller
                  name="isSuperuser"
                  control={control}
                  render={({ field }) => (
                    <Checkbox {...field} checked={field.value} />
                  )}
                />
              }
              label="Superusuario (permisos totales)"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit(submit)} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
// --- FIN TAREA 7 ---


/**
 * Componente principal de la tabla de usuarios
 */
function UsersTable () {
  const [rows, setRows] = React.useState([])
  const [count, setCount] = React.useState(0)
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(10)
  const [q, setQ] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [formError, setFormError] = React.useState('')

  // TAREA 7: Estado para diálogo y grupos
  const [dlgOpen, setDlgOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(null)
  const [availableGroups, setAvailableGroups] = React.useState([])

  // Función para extraer errores del backend
  const extractBackendErrors = (err) => {
    const data = err?.response?.data
    if (!data) return 'Error desconocido'
    if (typeof data === 'string') return data
    const msgs = []
    Object.entries(data).forEach(([k, v]) => {
      if (Array.isArray(v)) msgs.push(`${k}: ${v.join(' ')}`)
      else if (typeof v === 'string') msgs.push(`${k}: ${v}`)
    })
    return msgs.join(' | ') || 'Solicitud inválida'
  }

  // Carga de datos de la tabla
  const fetchData = React.useCallback(async () => {
    setLoading(true); setError('')
    try {
      const { items, count } = await listUsers({
        search: q,
        page: page + 1,
        pageSize: rowsPerPage
      })
      setRows(items)
      setCount(count)
    } catch (err) {
      setError('No fue posible cargar los usuarios.',err)
    } finally {
      setLoading(false)
    }
  }, [q, page, rowsPerPage])

  // Carga de grupos (solo una vez)
  const fetchGroups = async () => {
    try {
      const groups = await listAvailableGroups()
      setAvailableGroups(groups || [])
    } catch (e) {
      setError('No se pudieron cargar los roles/grupos.',e)
    }
  }

  // Hook para recargar datos de tabla
  React.useEffect(() => {
    fetchData()
  }, [fetchData])
  
  // Hook para cargar grupos al montar
  React.useEffect(() => {
    fetchGroups()
  }, [])


  // Manejador para el botón de eliminar
  const onDelete = async (row) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar al usuario "${row.username}"?`)) {
      return
    }
    setFormError('')
    try {
      await deleteUser(row.id)
      await fetchData() // Recargar la tabla
    } catch (e) {
      setFormError(extractBackendErrors(e))
    }
  }

  // --- TAREA 7: Implementación de Handlers ---
  const handleNew = () => {
    setEditing(null) // 'null' indica que es creación
    setDlgOpen(true)
    setFormError('')
  }

  const handleEdit = (row) => {
    // Normalizamos el 'initialData' al formato del formulario (firstName, etc.)
    setEditing({
      id: row.id,
      username: row.username,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      password: '', // El password nunca se carga, solo se escribe
      passwordConfirm: '',
      groups: row.groups || [],
      isActive: row.isActive,
      isStaff: row.isStaff,
      isSuperuser: row.isSuperuser,
    })
    setDlgOpen(true)
    setFormError('')
  }
  
  const handleCreate = async (values) => {
    setFormError('')
    try {
      await createUser(values)
      await fetchData() // Recargar la tabla
    } catch (e) {
      setFormError(extractBackendErrors(e))
      throw e // Lanzar error para que el diálogo sepa que falló
    }
  }
  
  const handleUpdate = async (values) => {
    setFormError('')
    try {
      await updateUser(editing.id, values)
      await fetchData() // Recargar la tabla
    } catch (e) {
      setFormError(extractBackendErrors(e))
      throw e // Lanzar error
    }
  }
  // --- FIN TAREA 7 ---

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        spacing={2}
      >
        <Typography variant="h6">Administración de Usuarios</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Buscar por usuario, email, nombre..."
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0) }}
            onKeyDown={(e) => e.key === 'Enter' && fetchData()}
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
            onClick={handleNew}
          >
            Nuevo Usuario
          </Button>
        </Stack>
      </Stack>

      {/* Alertas de error */}
      {(error) && ( // Error de carga principal
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {/* El error del formulario (formError) se muestra *dentro* del diálogo */}

      {/* Indicador de carga sobre la tabla */}
      {loading && <LinearProgress sx={{ mb: 0.5 }} />}

      {/* Tabla de usuarios */}
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Usuario</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Nombre</TableCell>
            <TableCell>Roles (Grupos)</TableCell>
            <TableCell align="center">Estado</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} hover>
              <TableCell sx={{ fontWeight: 500 }}>{row.username}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{`${row.firstName} ${row.lastName}`.trim() || '—'}</TableCell>
              <TableCell>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {row.groups.map((g) => (
                    <Chip key={g} label={g} size="small" variant="outlined" />
                  ))}
                  {row.isSuperuser && (
                    <Chip key="su" label="Superusuario" size="small" color="error" />
                  )}
                </Stack>
              </TableCell>
              <TableCell align="center">
                <Chip
                  size="small"
                  label={row.isActive ? 'Activo' : 'Inactivo'}
                  color={row.isActive ? 'success' : 'default'}
                  icon={row.isActive ? <CheckCircleIcon /> : <CancelIcon />}
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Editar">
                  <IconButton onClick={() => handleEdit(row)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar">
                  <IconButton onClick={() => onDelete(row)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {(!loading && rows.length === 0) && (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No se encontraron usuarios.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Paginación */}
      <TablePagination
        component="div"
        count={count}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10))
          setPage(0)
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      {/* --- TAREA 7: Renderizar el Diálogo --- */}
      <UserDialog
        open={dlgOpen}
        onClose={() => setDlgOpen(false)}
        onSave={editing ? handleUpdate : handleCreate}
        initialData={editing} // 'null' para crear, objeto para editar
        availableGroups={availableGroups}
        formError={formError} // Pasamos el error al diálogo
      />
      {/* --- FIN TAREA 7 --- */}
      
    </Paper>
  )
}

/**
 * Componente exportado que envuelve la tabla en el HOC de roles.
 */
export default function AdminUsers () {
  return (
    <RequireRole roles={['admin']}>
      <Box>
        <UsersTable />
      </Box>
    </RequireRole>
  )
}