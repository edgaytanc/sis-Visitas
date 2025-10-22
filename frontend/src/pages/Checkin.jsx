import React from 'react'
import {
    Paper, Box, Stack, Typography, TextField, Button, Alert, Grid,
    Autocomplete, Chip, Divider, IconButton, Tooltip, Snackbar, Link as MuiLink
} from '@mui/material'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import SearchIcon from '@mui/icons-material/Search'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { listActiveTemas } from '../api/temas'
import { searchVisitContext, uploadPhotoBase64, createVisit } from '../api/visits'
import RequireRole from '../hooks/RequireRole'
import { useLocation } from 'react-router-dom'



import api from '../api/axios'
import PrintBadgeButton from '../components/PrintbadgeButton'

const DPI_RE = /^[0-9]{6,13}$/
const PHONE_RE = /^[0-9+\-() ]{6,20}$/

const schema = z.object({
    dpi: z.string().optional().transform(v => (v || '').trim()).refine(v => (v === '' || DPI_RE.test(v)), {
        message: 'DPI debe contener entre 6 y 13 dígitos.'
    }),
    passport: z.string().optional().transform(v => (v || '').trim()),
    name: z.string().min(3, 'Nombre mínimo 3 caracteres').transform(v => v.trim()),
    phone: z.string().optional().transform(v => (v || '').trim()).refine(v => (v === '' || PHONE_RE.test(v)), {
        message: 'Teléfono con formato inválido.'
    }),
    origin: z.string().optional().transform(v => (v || '').trim()),
    topic_id: z.number({ required_error: 'Selecciona un tema' }),
    target_unit: z.string().min(2, 'Unidad destino requerida').transform(v => v.trim()),
    reason: z.string().optional().transform(v => (v || '').trim()),
    reopen_justification: z.string().optional().transform(v => (v || '').trim()),
    photo_data_url: z.string().optional() // dataURL de preview (si hay)
}).refine(data => !!(data.dpi || data.passport), {
    message: 'Debes proporcionar DPI o PASAPORTE.',
    path: ['dpi'] // marca al lado de DPI
})

async function openBadgePdf(visitId) {
    // Asegura la barra final /badge.pdf/
    const visitsPath = import.meta.env.VITE_VISITS_PATH || '/api/visits/visits/'
    const url = `${visitsPath}${visitId}/badge.pdf/`

    const res = await api.get(url, { responseType: 'blob' })
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const pdfUrl = URL.createObjectURL(blob)

    // Abre en nueva pestaña
    window.open(pdfUrl, '_blank', 'noopener,noreferrer')

    // (opcional) Si quieres forzar descarga:
    // const link = document.createElement('a')
    // link.href = pdfUrl
    // link.download = `gafete-${visitId}.pdf`
    // link.click()
    // URL.revokeObjectURL(pdfUrl) // si lo descargas y no necesitas mantenerlo
}


export default function Checkin() {
    return (
        <RequireRole roles={['recepcion', 'supervisor', 'admin']}>
            <Box>
                <CheckinForm />
            </Box>
        </RequireRole>
    )
}

function CheckinForm() {
    const [temas, setTemas] = React.useState([])
    const [loadingTemas, setLoadingTemas] = React.useState(true)

    const [searchHint, setSearchHint] = React.useState(null) // datos del /search
    const [infoMsg, setInfoMsg] = React.useState('')
    const [errorMsg, setErrorMsg] = React.useState('')

    const [previewUrl, setPreviewUrl] = React.useState('')
    const [videoStream, setVideoStream] = React.useState(null)
    const [cameraReady, setCameraReady] = React.useState(false)

    const [lastVisit, setLastVisit] = React.useState(null) // { id, badge_code }


    const [snack, setSnack] = React.useState({ open: false, text: '' })

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    const visitsPath = import.meta.env.VITE_VISITS_PATH || '/api/visits/visits/'




    const {
        register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            dpi: '',
            passport: '',
            name: '',
            phone: '',
            origin: '',
            topic_id: undefined,
            target_unit: '',
            reason: '',
            reopen_justification: '',
            photo_data_url: ''
        }
    })

    const topicId = watch('topic_id')
    const location = useLocation()

    React.useEffect(() => {
        (async () => {
            try {
                setLoadingTemas(true)
                const items = await listActiveTemas()
                setTemas(items)
            } catch {
                setTemas([])
            } finally {
                setLoadingTemas(false)
            }
        })()
        return () => {
            if (videoStream) {
                videoStream.getTracks().forEach(t => t.stop())
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    React.useEffect(() => {
        return () => {
            if (videoStream) {
                videoStream.getTracks().forEach(t => t.stop())
            }
        }
    }, [videoStream])

    React.useEffect(() => {
        const sp = new URLSearchParams(location.search)
        const dpi = sp.get('dpi') || ''
        const phone = sp.get('phone') || ''
        const name = sp.get('name') || ''
        const origin = sp.get('origin') || ''
        const topicParam = sp.get('topic') || '' // puede ser id o code

        if (dpi) setValue('dpi', dpi)
        if (phone) setValue('phone', phone)
        if (name) setValue('name', name)
        if (origin) setValue('origin', origin)

        if (topicParam) {
            const maybeId = Number(topicParam)
            if (!Number.isNaN(maybeId)) {
                setValue('topic_id', maybeId)
            } else {
                // si topicParam es código (p.ej. TRAM-001) puedes:
                // - dejarlo así (el usuario elige en el Autocomplete), o
                // - hacer una búsqueda para convertir code->id si quieres automatizarlo.
            }
        }
    }, [location.search, setValue])



    // ---- Cámara (MediaDevices)



    const videoRef = React.useRef(null)
    const canvasRef = React.useRef(null)

    // Espera a que el <video> tenga metadata (dimensiones) y empiece a reproducir
    function waitForVideoReady(video) {
        return new Promise((resolve) => {
            const ready = () => {
                if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
                    video.removeEventListener('loadedmetadata', ready)
                    resolve()
                }
            }
            if (video.readyState >= 2 && video.videoWidth && video.videoHeight) return resolve()
            video.addEventListener('loadedmetadata', ready)
        })
    }

    const startCamera = async () => {
        setErrorMsg('')
        setCameraReady(false)
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                setErrorMsg('Este navegador no soporta cámara (MediaDevices).')
                return
            }
            // Nota: funciona solo en https o http://localhost
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'user' },   // usa 'environment' si prefieres cámara trasera en móviles
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            })
            setVideoStream(stream)

            const video = videoRef.current
            if (video) {
                video.srcObject = stream
                video.muted = true
                video.playsInline = true
                await video.play()
                await waitForVideoReady(video)
                setCameraReady(true)
            }
        } catch (e) {
            setErrorMsg('No se pudo acceder a la cámara. Verifica permisos o usa https/localhost.', e.message)
        }
    }


    const stopCamera = () => {
        setCameraReady(false)
        if (videoStream) {
            videoStream.getTracks().forEach(t => t.stop())
            setVideoStream(null)
        }
    }

    const capturePhoto = async () => {
        try {
            setErrorMsg('');
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !video.srcObject) {
                setErrorMsg('Primero inicia la cámara.');
                return;
            }

            // Espera breve si aún no hay dimensiones reales
            let w = video.videoWidth || 0;
            let h = video.videoHeight || 0;
            if (!w || !h) {
                await new Promise(r => setTimeout(r, 120)); // 120ms
                w = video.videoWidth || 640;
                h = video.videoHeight || 480;
            }
            if (!w || !h) {
                setErrorMsg('La cámara aún no está lista. Intenta de nuevo.');
                return;
            }

            // (Opcional) limitar tamaño para reducir peso
            const MAX = 1280; // px
            if (Math.max(w, h) > MAX) {
                const scale = MAX / Math.max(w, h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
            }

            // ¿La cámara es frontal? (para des-espejar)
            let mirror = true;
            try {
                const track = video.srcObject.getVideoTracks()[0];
                const facing = track.getSettings()?.facingMode;
                // si es trasera/environment, no espejar
                if (facing && facing.toLowerCase() === 'environment') mirror = false;
            } catch (e) { e.message }

            // Pintar en canvas
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');

            if (mirror) {
                // Des-espejar horizontalmente
                ctx.translate(w, 0);
                ctx.scale(-1, 1);
            }
            ctx.drawImage(video, 0, 0, w, h);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setPreviewUrl(dataUrl);
            setValue('photo_data_url', dataUrl);
            // stopCamera(); // <- si quieres apagarla después
        } catch (e) {
            setErrorMsg('No fue posible capturar la foto.', e.message);
        }
    };



    // Cargar imagen desde archivo como fallback
    const onSelectFile = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result?.toString() || ''
            setPreviewUrl(dataUrl)
            setValue('photo_data_url', dataUrl)
        }
        reader.readAsDataURL(file)
    }

    // ---- Búsqueda previa (UX) usando /api/visits/search/
    const onSearch = async () => {
        setErrorMsg(''); setInfoMsg('')
        try {
            const dpi = watch('dpi')
            const phone = watch('phone')
            const name = watch('name')
            // topic: si ya elegiste uno, pásalo por id; si no, vacío
            const topicParam = topicId ? String(topicId) : ''
            const data = await searchVisitContext({ dpi, phone, name, topic: topicParam })
            setSearchHint(data)

            // Rellenar si viene citizen
            if (data?.citizen) {
                setValue('name', data.citizen.name || '')
                setValue('phone', data.citizen.phone || '')
                setValue('origin', data.citizen.origin || '')
                setValue('dpi', data.citizen.dpi || '')
                setValue('passport', data.citizen.passport || '')
            }
            // Si trae topic definido y aún no hay topic_id, setéalo
            if (data?.topic?.id && !topicId) setValue('topic_id', data.topic.id)

            // Mensaje de reuse de expediente si viene case
            if (data?.case?.code_persistente) {
                setInfoMsg(`Se reutilizará expediente ${data.case.code_persistente}.`)
            } else if (data?.cases?.length) {
                // si hay varios cases, muestra pista
                setInfoMsg('Hay expedientes previos para este ciudadano/tema.')
            } else {
                setInfoMsg('')
            }
        } catch (e) {
            setErrorMsg('No fue posible realizar la búsqueda.', e.message)
        }
    }

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

    async function openBadgePdf(visitId) {
        const visitsPath = import.meta.env.VITE_VISITS_PATH || '/api/visits/visits/'
        const url = `${visitsPath}${visitId}/badge.pdf/` // ¡barra final!
        const res = await api.get(url, { responseType: 'blob' })
        const blob = new Blob([res.data], { type: 'application/pdf' })
        const pdfUrl = URL.createObjectURL(blob)
        window.open(pdfUrl, '_blank', 'noopener,noreferrer')
    }


    // ---- Guardar (create visit)
    const onSubmit = async (form) => {
        setErrorMsg(''); setInfoMsg('')
        try {
            // 1) Subir foto si existe dataURL
            let photo_path = ''
            if (form.photo_data_url) {
                const photo = await uploadPhotoBase64(
                    form.photo_data_url,
                    `checkin-${(form.dpi || form.passport || 'sinid')}.jpg`
                )
                photo_path = photo?.path || ''
            }

            // 2) Crear visita
            const visit = await createVisit({
                citizen: {
                    dpi: form.dpi,
                    passport: form.passport,
                    name: form.name,
                    phone: form.phone,
                    origin: form.origin
                },
                topic_id: Number(form.topic_id),
                target_unit: form.target_unit,
                reason: form.reason || '',
                photo_path,
                reopen_justification: form.reopen_justification || ''
            })

            // 3) Guardar referencia y feedback
            const badge = visit?.badge_code || 'SIN-COD'
            setLastVisit({ id: visit.id, badge_code: badge })
            setSnack({ open: true, text: `Visita creada. Gafete: ${badge}` })
            setInfoMsg(`Gafete generado: ${badge}. `)

            // (Opcional) abrir automáticamente el PDF
            await openBadgePdf(visit.id)

            // Limpiar solo la foto (si quieres dejar los demás campos)
            setPreviewUrl('')
            setValue('photo_data_url', '')

        } catch (e) {
            console.error('Create visit error:', e?.response?.data)
            setErrorMsg(extractBackendErrors(e))
        }
    }


    const clearForm = () => {
        reset({
            dpi: '', passport: '', name: '', phone: '', origin: '',
            topic_id: undefined, target_unit: '', reason: '', reopen_justification: '', photo_data_url: ''
        })
        setPreviewUrl('')
        setInfoMsg(''); setErrorMsg('')
        if (videoStream) stopCamera()
    }

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Registro de visita (Check-in)</Typography>
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" startIcon={<SearchIcon />} onClick={onSearch}>
                        Buscar
                    </Button>
                    <Button variant="text" startIcon={<RestartAltIcon />} onClick={clearForm}>
                        Limpiar
                    </Button>
                </Stack>
            </Stack>

            {(errorMsg || infoMsg) && (
                <Alert severity={errorMsg ? 'error' : 'info'} sx={{ mb: 2 }}>
                    {errorMsg || infoMsg}
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Grid container spacing={2}>
                    {/* Identificación */}
                    <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>Ciudadano</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="DPI"
                                        {...register('dpi')}
                                        error={!!errors.dpi}
                                        helperText={errors.dpi?.message}
                                        fullWidth
                                        inputProps={{ inputMode: 'numeric' }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Pasaporte"
                                        {...register('passport')}
                                        error={!!errors.passport}
                                        helperText={errors.passport?.message}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Nombre completo"
                                        {...register('name')}
                                        error={!!errors.name}
                                        helperText={errors.name?.message}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Teléfono"
                                        {...register('phone')}
                                        error={!!errors.phone}
                                        helperText={errors.phone?.message}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Procedencia / Comunidad / Municipio"
                                        {...register('origin')}
                                        error={!!errors.origin}
                                        helperText={errors.origin?.message}
                                        fullWidth
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Gestión */}
                    <Grid item xs={12} md={6}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>Gestión</Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Autocomplete
                                        sx={{ minWidth: 350 }}
                                        loading={loadingTemas}
                                        options={temas}
                                        getOptionLabel={(o) => o ? `${o.code} — ${o.name}` : ''}
                                        onChange={(_, val) => setValue('topic_id', val?.id || undefined)}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Tema / Gestión"
                                                error={!!errors.topic_id}
                                                helperText={errors.topic_id?.message}
                                                fullWidth
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Unidad destino"
                                        {...register('target_unit')}
                                        error={!!errors.target_unit}
                                        helperText={errors.target_unit?.message}
                                        fullWidth
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Motivo / Observación"
                                        {...register('reason')}
                                        error={!!errors.reason}
                                        helperText={errors.reason?.message}
                                        fullWidth
                                        multiline minRows={2}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label="Justificación para reabrir expediente (si aplica)"
                                        {...register('reopen_justification')}
                                        error={!!errors.reopen_justification}
                                        helperText={errors.reopen_justification?.message}
                                        fullWidth
                                        multiline minRows={2}
                                    />
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Foto */}
                    <Grid item xs={12}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1">Foto del visitante</Typography>
                                <Stack direction="row" spacing={1}>
                                    <Tooltip title="Iniciar cámara">
                                        <IconButton onClick={startCamera}><PhotoCameraIcon /></IconButton>
                                    </Tooltip>
                                    <Button component="label" variant="outlined">
                                        Cargar imagen…
                                        <input hidden type="file" accept="image/*" onChange={onSelectFile} />
                                    </Button>
                                </Stack>
                            </Stack>

                            <Grid container spacing={2} mt={1}>
                                <Grid item xs={12} md={6}>
                                    <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                    <Stack direction="row" spacing={1} mt={1}>
                                        <Button onClick={capturePhoto} startIcon={<PhotoCameraIcon />} variant="contained">
                                            Capturar
                                        </Button>
                                        {videoStream && (
                                            <Button onClick={stopCamera} variant="outlined">Detener cámara</Button>
                                        )}
                                    </Stack>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body2" color="text.secondary">Preview</Typography>
                                    {previewUrl
                                        ? <img src={previewUrl} alt="preview" style={{ width: '100%', borderRadius: 8, border: '1px solid #e3e8ef' }} />
                                        : <Box sx={{ height: 200, border: '1px dashed #cbd5e1', borderRadius: 2, display: 'grid', placeItems: 'center', color: 'text.secondary' }}>Sin imagen</Box>
                                    }
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" spacing={2}>
                            <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={isSubmitting}>
                                Guardar entrada
                            </Button>

                            {lastVisit?.id && (
                                <PrintBadgeButton
                                    visitId={lastVisit.id}
                                    badgeCode={lastVisit.badge_code}
                                    variant="outlined"
                                />
                            )}
                        </Stack>


                    </Grid>
                </Grid>
            </form>

            <Snackbar
                open={snack.open}
                autoHideDuration={4000}
                onClose={() => setSnack({ open: false, text: '' })}
                message={snack.text}
            />
        </Paper>
    )
}
