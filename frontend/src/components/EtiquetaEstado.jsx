import { Chip } from '@mui/material'

const estilos = {
  disponible: { label: 'Disponible', bg: '#e8f4ee', color: '#216044', border: '#b9dfc9' },
  adoptada: { label: 'Adoptada', bg: '#eef1f0', color: '#596963', border: '#d6dfdb' },
  pendiente: { label: 'Pendiente', bg: '#fff5df', color: '#91651d', border: '#f1d89e' },
  aprobada: { label: 'Aprobada', bg: '#e8f4ee', color: '#216044', border: '#b9dfc9' },
  rechazada: { label: 'Rechazada', bg: '#fceceb', color: '#a0443e', border: '#efc3bf' },
}

export function EtiquetaEstado({ estado, compact = false }) {
  const estilo = estilos[estado] || { label: estado || 'Sin estado', bg: '#f2f4f3', color: '#5d6b66', border: '#dce3e0' }
  return (
    <Chip
      label={estilo.label}
      size={compact ? 'small' : 'medium'}
      sx={{
        height: compact ? 26 : 30,
        borderRadius: 2,
        bgcolor: estilo.bg,
        color: estilo.color,
        border: `1px solid ${estilo.border}`,
        fontWeight: 800,
        fontSize: compact ? '0.72rem' : '0.78rem',
        letterSpacing: '.01em',
        '& .MuiChip-label': { px: compact ? 1.15 : 1.4 },
      }}
    />
  )
}

export function EtiquetaEspecie({ especie }) {
  const nombres = { perro: 'Perro', gato: 'Gato', otro: 'Otro' }
  return (
    <Chip
      label={nombres[especie] || especie}
      size="small"
      sx={{
        height: 26,
        borderRadius: 2,
        bgcolor: '#edf3f1',
        color: 'primary.dark',
        border: '1px solid #cfe0d9',
        fontWeight: 800,
        fontSize: '0.72rem',
        '& .MuiChip-label': { px: 1.15 },
      }}
    />
  )
}
