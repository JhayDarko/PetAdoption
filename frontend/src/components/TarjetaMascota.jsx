import { Box, Button, Card, CardActionArea, CardContent, CardMedia, Stack, Typography } from '@mui/material'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Link } from 'react-router-dom'
import { EtiquetaEspecie } from './EtiquetaEstado'

const imagenReemplazo = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=800&q=80'

export default function TarjetaMascota({ mascota }) {
  return (
    <Card sx={{ height: '100%', overflow: 'hidden', transition: 'transform .25s, box-shadow .25s', '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 18px 34px rgba(23,58,45,.14)' } }}>
      <CardActionArea component={Link} to={`/mascotas/${mascota.id}`} sx={{ height: '100%' }}>
        <Box sx={{ position: 'relative' }}>
          <CardMedia component="img" height="175" image={mascota.foto_url || imagenReemplazo} alt={`Foto de ${mascota.nombre}`} sx={{ objectFit: 'cover' }} />
          <Typography variant="caption" sx={{ position: 'absolute', left: 12, bottom: 10, px: 1.2, py: .45, borderRadius: 10, color: 'white', bgcolor: 'rgba(23,58,45,.78)', backdropFilter: 'blur(6px)', fontWeight: 700 }}>Disponible</Typography>
        </Box>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Typography variant="h6" color="primary.dark" sx={{ lineHeight: 1.2 }}>{mascota.nombre}</Typography>
            <EtiquetaEspecie especie={mascota.especie} />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: .75, minHeight: 20 }}>{edadTexto(mascota.edad_meses)} · {mascota.raza || 'Compañero mestizo'}</Typography>
          <Button fullWidth size="small" endIcon={<ArrowForwardRoundedIcon />} sx={{ mt: 1.5, justifyContent: 'space-between', bgcolor: 'rgba(33,81,63,.07)', color: 'primary.main', '&:hover': { bgcolor: 'rgba(33,81,63,.13)' } }}>Ver perfil</Button>
        </CardContent>
      </CardActionArea>
    </Card>
  )
}

function edadTexto(meses) {
  if (meses === null || meses === undefined) return 'Edad no especificada'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const años = Math.floor(meses / 12)
  const restantes = meses % 12
  return `${años} ${años === 1 ? 'año' : 'años'}${restantes ? ` y ${restantes} meses` : ''}`
}
