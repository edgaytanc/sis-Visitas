import React, { useState, useEffect } from 'react'
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
} from '@mui/material'
import dayjs from 'dayjs'
import { listActiveVisits } from '../api/visits'

export default function Activos() {
  const [visitas, setVisitas] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const res = await listActiveVisits()
      setVisitas(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <Box sx={{ p: 2, bgcolor: '#F5F6FA', minHeight: '100vh' }}>
      {/* === ENCABEZADO PRINCIPAL === */}
      <Box
        sx={{
          background: 'linear-gradient(90deg, #1E3A8A 0%, #2563EB 50%, #3B82F6 100%)',
          borderRadius: 4,
          p: 3,
          mb: 5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: 'white',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              backgroundColor: 'rgba(255,255,255,0.25)',
              borderRadius: '50%',
              width: 60,
              height: 60,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.7}
              stroke="white"
              width={30}
              height={30}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                textShadow: '0 2px 4px rgba(0,0,0,0.25)',
              }}
            >
              Panel de Visitantes Activos
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.95,
                fontSize: '1rem',
              }}
            >
              Monitoreo en tiempo real de los visitantes dentro de las instalaciones
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          onClick={load}
          sx={{
            borderRadius: 3,
            fontWeight: 600,
            textTransform: 'none',
            px: 4,
            py: 1.2,
            fontSize: '0.95rem',
            background: 'linear-gradient(90deg, #0EA5E9, #06B6D4)', // 💧 azul turquesa
            color: '#fff',
            boxShadow: '0 4px 10px rgba(6,182,212,0.4)',
            '&:hover': {
              background: 'linear-gradient(90deg, #06B6D4, #0EA5E9)',
              boxShadow: '0 6px 14px rgba(14,165,233,0.45)',
            },
          }}
        >
          Actualizar
        </Button>
      </Box>

      {/* === TABLA === */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 3,
          backgroundColor: '#FFFFFF',
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: 700 }}>
              {/* === ENCABEZADOS CLAROS Y LEGIBLES === */}
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: '#E0E7FF',
                    borderBottom: '3px solid #93C5FD',
                  }}
                >
                  {[
                    'Gafete',
                    'Visitante',
                    'Unidad destino',
                    'Motivo',
                    'Ingreso',
                    'Estado',
                  ].map((header) => (
                    <TableCell
                      key={header}
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '2px solid #93C5FD',
                        color: '#0F172A !important', // color texto visible
                        backgroundColor: '#E0E7FF !important',
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              {/* === CUERPO === */}
              <TableBody>
                {visitas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{
                        py: 3,
                        color: '#64748B',
                        fontSize: '1rem',
                        fontStyle: 'italic',
                      }}
                    >
                      No hay visitantes activos
                    </TableCell>
                  </TableRow>
                ) : (
                  visitas.map((v, i) => (
                    <TableRow
                      key={v.id}
                      sx={{
                        backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                        '&:hover': {
                          backgroundColor: '#DBEAFE',
                          transition: '0.2s ease',
                        },
                      }}
                    >
                      <TableCell sx={{ color: '#0F172A', fontWeight: 500 }}>
                        {v.badge_code}
                      </TableCell>
                      <TableCell sx={{ color: '#0F172A' }}>
                        {v.case?.citizen?.name || '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#334155' }}>
                        {v.target_unit || '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#334155' }}>
                        {v.reason || '—'}
                      </TableCell>
                      <TableCell sx={{ color: '#1E40AF', fontWeight: 600 }}>
                        {v.checkin_at
                          ? dayjs(v.checkin_at).format('HH:mm')
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            px: 1.5,
                            py: 0.4,
                            borderRadius: 2,
                            display: 'inline-block',
                            background: 'linear-gradient(90deg, #22C55E, #16A34A)', // ✅ verde moderno
                            color: 'white',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(22,163,74,0.3)',
                          }}
                        >
                          Activo
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </Box>
  )
}
