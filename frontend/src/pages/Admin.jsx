import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  aprobarSolicitud,
  crearMascota,
  editarMascota,
  eliminarMascota,
  listarMascotasAdmin,
  listarSolicitudes,
  rechazarSolicitud,
} from '../api'
import { AvisoServidor, Cargando, ErrorPeticion, mensajeError } from '../components/EstadoPeticion'

const claveStorage = 'admin_api_key'
const mascotaInicial = {
  nombre: '', especie: 'perro', raza: '', sexo: '', edad_meses: '', tamano: '',
  descripcion: '', foto_url: '',
}

export default function Admin() {
  const [clave, setClave] = useState(() => sessionStorage.getItem(claveStorage) || '')
  const [claveIngresada, setClaveIngresada] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [pestana, setPestana] = useState('mascotas')

  function iniciarSesion(evento) {
    evento.preventDefault()
    if (!claveIngresada.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingresa la clave de administrador.' })
      return
    }
    sessionStorage.setItem(claveStorage, claveIngresada.trim())
    setClave(claveIngresada.trim())
    setClaveIngresada('')
    setMensaje(null)
  }

  function cerrarSesion() {
    sessionStorage.removeItem(claveStorage)
    setClave('')
    setMensaje({ tipo: 'info', texto: 'Sesión cerrada.' })
  }

  function perderSesion() {
    sessionStorage.removeItem(claveStorage)
    setClave('')
    setMensaje({ tipo: 'error', texto: 'La clave no es válida o la sesión expiró. Ingresa una clave válida.' })
  }

  if (!clave) {
    return (
      <section className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-bosque">Panel administrativo</h1>
        <p className="mt-2 text-slate-600">Ingresa la clave de administrador para continuar.</p>
        {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
        <form onSubmit={iniciarSesion} className="mt-6">
          <label className="text-sm font-semibold text-slate-700">
            Clave de API
            <input
              type="password"
              value={claveIngresada}
              onChange={(evento) => setClaveIngresada(evento.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-hoja"
              autoComplete="current-password"
            />
          </label>
          <button className="mt-5 w-full rounded-xl bg-bosque px-5 py-3 font-semibold text-white hover:bg-hoja">
            Ingresar
          </button>
        </form>
      </section>
    )
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-hoja">Administración</p>
          <h1 className="mt-1 text-3xl font-bold text-bosque">Panel administrativo</h1>
        </div>
        <button onClick={cerrarSesion} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-terracota hover:text-terracota">
          Cerrar sesión
        </button>
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      <div className="mt-8 flex gap-2 border-b border-slate-200">
        <button onClick={() => setPestana('mascotas')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${pestana === 'mascotas' ? 'border-terracota text-terracota' : 'border-transparent text-slate-500'}`}>
          Mascotas
        </button>
        <button onClick={() => setPestana('solicitudes')} className={`border-b-2 px-4 py-3 text-sm font-semibold ${pestana === 'solicitudes' ? 'border-terracota text-terracota' : 'border-transparent text-slate-500'}`}>
          Solicitudes
        </button>
      </div>
      {pestana === 'mascotas'
        ? <MascotasAdmin onUnauthorized={perderSesion} onMensaje={setMensaje} />
        : <SolicitudesAdmin onUnauthorized={perderSesion} onMensaje={setMensaje} />}
    </section>
  )
}

function MascotasAdmin({ onUnauthorized, onMensaje }) {
  const [mascotas, setMascotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [lenta, setLenta] = useState(false)
  const [formulario, setFormulario] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    const temporizador = setTimeout(() => setLenta(true), 8000)
    try {
      setMascotas(await listarMascotasAdmin())
    } catch (fallo) {
      if (fallo.status === 401) onUnauthorized()
      else setError(fallo)
    } finally {
      clearTimeout(temporizador)
      setCargando(false)
      setLenta(false)
    }
  }, [onUnauthorized])

  useEffect(() => { cargar() }, [cargar])

  async function eliminar(mascota) {
    if (!window.confirm(`¿Eliminar a ${mascota.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await eliminarMascota(mascota.id)
      onMensaje({ tipo: 'exito', texto: 'Mascota eliminada correctamente.' })
      cargar()
    } catch (fallo) {
      if (fallo.status === 401) onUnauthorized()
      else onMensaje({ tipo: 'error', texto: mensajeAccion(fallo) })
    }
  }

  async function guardar(datos, id) {
    try {
      const datosApi = normalizarMascota(datos)
      if (id) await editarMascota(id, datosApi)
      else await crearMascota(datosApi)
      setFormulario(null)
      onMensaje({ tipo: 'exito', texto: id ? 'Mascota actualizada correctamente.' : 'Mascota creada correctamente.' })
      cargar()
    } catch (fallo) {
      if (fallo.status === 401) onUnauthorized()
      else onMensaje({ tipo: 'error', texto: fallo.detail || mensajeError(fallo) })
    }
  }

  if (cargando) return <div className="mt-6"><Cargando texto="Cargando todas las mascotas..." />{lenta && <AvisoServidor />}</div>
  if (error) return <div className="mt-6"><ErrorPeticion error={error} reintentar={cargar} /></div>

  return (
    <div className="mt-6">
      {lenta && <AvisoServidor />}
      <button onClick={() => setFormulario({ datos: mascotaInicial, id: null })} className="mb-4 rounded-xl bg-terracota px-4 py-3 font-semibold text-white hover:bg-orange-700">
        Crear mascota
      </button>
      {formulario && <MascotaFormulario inicial={formulario.datos} id={formulario.id} onGuardar={guardar} onCancelar={() => setFormulario(null)} />}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Especie</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th></tr></thead>
          <tbody>{mascotas.map((mascota) => <tr key={mascota.id} className="border-t border-slate-100"><td className="px-4 py-4 font-semibold text-bosque">{mascota.nombre}</td><td className="px-4 py-4 capitalize">{mascota.especie}</td><td className="px-4 py-4"><Estado estado={mascota.estado} /></td><td className="px-4 py-4"><div className="flex gap-2"><button onClick={() => setFormulario({ datos: mascota, id: mascota.id })} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:border-hoja hover:text-hoja">Editar</button><button onClick={() => eliminar(mascota)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 hover:bg-red-50">Eliminar</button></div></td></tr>)}</tbody>
        </table>
        {mascotas.length === 0 && <p className="p-8 text-center text-slate-500">No hay mascotas registradas.</p>}
      </div>
    </div>
  )
}

function MascotaFormulario({ inicial, id, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({ ...mascotaInicial, ...inicial })
  function cambiar(evento) { setDatos({ ...datos, [evento.target.name]: evento.target.value }) }
  function enviar(evento) { evento.preventDefault(); onGuardar(datos, id) }
  return (
    <form onSubmit={enviar} className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2">
      <h2 className="text-xl font-bold text-bosque sm:col-span-2">{id ? 'Editar mascota' : 'Crear mascota'}</h2>
      <CampoAdmin nombre="nombre" etiqueta="Nombre" valor={datos.nombre} cambiar={cambiar} requerido />
      <label className="label-admin">Especie<select name="especie" value={datos.especie} onChange={cambiar} className="input-admin"><option value="perro">Perro</option><option value="gato">Gato</option><option value="otro">Otro</option></select></label>
      <CampoAdmin nombre="raza" etiqueta="Raza" valor={datos.raza} cambiar={cambiar} />
      <label className="label-admin">Sexo<select name="sexo" value={datos.sexo || ''} onChange={cambiar} className="input-admin"><option value="">Sin especificar</option><option value="macho">Macho</option><option value="hembra">Hembra</option></select></label>
      <CampoAdmin nombre="edad_meses" etiqueta="Edad (meses)" tipo="number" valor={datos.edad_meses ?? ''} cambiar={cambiar} />
      <label className="label-admin">Tamaño<select name="tamano" value={datos.tamano || ''} onChange={cambiar} className="input-admin"><option value="">Sin especificar</option><option value="pequeno">Pequeño</option><option value="mediano">Mediano</option><option value="grande">Grande</option></select></label>
      <CampoAdmin nombre="foto_url" etiqueta="URL de foto" valor={datos.foto_url} cambiar={cambiar} />
      <label className="label-admin sm:col-span-2">Descripción<textarea name="descripcion" value={datos.descripcion || ''} onChange={cambiar} rows="3" className="input-admin" /></label>
      <div className="flex gap-2 sm:col-span-2"><button className="rounded-xl bg-bosque px-4 py-2 font-semibold text-white">Guardar</button><button type="button" onClick={onCancelar} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700">Cancelar</button></div>
    </form>
  )
}

function SolicitudesAdmin({ onUnauthorized, onMensaje }) {
  const [solicitudes, setSolicitudes] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [estado, setEstado] = useState('')
  const [mascotaId, setMascotaId] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [lenta, setLenta] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true); setError(null)
    const temporizador = setTimeout(() => setLenta(true), 8000)
    try {
      const [resultados, todasMascotas] = await Promise.all([
        listarSolicitudes({ estado, mascota_id: mascotaId }),
        listarMascotasAdmin(),
      ])
      setSolicitudes(resultados)
      setMascotas(todasMascotas)
    } catch (fallo) {
      if (fallo.status === 401) onUnauthorized()
      else setError(fallo)
    } finally {
      clearTimeout(temporizador); setCargando(false); setLenta(false)
    }
  }, [estado, mascotaId, onUnauthorized])

  useEffect(() => { cargar() }, [cargar])
  const nombres = useMemo(() => Object.fromEntries(mascotas.map((mascota) => [mascota.id, mascota.nombre])), [mascotas])

  async function aprobar(id) {
    try {
      await aprobarSolicitud(id)
      onMensaje({ tipo: 'exito', texto: 'Solicitud aprobada y mascota marcada como adoptada.' })
      cargar()
    } catch (fallo) {
      if (fallo.status === 401) onUnauthorized()
      else onMensaje({ tipo: 'error', texto: mensajeAccion(fallo) })
    }
  }

  async function rechazar(id) {
    const motivo = window.prompt('Escribe el motivo del rechazo:')
    if (!motivo?.trim()) return
    try {
      await rechazarSolicitud(id, motivo.trim())
      onMensaje({ tipo: 'exito', texto: 'Solicitud rechazada correctamente.' })
      cargar()
    } catch (fallo) {
      if (fallo.status === 401) onUnauthorized()
      else onMensaje({ tipo: 'error', texto: mensajeAccion(fallo) })
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-4 grid gap-3 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2">
        <label className="label-admin">Estado<select value={estado} onChange={(evento) => setEstado(evento.target.value)} className="input-admin"><option value="">Todos</option><option value="pendiente">Pendiente</option><option value="aprobada">Aprobada</option><option value="rechazada">Rechazada</option></select></label>
        <label className="label-admin">Mascota<select value={mascotaId} onChange={(evento) => setMascotaId(evento.target.value)} className="input-admin"><option value="">Todas</option>{mascotas.map((mascota) => <option key={mascota.id} value={mascota.id}>{mascota.nombre}</option>)}</select></label>
      </div>
      {lenta && <AvisoServidor />}
      {cargando && <Cargando texto="Cargando solicitudes..." />}
      {!cargando && error && <ErrorPeticion error={error} reintentar={cargar} />}
      {!cargando && !error && <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Mascota</th><th className="px-4 py-3">Solicitante</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Acciones</th></tr></thead><tbody>{solicitudes.map((solicitud) => <tr key={solicitud.id} className="border-t border-slate-100 align-top"><td className="px-4 py-4 font-semibold text-bosque">{nombres[solicitud.mascota_id] || solicitud.mascota_id}</td><td className="px-4 py-4">{solicitud.nombre_solicitante}<br /><span className="text-xs text-slate-500">{solicitud.documento}</span></td><td className="px-4 py-4">{solicitud.email}<br /><span className="text-xs text-slate-500">{solicitud.telefono || 'Sin teléfono'}</span></td><td className="px-4 py-4"><Estado estado={solicitud.estado} /></td><td className="whitespace-nowrap px-4 py-4 text-slate-500">{new Date(solicitud.created_at).toLocaleString('es-CO')}</td><td className="px-4 py-4">{solicitud.estado === 'pendiente' && <div className="flex flex-wrap gap-2"><button onClick={() => aprobar(solicitud.id)} className="rounded-lg bg-hoja px-3 py-2 font-semibold text-white">Aprobar</button><button onClick={() => rechazar(solicitud.id)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700">Rechazar</button></div>}</td></tr>)}</tbody></table>{solicitudes.length === 0 && <p className="p-8 text-center text-slate-500">No hay solicitudes para esos filtros.</p>}</div>}
    </div>
  )
}

function CampoAdmin({ nombre, etiqueta, valor, cambiar, tipo = 'text', requerido }) {
  return <label className="label-admin">{etiqueta}<input name={nombre} type={tipo} value={valor || ''} onChange={cambiar} required={requerido} className="input-admin" /></label>
}

function normalizarMascota(datos) {
  const campos = { ...datos }
  if (campos.edad_meses === '' || campos.edad_meses === null) campos.edad_meses = null
  else campos.edad_meses = Number(campos.edad_meses)
  for (const campo of ['raza', 'sexo', 'tamano', 'descripcion', 'foto_url']) {
    if (campos[campo] === '') campos[campo] = null
  }
  return campos
}

function mensajeAccion(error) {
  if (error.status === 409) return `409 Conflict: ${error.detail || mensajeError(error)}`
  if (error.status === 503) return `503 Service Unavailable: ${error.detail || mensajeError(error)}`
  return error.detail || mensajeError(error)
}

function Estado({ estado }) {
  const colores = { disponible: 'bg-emerald-100 text-emerald-800', pendiente: 'bg-amber-100 text-amber-800', aprobada: 'bg-emerald-100 text-emerald-800', rechazada: 'bg-red-100 text-red-800', adoptada: 'bg-slate-100 text-slate-700' }
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${colores[estado] || 'bg-slate-100 text-slate-700'}`}>{estado}</span>
}

function Aviso({ tipo, children }) {
  const clases = tipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : tipo === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-slate-50 text-slate-700'
  return <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${clases}`}>{children}</p>
}
