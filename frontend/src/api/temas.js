import api from './axios'

const TEMAS_PATH = import.meta.env.VITE_TEMAS_PATH || '/api/catalog/topics/'

// Normaliza item de API -> objeto del FE
function normalizeTema(it) {
  return {
    id: it.id,
    codigo: it.code ?? '',
    nombre: it.name ?? '',
    descripcion: it.description ?? '',
    unidad: it.unit ?? '',
    activo: typeof it.is_active === 'boolean' ? it.is_active : false,
    created_at: it.created_at,
    updated_at: it.updated_at,
  }
}

// Payload FE -> API (usa nombres del backend)
function payloadTema(data) {
  return {
    code: String(data.codigo || '').trim().toUpperCase(), // cumple CODE_RE
    name: String(data.nombre || '').trim(),
    unit: String(data.unidad || '').trim(),
    description: (data.descripcion ?? '').toString(),
    is_active: !!data.activo,
  }
}

export async function listTemas({ search = '', page = 1, pageSize = 10, ordering = 'name' } = {}) {
  const params = { page, page_size: pageSize, ordering }
  if (search) params.search = search
  const { data } = await api.get(TEMAS_PATH, { params })
  const results = Array.isArray(data) ? data : (data.results || [])
  const count = Array.isArray(data) ? results.length : (data.count ?? results.length)
  return { items: results.map(normalizeTema), count }
}

export async function createTema(form) {
  const { data } = await api.post(TEMAS_PATH, payloadTema(form))
  return normalizeTema(data)
}

export async function updateTema(id, form) {
  // PUT completo (envía todos los campos)
  const { data } = await api.put(`${TEMAS_PATH}${id}/`, payloadTema(form))
  return normalizeTema(data)
}

export async function patchTema(id, partial) {
  const { data } = await api.patch(`${TEMAS_PATH}${id}/`, partial)
  return normalizeTema(data)
}

export async function toggleTema(id, activo) {
  const { data } = await api.patch(`${TEMAS_PATH}${id}/`, { is_active: !!activo })
  return normalizeTema(data)
}

export async function deleteTema(id) {
  await api.delete(`${TEMAS_PATH}${id}/`)
  return true
}

export async function listActiveTemas() {
  // pide una página "grande" para simplificar el Autocomplete
  const { data } = await api.get(`${TEMAS_PATH}active/`, { params: { page_size: 200 } })
  const results = Array.isArray(data) ? data : (data?.results || [])
  return results.map(t => ({
    id: t.id,
    code: t.code,
    name: t.name,
  }))
}