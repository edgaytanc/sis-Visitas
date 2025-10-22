import React from 'react'
import { Button, CircularProgress } from '@mui/material'
import PrintIcon from '@mui/icons-material/Print'
import api from '../api/axios'

/**
 * Botón para abrir/imprimir el PDF del gafete.
 * Props:
 *  - visitId (number)   -> requerido
 *  - badgeCode (string) -> opcional, solo para nombrar archivo si se descarga
 *  - variant, size, fullWidth ... (se pasan a <Button />)
 */
export default function PrintBadgeButton({ visitId, ...btnProps }) {
  const [loading, setLoading] = React.useState(false)

  const handlePrint = async () => {
    if (!visitId) return
    setLoading(true)
    try {
      const base = import.meta.env.VITE_VISITS_PATH || '/api/visits/visits/'
      const url = `${base}${visitId}/badge.pdf/` // ¡ojo la barra final!
      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const pdfUrl = URL.createObjectURL(blob)
      // abre en nueva pestaña
      window.open(pdfUrl, '_blank', 'noopener,noreferrer')
      // si quisieras forzar descarga:
      // const a = document.createElement('a')
      // a.href = pdfUrl
      // a.download = `gafete-${badgeCode || visitId}.pdf`
      // a.click()
      // URL.revokeObjectURL(pdfUrl)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handlePrint}
      startIcon={!loading ? <PrintIcon /> : null}
      disabled={!visitId || loading}
      {...btnProps}
    >
      {loading ? <CircularProgress size={18} /> : 'Imprimir gafete'}
    </Button>
  )
}
