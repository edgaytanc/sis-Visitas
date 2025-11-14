import api from './axios'

const VISITS_PATH = import.meta.env.VITE_VISITS_PATH || '/api/visits/visits/'
const SEARCH_PATH = import.meta.env.VITE_VISITS_SEARCH_PATH || '/api/visits/search/'
const PHOTO_UPLOAD_PATH = import.meta.env.VITE_VISITS_PHOTO_UPLOAD_PATH || '/api/visits/photos/upload/'

export async function searchVisitContext({ dpi = '', phone = '', name = '', topic = '', case_code = '' } = {}) {
  const params = {}
  if (dpi) params.dpi = dpi
  if (phone) params.phone = phone
  if (name) params.name = name
  if (topic) params.topic = topic
  if (case_code) params.case_code = case_code
  const { data } = await api.get(SEARCH_PATH, { params })
  return data
}

export async function uploadPhotoBase64(dataUrl, filename = 'captura.jpg') {
  const { data } = await api.post(PHOTO_UPLOAD_PATH, {
    image_base64: dataUrl,
    filename
  })
  return data // { path, url }
}

export async function createVisit({
  citizen,    // { dpi?, passport?, name, phone?, origin? }
  topic_id,   // number
  target_unit,
  reason = '',
  photo_path = '',
  reopen_justification = ''
}) {
  const payload = {
    citizen: {
      dpi: citizen?.dpi || '',
      passport: citizen?.passport || '',
      name: citizen?.name || '',
      phone: citizen?.phone || '',
      origin: citizen?.origin || '',
    },
    topic_id,
    target_unit,
    reason,
    photo_path,
    reopen_justification
  }
  const { data } = await api.post(VISITS_PATH, payload)
  return data // VisitSerializer
}

/** FE-06: checkout por badge_code (PATCH /visits/checkout/) */
export async function checkoutByBadge(badge_code) {
  const url = `${VISITS_PATH}checkout/`
  const { data } = await api.patch(url, { badge_code })
  return data // VisitSerializer actualizado (con checkout_at)
}

// FE-NEW: listar visitas activas (sin checkout)
export async function listActiveVisits() {
  const url = `/api/visits/visits/active/`
  const { data } = await api.get(url)
  return data
}

// ✅ NUEVA FUNCIÓN: estadísticas del Dashboard
export async function getDashboardStats() {
  const { data } = await api.get(DASHBOARD_STATS_PATH)
  return data // { activos, entradas_hoy, salidas_hoy, promedio_min }
}