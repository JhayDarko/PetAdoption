import { useEffect, useState } from 'react'
import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { AppBar, Box, Button, Chip, Container, CssBaseline, Divider, Stack, Toolbar, Typography } from '@mui/material'
import PetsRoundedIcon from '@mui/icons-material/PetsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import SwitchAccountRoundedIcon from '@mui/icons-material/SwitchAccountRounded'
import { ThemeProvider } from '@mui/material/styles'
import Catalogo from './pages/Catalogo'
import DetalleMascota from './pages/DetalleMascota'
import FormularioSolicitud from './pages/FormularioSolicitud'
import Seguimiento from './pages/Seguimiento'
import Admin from './pages/Admin'
import Login from './pages/Login'
import { theme } from './theme'

function Layout({ children }) {
  const [sesionActiva, setSesionActiva] = useState(() => Boolean(
    sessionStorage.getItem('admin_access_token') || sessionStorage.getItem('guest_access'),
  ))
  useEffect(() => {
    const actualizarSesion = () => setSesionActiva(Boolean(
      sessionStorage.getItem('admin_access_token') || sessionStorage.getItem('guest_access'),
    ))
    window.addEventListener('admin-auth-changed', actualizarSesion)
    return () => window.removeEventListener('admin-auth-changed', actualizarSesion)
  }, [])
  function cambiarAcceso() {
    sessionStorage.removeItem('admin_access_token')
    sessionStorage.removeItem('guest_access')
    window.dispatchEvent(new Event('admin-auth-changed'))
  }
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(18px)', bgcolor: 'rgba(255,255,255,.88)' }}>
        <Toolbar component={Container} maxWidth="lg" sx={{ py: 1.25, gap: { xs: 1, sm: 2 } }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: 'primary.main', color: 'white', boxShadow: '0 8px 18px rgba(33,81,63,.18)' }}>
                <PetsRoundedIcon />
              </Box>
              <Box>
                <Typography fontWeight={850} color="primary.dark" lineHeight={1}>Huellas</Typography>
                <Typography variant="caption" color="secondary.main" fontWeight={800} letterSpacing=".12em">DE ESPERANZA</Typography>
              </Box>
            </Stack>
          </Link>
          <Stack direction="row" spacing={{ xs: 0, sm: 1 }} component="nav" aria-label="Navegación principal">
            <Button component={NavLink} to="/" startIcon={<PetsRoundedIcon />} sx={{ minWidth: 0, px: { xs: 1, sm: 1.5 }, color: 'text.secondary', '&.active': { color: 'primary.main', bgcolor: 'rgba(33,81,63,.08)' } }}>Catálogo</Button>
            <Button component={NavLink} to="/seguimiento" startIcon={<SearchRoundedIcon />} sx={{ minWidth: 0, px: { xs: 1, sm: 1.5 }, color: 'text.secondary', '&.active': { color: 'primary.main', bgcolor: 'rgba(33,81,63,.08)' } }}>Seguimiento</Button>
            {sesionActiva && <Button component={NavLink} to="/admin" startIcon={<AdminPanelSettingsRoundedIcon />} sx={{ minWidth: 0, px: { xs: 1, sm: 1.5 }, color: 'text.secondary', '&.active': { color: 'primary.main', bgcolor: 'rgba(33,81,63,.08)' } }}>Admin</Button>}
            {sesionActiva && <Button onClick={cambiarAcceso} startIcon={<SwitchAccountRoundedIcon />} sx={{ minWidth: 0, px: { xs: 1, sm: 1.5 }, color: 'secondary.dark' }}>Cambiar acceso</Button>}
          </Stack>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>{children}</Container>
      <Box component="footer" sx={{ mt: 8, py: 5, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
            <Box><Typography fontWeight={800} color="primary.dark">Huellas de Esperanza</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>Adopción responsable para una vida llena de compañía.</Typography></Box>
            <Chip label="Cuidar también es adoptar" size="small" sx={{ alignSelf: { xs: 'flex-start', sm: 'center' }, bgcolor: 'rgba(200,107,74,.1)', color: 'secondary.dark', fontWeight: 700 }} />
          </Stack>
          <Divider sx={{ my: 3 }} />
          <Typography variant="caption" color="text.secondary">Catálogo · Solicitudes · Seguimiento</Typography>
        </Container>
      </Box>
    </Box>
  )
}

export default function App() {
  const [sesionActiva, setSesionActiva] = useState(() => Boolean(
    sessionStorage.getItem('admin_access_token') || sessionStorage.getItem('guest_access'),
  ))

  useEffect(() => {
    const actualizarSesion = () => setSesionActiva(Boolean(
      sessionStorage.getItem('admin_access_token') || sessionStorage.getItem('guest_access'),
    ))
    window.addEventListener('admin-auth-changed', actualizarSesion)
    return () => window.removeEventListener('admin-auth-changed', actualizarSesion)
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {sesionActiva ? (
        <Layout>
          <Routes>
            <Route path="/" element={<Catalogo />} />
            <Route path="/mascotas/:id" element={<DetalleMascota />} />
            <Route path="/solicitar/:id" element={<FormularioSolicitud />} />
            <Route path="/seguimiento" element={<Seguimiento />} />
            <Route path="/admin" element={sessionStorage.getItem('admin_access_token') ? <Admin /> : <Navigate to="/" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      ) : <Login />}
    </ThemeProvider>
  )
}

function NotFound() {
  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', textAlign: 'center', py: 10 }}>
      <Typography variant="h3" color="primary.dark">Página no encontrada</Typography>
      <Button component={Link} to="/" variant="contained" color="primary" sx={{ mt: 3 }}>Volver al catálogo</Button>
    </Box>
  )
}
