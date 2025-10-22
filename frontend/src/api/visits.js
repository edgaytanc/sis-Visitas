import api from './axios'

const VISITS_PATH = import.meta.env.VITE_VISITS_PATH || '/api/visits/visits/'
const SEARCH_PATH = import.meta.env.VITE_VISITS_SEARCH_PATH || '/api/visits/search/'
const PHOTO_UPLOAD_PATH = import.meta.env.VITE_VISITS_PHOTO_UPLOAD_PATH || '/api/visits/photos/upload/'

export async function searchVisitContext({ dpi = '', phone = '', name = '', topic = '', case_code = '' } = {}) {
  const params = {}
  if (dpi) params.dpi = dpi
  if (phone) params.phone = phone
  if (name) params.name = name
  if (topic) params.topic = topic   // id numérico, code o nombre (icontains)
  if (case_code) params.case_code = case_code

  const { data } = await api.get(SEARCH_PATH, { params })
  return data
}

export async function uploadPhotoBase64(dataUrl, filename = 'captura.jpg') {
  // Envía JSON: { image_base64, filename }
  const { data } = await api.post(PHOTO_UPLOAD_PATH, {
    image_base64: dataUrl,
    filename
  })
  // Devuelve { path, url }
  return data
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
  // Respuesta es VisitSerializer: incluye id y badge_code
  return data
}
