import { useEffect, useState } from 'react'

export function usePeticion(accion, dependencias = []) {
  const [estado, setEstado] = useState({ cargando: true, datos: null, error: null, lenta: false })

  useEffect(() => {
    let activa = true
    const temporizador = setTimeout(() => {
      if (activa) setEstado((actual) => ({ ...actual, lenta: true }))
    }, 8000)

    setEstado({ cargando: true, datos: null, error: null, lenta: false })
    accion()
      .then((datos) => activa && setEstado({ cargando: false, datos, error: null, lenta: false }))
      .catch((error) => activa && setEstado({ cargando: false, datos: null, error, lenta: false }))
      .finally(() => clearTimeout(temporizador))

    return () => {
      activa = false
      clearTimeout(temporizador)
    }
  // La acción se estabiliza en cada vista mediante dependencias explícitas.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencias)

  return estado
}
