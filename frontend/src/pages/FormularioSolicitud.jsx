import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { crearSolicitud, obtenerMascota } from '../api'
import { AvisoServidor, Cargando, ErrorPeticion, mensajeError } from '../components/EstadoPeticion'
import { usePeticion } from '../components/usePeticion'

const inicial = { nombre_solicitante: '', documento: '', email: '', telefono: '', direccion: '', tipo_vivienda: '', motivo: '' }

export default function FormularioSolicitud() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [formulario, setFormulario] = useState(inicial)
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [lenta, setLenta] = useState(false)
  const cargar = useCallback(() => obtenerMascota(id), [id])
  const mascota = usePeticion(cargar, [cargar])

  function cambiar(evento) { setFormulario({ ...formulario, [evento.target.name]: evento.target.value }); setErrores({ ...errores, [evento.target.name]: '' }) }
  function validar() {
    const nuevos = {}
    if (formulario.nombre_solicitante.trim().length < 3) nuevos.nombre_solicitante = 'Escribe al menos 3 caracteres.'
    if (formulario.documento.trim().length < 5) nuevos.documento = 'Escribe al menos 5 caracteres.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.email)) nuevos.email = 'Ingresa un correo válido.'
    if (formulario.motivo.trim().length < 20) nuevos.motivo = 'Cuéntanos un poco más: mínimo 20 caracteres.'
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }
  async function enviar(evento) {
    evento.preventDefault()
    if (!validar()) return
    setEnviando(true); setError(null); setLenta(false)
    const temporizador = setTimeout(() => setLenta(true), 8000)
    try {
      await crearSolicitud({ ...formulario, mascota_id: id, tipo_vivienda: formulario.tipo_vivienda || null })
      navegar(`/seguimiento?documento=${encodeURIComponent(formulario.documento)}`, { state: { enviado: true } })
    } catch (fallo) { setError(fallo) } finally { clearTimeout(temporizador); setEnviando(false); setLenta(false) }
  }

  if (mascota.cargando) return <Cargando texto="Cargando formulario..." />
  if (mascota.error) return <ErrorPeticion error={mascota.error} />
  if (mascota.datos?.estado === 'adoptada') return <ErrorPeticion error={{ status: 409, detail: 'Esta mascota ya fue adoptada.' }} />

  return (
    <section className="mx-auto max-w-3xl">
      <Link to={`/mascotas/${id}`} className="text-sm font-semibold text-hoja">← Volver a {mascota.datos.nombre}</Link>
      <div className="mt-4 rounded-3xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-bosque">Solicitar adopción</h1>
        <p className="mt-2 text-slate-600">Completa tus datos para iniciar la solicitud de adopción de <strong>{mascota.datos.nombre}</strong>.</p>
        {error && <div className="mt-6"><ErrorPeticion error={error} /></div>}
        {lenta && <AvisoServidor />}
        <form onSubmit={enviar} className="mt-8 grid gap-5 sm:grid-cols-2">
          <Campo nombre="nombre_solicitante" etiqueta="Nombre completo" valor={formulario.nombre_solicitante} cambiar={cambiar} error={errores.nombre_solicitante} requerido />
          <Campo nombre="documento" etiqueta="Documento" valor={formulario.documento} cambiar={cambiar} error={errores.documento} requerido />
          <Campo nombre="email" etiqueta="Correo electrónico" tipo="email" valor={formulario.email} cambiar={cambiar} error={errores.email} requerido />
          <Campo nombre="telefono" etiqueta="Teléfono" valor={formulario.telefono} cambiar={cambiar} />
          <Campo nombre="direccion" etiqueta="Dirección" valor={formulario.direccion} cambiar={cambiar} />
          <label className="text-sm font-semibold text-slate-700">Tipo de vivienda<select name="tipo_vivienda" value={formulario.tipo_vivienda} onChange={cambiar} className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal"><option value="">Selecciona una opción</option><option value="casa">Casa</option><option value="apartamento">Apartamento</option><option value="finca">Finca</option></select></label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Motivo de adopción<textarea name="motivo" value={formulario.motivo} onChange={cambiar} rows="5" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-hoja" />{errores.motivo && <span className="mt-1 block text-xs font-normal text-red-700">{errores.motivo}</span>}</label>
          <button disabled={enviando} className="rounded-xl bg-terracota px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">{enviando ? 'Enviando solicitud...' : 'Enviar solicitud'}</button>
          {error?.status && <p className="text-sm text-slate-500 sm:col-span-2">{mensajeError(error)}</p>}
        </form>
      </div>
    </section>
  )
}

function Campo({ nombre, etiqueta, valor, cambiar, error, tipo = 'text', requerido }) {
  return <label className="text-sm font-semibold text-slate-700">{etiqueta}<input name={nombre} type={tipo} value={valor} onChange={cambiar} required={requerido} className={`mt-2 w-full rounded-xl border px-3 py-3 font-normal outline-none focus:border-hoja ${error ? 'border-red-400' : 'border-slate-200'}`} />{error && <span className="mt-1 block text-xs font-normal text-red-700">{error}</span>}</label>
}
