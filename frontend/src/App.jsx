import { useEffect, useState } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { AppBar, Box, Button, Container, CssBaseline, Stack, Toolbar, Typography } from '@mui/material'
import PetsRoundedIcon from '@mui/icons-material/PetsRounded'
import SearchRoundedIcon from '@mui/icons-material/SearchRounded'
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import { ThemeProvider } from '@mui/material/styles'
import Catalogo from './pages/Catalogo'
import DetalleMascota from './pages/DetalleMascota'
import FormularioSolicitud from './pages/FormularioSolicitud'
import Seguimiento from './pages/Seguimiento'
import Admin from './pages/Admin'
import Login from './pages/Login'
import { theme } from './theme'

function Layout({ children }) {
  const [sesionActiva, setSesionActiva] = useState(() => Boolean(sessionStorage.getItem('admin_access_token')))
  useEffect(() => {
    const actualizarSesion = () => setSesionActiva(Boolean(
      sessionStorage.getItem('admin_access_token') || sessionStorage.getItem('guest_access'),
    ))
    window.addEventListener('admin-auth-changed', actualizarSesion)
    return () => window.removeEventListener('admin-auth-changed', actualizarSesion)
  }, [])
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', backdropFilter: 'blur(14px)', bgcolor: 'rgba(255,255,255,.9)' }}>
        <Toolbar component={Container} maxWidth="lg" sx={{ py: 1, gap: 2 }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 3, bgcolor: 'primary.main', color: 'white' }}>
                <PetsRoundedIcon />
              </Box>
              <Box>
                <Typography fontWeight={800} color="primary.dark" lineHeight={1}>Huellas</Typography>
                <Typography variant="caption" color="secondary.main" fontWeight={700}>DE ESPERANZA</Typography>
              </Box>
            </Stack>
          </Link>
          <Stack direction="row" spacing={1} component="nav" aria-label="Navegación principal">
            <Button component={NavLink} to="/" startIcon={<PetsRoundedIcon />} sx={{ color: 'text.secondary', '&.active': { color: 'primary.main', bgcolor: 'primary.50' } }}>Catálogo</Button>
            <Button component={NavLink} to="/seguimiento" startIcon={<SearchRoundedIcon />} sx={{ color: 'text.secondary', '&.active': { color: 'primary.main', bgcolor: 'primary.50' } }}>Seguimiento</Button>
            {sesionActiva && <Button component={NavLink} to="/admin" startIcon={<AdminPanelSettingsRoundedIcon />} sx={{ color: 'text.secondary', '&.active': { color: 'primary.main', bgcolor: 'primary.50' } }}>Admin</Button>}
          </Stack>
        </Toolbar>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ flex: 1, py: { xs: 3, md: 5 } }}>{children}</Container>
      <Box component="footer" sx={{ mt: 6, py: 4, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Container maxWidth="lg"><Typography variant="body2" color="text.secondary"><strong>Huellas de Esperanza</strong> · Adopción responsable para una vida llena de compañía.</Typography></Container>
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
            <Route path="/admin" element={<Admin />} />
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
