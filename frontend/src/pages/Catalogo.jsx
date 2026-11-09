import { useCallback, useState } from 'react'
import { Box, Chip, FormControl, Grid, InputAdornment, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import { listarMascotas } from '../api'
import { AvisoServidor, Cargando, ErrorPeticion } from '../components/EstadoPeticion'
import { usePeticion } from '../components/usePeticion'
import TarjetaMascota from '../components/TarjetaMascota'

export default function Catalogo() {
  const [especie, setEspecie] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const cargar = useCallback(() => listarMascotas({ especie, q: busqueda }), [especie, busqueda])
  const { cargando, datos, error, lenta } = usePeticion(cargar, [cargar])

  return (
    <section>
      <Box sx={{ mb: 4, p: { xs: 3, md: 6 }, borderRadius: 5, color: 'white', bgcolor: 'primary.dark', position: 'relative', overflow: 'hidden', '&:after': { content: '""', position: 'absolute', width: 280, height: 280, borderRadius: '50%', bgcolor: 'secondary.main', opacity: .25, right: -80, bottom: -120 } }}>
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 680 }}>
          <Chip label="ADOPTA CON AMOR" size="small" sx={{ bgcolor: 'rgba(255,255,255,.14)', color: 'white', fontWeight: 800, letterSpacing: 1 }} />
          <Typography variant="h1" sx={{ mt: 2, fontSize: { xs: '2.5rem', md: '4.5rem' } }}>Un hogar cambia dos vidas.</Typography>
          <Typography sx={{ mt: 2, color: 'rgba(255,255,255,.82)', fontSize: { md: '1.1rem' }, maxWidth: 560 }}>Conoce a los animales que esperan una familia responsable, paciente y llena de cariño.</Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 3, flexWrap: 'wrap', gap: 1 }}><Chip label="Adopción responsable" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,.12)' }} /><Chip label="Compañía para siempre" sx={{ color: 'white', bgcolor: 'rgba(255,255,255,.12)' }} /></Stack>
        </Box>
      </Box>
      <Paper sx={{ mb: 4, p: 2.5, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={5} md={4}><FormControl fullWidth size="small"><InputLabel>Tipo de mascota</InputLabel><Select value={especie} label="Tipo de mascota" onChange={(e) => setEspecie(e.target.value)} sx={{ minWidth: { sm: 180 } }}><MenuItem value="">Todas</MenuItem><MenuItem value="perro">Perros</MenuItem><MenuItem value="gato">Gatos</MenuItem><MenuItem value="otro">Otros</MenuItem></Select></FormControl></Grid>
          <Grid item xs={12} sm={8}><TextField fullWidth label="Buscar por nombre" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. Luna" InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" /></InputAdornment> }} /></Grid>
        </Grid>
      </Paper>
      {lenta && <AvisoServidor />}
      {cargando && <Cargando texto="Buscando mascotas disponibles..." />}
      {!cargando && error && <ErrorPeticion error={error} reintentar={cargar} />}
      {!cargando && !error && datos?.length === 0 && <Paper sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">No encontramos mascotas con esos filtros.</Typography></Paper>}
      {!cargando && !error && datos?.length > 0 && <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 2, md: 2.5 } }}>{datos.map((mascota) => <TarjetaMascota key={mascota.id} mascota={mascota} />)}</Box>}
    </section>
  )
}
