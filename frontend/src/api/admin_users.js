import api from './axios'

// Rutas base (definidas en las tareas del backend)
const USERS_PATH = '/api/users/users/'
const GROUPS_PATH = '/api/users/groups/'

/**
 * Normaliza un objeto de usuario de la API (backend) 
 * a un objeto de usuario para el frontend.
 * (ej. first_name -> firstName)
 */
function normalizeUser(apiUser) {
  return {
    id: apiUser.id,
    username: apiUser.username || '',
    email: apiUser.email || '',
    firstName: apiUser.first_name || '',
    lastName: apiUser.last_name || '',
    isActive: !!apiUser.is_active,
    isStaff: !!apiUser.is_staff,
    isSuperuser: !!apiUser.is_superuser,
    groups: apiUser.groups || [], // DRF devuelve esto como ['admin', 'supervisor']
    lastLogin: apiUser.last_login,
    dateJoined: apiUser.date_joined,
  }
}

/**
 * Convierte un objeto de formulario del frontend
 * al formato de payload que espera la API (backend).
 * (ej. firstName -> first_name)
 */
function payloadUser(formUser) {
  const payload = {
    username: (formUser.username || '').trim(),
    email: (formUser.email || '').trim(),
    first_name: (formUser.firstName || '').trim(),
    last_name: (formUser.lastName || '').trim(),
    is_active: !!formUser.isActive,
    is_staff: !!formUser.isStaff,
    is_superuser: !!formUser.isSuperuser,
    groups: formUser.groups || [], // El serializer espera una lista de nombres de grupo
  }
  
  // Importante: Solo enviar el password si se está estableciendo/cambiando.
  // No enviar un string vacío si no se quiere modificar.
  if (formUser.password) {
    payload.password = formUser.password
  }
  
  return payload
}

/**
 * Tarea 5.1: Lista paginada de usuarios con filtros.
 * Acepta filtros del backend: search, page, page_size, ordering, groups__name, is_active.
 */
export async function listUsers({
  search = '',
  page = 1,
  pageSize = 10,
  ordering = 'username',
  group = '', // para filtrar por groups__name
  isActive = null, // para filtrar por is_active (true/false)
} = {}) {
  const params = { page, page_size: pageSize, ordering }
  if (search) params.search = search
  if (group) params.groups__name = group
  if (isActive !== null) params.is_active = isActive

  const { data } = await api.get(USERS_PATH, { params })
  
  // Sigue el formato de paginación de DRF
  const results = data.results || []
  const count = data.count ?? results.length
  
  return { items: results.map(normalizeUser), count }
}

/**
 * Tarea 5.2: Crea un nuevo usuario.
 * 'form' debe ser un objeto compatible con payloadUser
 * (incluyendo 'password' requerido).
 */
export async function createUser(form) {
  const { data } = await api.post(USERS_PATH, payloadUser(form))
  return normalizeUser(data)
}

/**
 * Tarea 5.3: Actualiza un usuario (usando PUT para reemplazo completo).
 * 'form' debe ser un objeto compatible con payloadUser
 * (el 'password' es opcional aquí).
 */
export async function updateUser(id, form) {
  const { data } = await api.put(`${USERS_PATH}${id}/`, payloadUser(form))
  return normalizeUser(data)
}

/**
 * Tarea 5.4: Elimina un usuario por ID.
 */
export async function deleteUser(id) {
  await api.delete(`${USERS_PATH}${id}/`)
  return true
}

/**
 * Tarea 5.5: Obtiene la lista de grupos (roles) disponibles.
 * (Endpoint creado en la Tarea 4 del backend).
 */
export async function listAvailableGroups() {
  const { data } = await api.get(GROUPS_PATH)
  // Devuelve la lista directamente, ej: [{ id: 1, name: 'admin' }, ...]
  return data || []
}