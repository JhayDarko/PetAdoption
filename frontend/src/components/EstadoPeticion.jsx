import { Alert, Box, CircularProgress, Button, Typography } from '@mui/material'

export function Cargando({ texto = 'Cargando...' }) {
  return <Box sx={{ py: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}><CircularProgress size={24} color="primary" /><Typography color="text.secondary">{texto}</Typography></Box>
}

export function ErrorPeticion({ error, reintentar }) {
  return (
    <Alert severity="error" action={reintentar && <Button color="inherit" size="small" onClick={reintentar}>Reintentar</Button>}>{mensajeError(error)}</Alert>
  )
}

export function AvisoServidor() {
  return <Alert severity="warning" sx={{ mt: 2 }}>El servidor está despertando, intenta de nuevo.</Alert>
}

export function mensajeError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.status === 404) return 'No encontramos lo que buscas.'
  if (error.status === 409) return error.detail || 'La solicitud tiene un conflicto de negocio.'
  if (error.status === 503) return 'El servicio no está disponible en este momento.'
  return error.detail || 'No fue posible completar la solicitud.'
}
