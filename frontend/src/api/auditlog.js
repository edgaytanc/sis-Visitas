import api from './axios'

const AUDIT_PATH = import.meta.env.VITE_AUDIT_PATH || '/api/auditlog/logs/'

/**
 * Lista logs con filtros del backend + paginación DRF.
 * - action: exact (ej. "visit_checkout")
 * - entity: exact (ej. "Visit")
 * - user: id numérico (opcional)
 * - search: busca en entity, entity_id, user__username, ip
 * - page / page_size: paginación
 */
export async function listAuditLogs({
  action = '',
  entity = '',
  user = '',
  search = '',
  ordering = '-ts',
  page = 1,
  page_size = 25
} = {}) {
  const params = { ordering, page, page_size }
  if (action) params.action = action
  if (entity) params.entity = entity
  if (user) params.user = user   // id numérico si lo tienes
  if (search) params.search = search

  const { data } = await api.get(AUDIT_PATH, { params })
  return data           // { count, next, previous, results: [...] }
}
