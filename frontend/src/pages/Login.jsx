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

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="sm">
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 5, overflow: 'hidden' }}>
          <Box sx={{ px: { xs: 3, sm: 6 }, pt: { xs: 4, sm: 6 }, pb: 3, color: 'white', background: 'linear-gradient(135deg, #173a2d 0%, #21513f 65%, #4d806a 100%)' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 52, height: 52, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: 'rgba(255,255,255,.16)' }}>
                <PetsRoundedIcon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800}>Huellas de Esperanza</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.78)' }}>Adopción responsable</Typography>
              </Box>
            </Stack>
          </Box>
          <CardContent component="form" onSubmit={enviar} sx={{ p: { xs: 3, sm: 6 } }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center" color="primary.main">
                <LockRoundedIcon fontSize="small" />
                <Typography variant="overline" fontWeight={800}>Acceso administrativo</Typography>
              </Stack>
              <Typography variant="h4" color="primary.dark" fontWeight={800}>Inicia sesión</Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Ingresa para administrar mascotas y solicitudes de adopción.
              </Typography>
            </Stack>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Stack spacing={2.2}>
              <TextField
                label="Usuario"
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
              <Button type="submit" variant="contained" size="large" disabled={cargando} sx={{ py: 1.4 }}>
                {cargando ? 'Validando acceso...' : 'Ingresar al panel'}
              </Button>
            </Stack>
          </CardContent>
        </Card>
        <Typography align="center" variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          El acceso está protegido y requiere un usuario administrador.
        </Typography>
      </Container>
    </Box>
  )
}
