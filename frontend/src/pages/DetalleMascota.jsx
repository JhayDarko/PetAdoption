import { useCallback } from 'react'
import { Alert, Box, Button, Grid, Paper, Stack, Typography } from '@mui/material'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { obtenerMascota } from '../api'
import { AvisoServidor, Cargando, ErrorPeticion } from '../components/EstadoPeticion'
import { usePeticion } from '../components/usePeticion'
import { EtiquetaEspecie, EtiquetaEstado } from '../components/EtiquetaEstado'

const imagenReemplazo = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1000&q=80'

export default function DetalleMascota() {
  const { id } = useParams()
  const navegar = useNavigate()
  const cargar = useCallback(() => obtenerMascota(id), [id])
  const { cargando, datos: mascota, error, lenta } = usePeticion(cargar, [cargar])

  if (cargando) return <Cargando texto="Cargando información de la mascota..." />
  if (error) return <><ErrorPeticion error={error} reintentar={() => navegar(0)} />{lenta && <AvisoServidor />}</>

  return (
    <Box>
      {lenta && <AvisoServidor />}
      <Button component={Link} to="/" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2 }}>Volver al catálogo</Button>
      <Paper sx={{ overflow: 'hidden' }}>
        <Grid container>
          <Grid item xs={12} md={6}><Box component="img" src={mascota.foto_url || imagenReemplazo} alt={`Foto de ${mascota.nombre}`} sx={{ width: '100%', height: { xs: 260, sm: 320, md: 390 }, objectFit: 'cover', display: 'block' }} /></Grid>
          <Grid item xs={12} md={6} sx={{ p: { xs: 3, md: 5 } }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <EtiquetaEstado estado={mascota.estado} />
              <EtiquetaEspecie especie={mascota.especie} />
            </Stack>
            <Typography variant="h2" sx={{ mt: 2, color: 'primary.dark', fontSize: { xs: '2.5rem', md: '3.5rem' } }}>{mascota.nombre}</Typography>
            <Typography color="secondary.main" fontWeight={700} sx={{ mt: 1, textTransform: 'capitalize' }}>{mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}</Typography>
            <Grid container spacing={1.5} sx={{ mt: 3 }}>
              <Dato titulo="Sexo" valor={mascota.sexo || 'No especificado'} />
              <Dato titulo="Edad" valor={edadTexto(mascota.edad_meses)} />
              <Dato titulo="Tamaño" valor={mascota.tamano || 'No especificado'} />
            </Grid>
            <Typography color="text.secondary" sx={{ mt: 4, lineHeight: 1.8 }}>{mascota.descripcion || 'Esta mascota está esperando una familia que le brinde amor y cuidado.'}</Typography>
            {mascota.estado !== 'adoptada' ? <Button component={Link} to={`/solicitar/${mascota.id}`} variant="contained" color="secondary" size="large" startIcon={<FavoriteRoundedIcon />} fullWidth sx={{ mt: 4 }}>Solicitar adopción</Button> : <Alert severity="info" sx={{ mt: 4 }}>Esta mascota ya encontró un hogar.</Alert>}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

function Dato({ titulo, valor }) {
  return <Grid item xs={12} sm={4}><Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 2 }}><Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase' }}>{titulo}</Typography><Typography fontWeight={700} color="primary.dark" sx={{ mt: .5, textTransform: 'capitalize' }}>{valor}</Typography></Box></Grid>
}

function edadTexto(meses) {
  if (meses === null || meses === undefined) return 'No especificada'
  if (meses < 12) return `${meses} meses`
  return `${Math.floor(meses / 12)} años`
}
