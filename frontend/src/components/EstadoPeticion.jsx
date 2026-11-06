export function Cargando({ texto = 'Cargando...' }) {
  return <p className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">{texto}</p>
}

export function ErrorPeticion({ error, reintentar }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
      <p className="font-semibold">{mensajeError(error)}</p>
      {reintentar && <button onClick={reintentar} className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Intentar de nuevo</button>}
    </div>
  )
}

export function AvisoServidor() {
  return <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">El servidor está despertando, intenta de nuevo.</p>
}

export function mensajeError(error) {
  if (!error) return 'Ocurrió un error inesperado.'
  if (error.status === 404) return 'No encontramos lo que buscas.'
  if (error.status === 409) return error.detail || 'La solicitud tiene un conflicto de negocio.'
  if (error.status === 503) return 'El servicio no está disponible en este momento.'
  return error.detail || 'No fue posible completar la solicitud.'
}
