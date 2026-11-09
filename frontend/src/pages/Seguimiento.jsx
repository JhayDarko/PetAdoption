import { useEffect, useState } from 'react'
import { Alert, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { useLocation } from 'react-router-dom'
import { obtenerMascota, seguimiento } from '../api'
import { AvisoServidor, Cargando, ErrorPeticion } from '../components/EstadoPeticion'
import { EtiquetaEstado } from '../components/EtiquetaEstado'

export default function Seguimiento() {
  const ubicacion = useLocation()
  const [documento, setDocumento] = useState(new URLSearchParams(ubicacion.search).get('documento') || '')
  const [solicitudes, setSolicitudes] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [lenta, setLenta] = useState(false)

  useEffect(() => { if (new URLSearchParams(ubicacion.search).get('documento')) consultar() }, [])
  async function consultar(evento) {
    evento?.preventDefault()
    if (!documento.trim()) return setError(new Error('Escribe tu número de documento.'))
    setCargando(true); setError(null); setSolicitudes(null); setLenta(false)
    const temporizador = setTimeout(() => setLenta(true), 8000)
    try {
      const resultados = await seguimiento(documento.trim())
      setSolicitudes(await Promise.all(resultados.map(async (solicitud) => {
        try { return { ...solicitud, mascota_nombre: (await obtenerMascota(solicitud.mascota_id)).nombre } } catch { return solicitud }
      })))
    } catch (fallo) { setError(fallo) } finally { clearTimeout(temporizador); setCargando(false); setLenta(false) }
  }

  return <section>
    <Paper sx={{ p: { xs: 3, md: 5 }, mb: 4, color: 'white', bgcolor: 'primary.dark' }}>
      <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>Seguimiento de solicitudes</Typography>
      <Typography sx={{ mt: 1, color: 'rgba(255,255,255,.78)' }}>Consulta el estado de tu proceso con tu número de documento.</Typography>
      <form onSubmit={consultar}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
          <TextField fullWidth value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Número de documento" sx={{ bgcolor: 'white', borderRadius: 1 }} />
          <Button type="submit" variant="contained" color="secondary" startIcon={<SearchRoundedIcon />} sx={{ minWidth: 150 }}>Consultar</Button>
        </Stack>
      </form>
    </Paper>
    {cargando && <Cargando texto="Consultando tus solicitudes..." />}{lenta && <AvisoServidor />}{error && <ErrorPeticion error={error} />}
    {!cargando && !error && solicitudes && solicitudes.length === 0 && <Alert severity="info">No encontramos solicitudes para ese documento.</Alert>}
    {solicitudes?.length > 0 && <Stack spacing={2}>{solicitudes.map((solicitud) => <Paper key={solicitud.id} sx={{ p: 2.5 }}><Stack direction="row" justifyContent="space-between" alignItems="center" gap={2}><Typography fontWeight={700} color="primary.dark">Solicitud para {solicitud.mascota_nombre || 'la mascota seleccionada'}</Typography><EtiquetaEstado estado={solicitud.estado} /></Stack><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Registrada: {new Date(solicitud.created_at).toLocaleString('es-CO')}</Typography>{solicitud.motivo_decision && <Typography variant="body2" sx={{ mt: 1 }}>Decisión: {solicitud.motivo_decision}</Typography>}</Paper>)}</Stack>}
  </section>
}
