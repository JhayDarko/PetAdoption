import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import PetsRoundedIcon from '@mui/icons-material/PetsRounded'
import LockRoundedIcon from '@mui/icons-material/LockRounded'
import { loginAdmin } from '../api'

const tokenStorage = 'admin_access_token'
const guestStorage = 'guest_access'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function enviar(evento) {
    evento.preventDefault()
    if (!usuario.trim() || !contrasena) {
      setError('Ingresa tu usuario y contraseña.')
      return
    }

    setCargando(true)
    setError('')
    try {
      const resultado = await loginAdmin(usuario.trim(), contrasena)
      sessionStorage.setItem(tokenStorage, resultado.access_token)
      sessionStorage.removeItem(guestStorage)
      window.dispatchEvent(new Event('admin-auth-changed'))
    } catch (fallo) {
      setError(
        fallo.status === 401
          ? 'El usuario o la contraseña no son válidos.'
          : fallo.status === 503
            ? 'El servicio de autenticación no está configurado.'
            : fallo.detail || 'No fue posible iniciar sesión. Intenta nuevamente.',
      )
    } finally {
      setCargando(false)
    }
  }

  function continuarComoVisitante() {
    sessionStorage.setItem(guestStorage, 'true')
    window.dispatchEvent(new Event('admin-auth-changed'))
  }

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', bgcolor: 'background.default', px: { xs: 1.5, sm: 2 }, py: { xs: 1.5, sm: 3 }, overflowY: 'auto' }}>
      <Container maxWidth="md" disableGutters>
        <Card elevation={0} sx={{ width: '100%', border: '1px solid', borderColor: 'divider', borderRadius: { xs: 3, sm: 5 }, overflow: 'hidden' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            <Box sx={{ p: { xs: 3, sm: 6 }, color: 'white', background: 'linear-gradient(145deg, #173a2d 0%, #21513f 65%, #4d806a 100%)' }}>
              <Box sx={{ width: 56, height: 56, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,.16)', mb: { xs: 3, sm: 5 } }}>
                <PetsRoundedIcon fontSize="large" />
              </Box>
              <Typography variant="overline" sx={{ color: 'rgba(255,255,255,.72)', letterSpacing: '.16em' }}>Huellas de Esperanza</Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 1, lineHeight: 1.08, fontSize: { xs: '2rem', sm: '3rem' } }}>Un hogar puede cambiarlo todo.</Typography>
              <Typography sx={{ mt: 2.5, color: 'rgba(255,255,255,.8)', lineHeight: 1.7 }}>
                Encuentra un compañero, conoce su historia y da el primer paso hacia una adopción responsable.
              </Typography>
              <Stack spacing={1.2} sx={{ mt: { xs: 3, sm: 5 }, color: 'rgba(255,255,255,.88)' }}>
                <Typography variant="body2">✓ Explora mascotas que buscan hogar</Typography>
                <Typography variant="body2">✓ Envía y consulta tus solicitudes</Typography>
                <Typography variant="body2">✓ Acompaña cada adopción con responsabilidad</Typography>
              </Stack>
            </Box>
            <CardContent sx={{ p: { xs: 3, sm: 6 }, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="h4" color="primary.dark" fontWeight={800}>Bienvenido</Typography>
              <Typography color="text.secondary" sx={{ mt: 1, mb: 3, lineHeight: 1.65 }}>
                Ingresa si administras la plataforma o continúa como visitante para conocer nuestro catálogo.
              </Typography>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={enviar}>
                <Stack spacing={2}>
                  <TextField
                    label="Usuario administrador"
                    value={usuario}
                    onChange={(evento) => setUsuario(evento.target.value)}
                    autoComplete="username"
                    autoFocus
                    fullWidth
                  />
                  <TextField
                    label="Contraseña"
                    type="password"
                    value={contrasena}
                    onChange={(evento) => setContrasena(evento.target.value)}
                    autoComplete="current-password"
                    fullWidth
                  />
                  <Button type="submit" variant="contained" size="large" disabled={cargando} startIcon={<LockRoundedIcon />} sx={{ py: 1.4 }}>
                    {cargando ? 'Validando acceso...' : 'Ingresar como administrador'}
                  </Button>
                </Stack>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 3, color: 'text.secondary' }}>
                <Box sx={{ height: '1px', flex: 1, bgcolor: 'divider' }} />
                <Typography variant="caption">o</Typography>
                <Box sx={{ height: '1px', flex: 1, bgcolor: 'divider' }} />
              </Box>
              <Button variant="outlined" size="large" onClick={continuarComoVisitante} sx={{ py: 1.3 }}>
                Explorar como visitante
              </Button>
              <Typography align="center" variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                No necesitas una cuenta para consultar las mascotas disponibles.
              </Typography>
            </CardContent>
          </Box>
        </Card>
      </Container>
    </Box>
  )
}
