import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { obtenerMascota, seguimiento } from '../api'
import { AvisoServidor, Cargando, ErrorPeticion } from '../components/EstadoPeticion'

export default function Seguimiento() {
  const ubicacion = useLocation()
  const [documento, setDocumento] = useState(new URLSearchParams(ubicacion.search).get('documento') || '')
  const [solicitudes, setSolicitudes] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [lenta, setLenta] = useState(false)

  useEffect(() => { if (new URLSearchParams(ubicacion.search).get('documento')) consultar() }, [])
  async function consultar(evento) {
    evento?.preventDefault()
    if (!documento.trim()) return setError(new Error('Escribe tu número de documento.'))
    setCargando(true); setError(null); setSolicitudes(null); setLenta(false)
    const temporizador = setTimeout(() => setLenta(true), 8000)
    try {
      const resultados = await seguimiento(documento.trim())
      const solicitudesConMascota = await Promise.all(resultados.map(async (solicitud) => {
        try {
          const mascota = await obtenerMascota(solicitud.mascota_id)
          return { ...solicitud, mascota_nombre: mascota.nombre }
        } catch {
          return solicitud
        }
      }))
      setSolicitudes(solicitudesConMascota)
    } catch (fallo) { setError(fallo) } finally { clearTimeout(temporizador); setCargando(false); setLenta(false) }
  }

  return <section className="mx-auto max-w-3xl">
    <div className="rounded-3xl bg-bosque p-8 text-white sm:p-10"><h1 className="text-3xl font-bold">Seguimiento de solicitudes</h1><p className="mt-3 text-emerald-50">Consulta el estado de tus solicitudes con tu número de documento.</p>
      <form onSubmit={consultar} className="mt-6 flex flex-col gap-3 sm:flex-row"><input value={documento} onChange={(e) => setDocumento(e.target.value)} placeholder="Número de documento" className="flex-1 rounded-xl border-0 px-4 py-3 text-slate-800 outline-none" /><button className="rounded-xl bg-terracota px-5 py-3 font-semibold text-white hover:bg-orange-700">Consultar</button></form>
    </div>
    <div className="mt-8">{cargando && <Cargando texto="Consultando tus solicitudes..." />}{lenta && <AvisoServidor />}{error && <ErrorPeticion error={error} />}{!cargando && !error && solicitudes && solicitudes.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">No encontramos solicitudes para ese documento.</p>}{solicitudes?.length > 0 && <div className="space-y-4">{solicitudes.map((solicitud) => <div key={solicitud.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><span className="font-semibold text-bosque">Solicitud para mascota {solicitud.mascota_nombre || 'la mascota seleccionada'}</span><Estado estado={solicitud.estado} /></div><p className="mt-3 text-sm text-slate-500">Registrada: {new Date(solicitud.created_at).toLocaleString('es-CO')}</p>{solicitud.motivo_decision && <p className="mt-2 text-sm text-slate-600">Decisión: {solicitud.motivo_decision}</p>}</div>)}</div>}</div>
  </section>
}

function Estado({ estado }) { const colores = { pendiente: 'bg-amber-100 text-amber-800', aprobada: 'bg-emerald-100 text-emerald-800', rechazada: 'bg-red-100 text-red-800' }; return <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${colores[estado] || 'bg-slate-100 text-slate-700'}`}>{estado}</span> }
