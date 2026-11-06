const mascotasUrl = import.meta.env.VITE_API_MASCOTAS_URL || 'http://127.0.0.1:8001'
const adopcionesUrl = import.meta.env.VITE_API_ADOPCIONES_URL || 'http://127.0.0.1:8002'

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    headers: { Accept: 'application/json', ...opciones.headers },
    ...opciones,
  })

  if (!respuesta.ok) {
    let detalle = 'No fue posible completar la solicitud.'
    try {
      const cuerpo = await respuesta.json()
      detalle = cuerpo.detail || detalle
    } catch {
      // Algunas respuestas de error no contienen JSON.
    }
    const error = new Error(detalle)
    error.status = respuesta.status
    error.detail = detalle
    throw error
  }

  if (respuesta.status === 204) return null
  return respuesta.json()
}

export function listarMascotas(filtros = {}) {
  const parametros = new URLSearchParams()
  Object.entries({ estado: 'disponible', limit: 100, ...filtros }).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') parametros.set(clave, valor)
  })
  return solicitar(`${mascotasUrl}/mascotas?${parametros}`)
}

export function obtenerMascota(id) {
  return solicitar(`${mascotasUrl}/mascotas/${id}`)
}

export function crearSolicitud(datos) {
  return solicitar(`${adopcionesUrl}/solicitudes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
}

export function seguimiento(documento) {
  const parametros = new URLSearchParams({ documento })
  return solicitar(`${adopcionesUrl}/solicitudes/seguimiento?${parametros}`)
}

function opcionesAdmin(opciones = {}) {
  const clave = sessionStorage.getItem('admin_api_key') || ''
  return {
    ...opciones,
    headers: {
      ...opciones.headers,
      'X-API-Key': clave,
    },
  }
}

export function listarMascotasAdmin() {
  const parametros = new URLSearchParams({ limit: '100' })
  return solicitar(`${mascotasUrl}/mascotas?${parametros}`, opcionesAdmin())
}

export function crearMascota(datos) {
  return solicitar(`${mascotasUrl}/mascotas`, opcionesAdmin({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  }))
}

export function editarMascota(id, datos) {
  return solicitar(`${mascotasUrl}/mascotas/${id}`, opcionesAdmin({
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  }))
}

export function eliminarMascota(id) {
  return solicitar(`${mascotasUrl}/mascotas/${id}`, opcionesAdmin({ method: 'DELETE' }))
}

export function listarSolicitudes(filtros = {}) {
  const parametros = new URLSearchParams({ limit: '100' })
  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') parametros.set(clave, valor)
  })
  return solicitar(`${adopcionesUrl}/solicitudes?${parametros}`, opcionesAdmin())
}

export function aprobarSolicitud(id) {
  return solicitar(`${adopcionesUrl}/solicitudes/${id}/aprobar`, opcionesAdmin({ method: 'PATCH' }))
}

export function rechazarSolicitud(id, motivo_decision) {
  return solicitar(`${adopcionesUrl}/solicitudes/${id}/rechazar`, opcionesAdmin({
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ motivo_decision }),
  }))
}
