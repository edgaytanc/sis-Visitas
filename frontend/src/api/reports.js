import api from './axios'

const REPORTS_PATH = import.meta.env.VITE_REPORTS_PATH || '/api/reports/visits'

export async function downloadVisitsReport({ from, to, citizen = '', download = true }) {
  const params = {}
  if (from) params.from = from
  if (to) params.to = to
  if (citizen) params.citizen = citizen
  if (download) params.download = '1'

  const res = await api.get(REPORTS_PATH, {
    params,
    responseType: 'arraybuffer',              // <- binario
    headers: { Accept: 'application/pdf' },   // <- pedimos PDF explícitamente
    validateStatus: s => s < 500,             // dejamos pasar 4xx para detectar error
  })

  const contentType = res.headers?.['content-type'] || res.headers?.get?.('content-type') || ''
  if (!contentType.includes('application/pdf')) {
    // Intentamos decodificar el cuerpo como texto para mostrar el error real
    let msg = 'Respuesta no es PDF.'
    try {
      const text = new TextDecoder('utf-8').decode(new Uint8Array(res.data))
      msg = text || msg
    } catch {}
    const err = new Error(msg)
    err.httpStatus = res.status
    throw err
  }

  return new Blob([res.data], { type: 'application/pdf' })
}
