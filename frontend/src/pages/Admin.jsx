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
import { EtiquetaEstado } from '../components/EtiquetaEstado'

const tokenStorage = 'admin_access_token'
const mascotaInicial = {
  nombre: '', especie: 'perro', raza: '', sexo: '', edad_meses: '', tamano: '',
  descripcion: '', foto_url: '',
}

export default function Admin() {
  const [mensaje, setMensaje] = useState(null)
  const [pestana, setPestana] = useState('mascotas')

  function cerrarSesion() {
    sessionStorage.removeItem(tokenStorage)
    sessionStorage.removeItem('guest_access')
    setMensaje({ tipo: 'info', texto: 'Sesión cerrada.' })
    window.dispatchEvent(new Event('admin-auth-changed'))
  }

  function perderSesion() {
    sessionStorage.removeItem(tokenStorage)
    sessionStorage.removeItem('guest_access')
    setMensaje({ tipo: 'error', texto: 'La sesión no es válida o expiró. Inicia sesión nuevamente.' })
    window.dispatchEvent(new Event('admin-auth-changed'))
  }

  return (
    <section className="admin-shell">
      <div className="admin-heading flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">Área privada</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-bosque sm:text-4xl">Panel administrativo</h1>
          <p className="mt-2 text-slate-500">Una vista clara para cuidar cada paso del proceso de adopción.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={cerrarSesion} className="secondary-button">Cerrar sesión</button>
        </div>
      </div>
      {mensaje && <Aviso tipo={mensaje.tipo}>{mensaje.texto}</Aviso>}
      <div className="admin-tabs mt-8 flex gap-1 rounded-2xl bg-white p-1 shadow-sm">
        <button onClick={() => setPestana('mascotas')} className={`admin-tab ${pestana === 'mascotas' ? 'admin-tab-active' : ''}`}>
          Mascotas
        </button>
        <button onClick={() => setPestana('solicitudes')} className={`admin-tab ${pestana === 'solicitudes' ? 'admin-tab-active' : ''}`}>
          Solicitudes
        </button>
      </div>
      {pestana === 'mascotas' && <MascotasAdmin onUnauthorized={perderSesion} onMensaje={setMensaje} />}
      {pestana === 'solicitudes' && <SolicitudesAdmin onUnauthorized={perderSesion} onMensaje={setMensaje} />}
    </section>
  )
}

function DocumentacionAdmin() {
  const servicios = [
    { nombre: 'API Mascotas', url: 'https://mascotas-jhsx.onrender.com', docs: 'https://mascotas-jhsx.onrender.com/docs', descripcion: 'Catálogo, disponibilidad y estados', endpoints: 'GET /mascotas · POST /mascotas · PATCH /mascotas/{id}/estado' },
    { nombre: 'API Adopciones', url: 'https://adoption-hdh3.onrender.com', docs: 'https://adoption-hdh3.onrender.com/docs', descripcion: 'Solicitudes, seguimiento y decisiones', endpoints: 'POST /solicitudes · GET /seguimiento · PATCH /solicitudes/{id}/aprobar' },
  ]

  return (
    <section className="admin-documentation mt-6">
      <div className="rounded-3xl bg-gradient-to-br from-bosque to-emerald-900 p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-9">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Guía de presentación</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Arquitectura y flujo de adopción</h2>
            <p className="mt-3 max-w-2xl leading-7 text-emerald-50">
              Una vista técnica y visual para explicar cómo colaboran el frontend,
              las APIs y la persistencia de datos.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-emerald-50">
            <span className="block text-xs font-bold uppercase tracking-wider text-emerald-200">Arquitectura</span>
            SOA · REST · PostgreSQL
          </div>
        </div>
      </div>

      <div className="admin-architecture mt-6 rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
        <div className="architecture-node architecture-user">
          <span className="text-2xl">👤</span>
          <strong>Usuario / Administrador</strong>
          <small>Inicia y supervisa la adopción</small>
        </div>
        <div className="architecture-arrow">↓ consulta y administra</div>
        <div className="architecture-node architecture-frontend">
          <span className="text-2xl">🖥️</span>
          <strong>Frontend React + Vite</strong>
          <small>Catálogo · solicitud · seguimiento · administración</small>
        </div>
        <div className="architecture-arrow">↓ HTTP/REST + JSON</div>
        <div className="architecture-services">
          <div className="architecture-node architecture-service">
            <span className="text-2xl">🐾</span>
            <strong>API Mascotas</strong>
            <small>Catálogo y disponibilidad</small>
          </div>
          <div className="architecture-node architecture-service">
            <span className="text-2xl">🏠</span>
            <strong>API Adopciones</strong>
            <small>Solicitudes y decisiones</small>
          </div>
        </div>
        <div className="architecture-connection">
          <span>Adopciones consulta disponibilidad</span>
          <strong>API Adopciones</strong>
          <span>verifica y actualiza</span>
          <strong>API Mascotas</strong>
        </div>
        <div className="architecture-arrow">↓ persistencia aislada por servicio</div>
        <div className="architecture-node architecture-database">
          <span className="text-2xl">🗄️</span>
          <strong>PostgreSQL / Supabase</strong>
          <small>svc_mascotas · svc_adopciones · persistencia separada</small>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="eyebrow">Proceso de adopción</p>
        <h3 className="mt-2 text-xl font-bold text-bosque">Del catálogo a un nuevo hogar</h3>
        <div className="flow-steps mt-6">
          <FlujoPaso numero="01" titulo="Consultar" texto="La persona explora mascotas disponibles y revisa su información." />
          <FlujoPaso numero="02" titulo="Solicitar" texto="Completa el formulario y Adopciones valida disponibilidad." />
          <FlujoPaso numero="03" titulo="Decidir" texto="El administrador aprueba o rechaza la solicitud." />
          <FlujoPaso numero="04" titulo="Actualizar" texto="Mascotas cambia a adoptada y las demás solicitudes quedan rechazadas." />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <InfoDocumentacion
          titulo="Responsabilidades"
          items={[
            'Mascotas administra el catálogo, disponibilidad y estado de cada animal.',
            'Adopciones registra solicitudes y controla aprobar o rechazar.',
            'El frontend consume ambas APIs únicamente mediante HTTP/JSON.',
          ]}
        />
        <InfoDocumentacion
          titulo="Flujo principal"
          items={[
            'Consultar una mascota disponible.',
            'Crear solicitud y verificar disponibilidad.',
            'Aprobar: adopción, rechazos automáticos y estado adoptada.',
            'Rechazar: la mascota permanece disponible.',
          ]}
        />
        <InfoDocumentacion
          titulo="Garantías"
          items={[
            'Índice único: una adopción aprobada por mascota.',
            'Bloqueo de fila para aprobar solicitudes concurrentes.',
            'Claves X-API-Key y X-Service-Key.',
            'Errores HTTP 401, 404, 409 y 503.',
          ]}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <InfoDocumentacion
          titulo="Reglas de negocio"
          items={[
            'Solo se pueden solicitar mascotas disponibles.',
            'Una persona no puede duplicar una solicitud pendiente para la misma mascota.',
            'Aprobar cambia la mascota a adoptada y rechaza las demás solicitudes pendientes.',
            'Rechazar registra el motivo y conserva la mascota disponible.',
          ]}
        />
        <InfoDocumentacion
          titulo="Seguridad y resiliencia"
          items={[
            'Las operaciones administrativas requieren X-API-Key.',
            'La comunicación interna entre servicios usa X-Service-Key.',
            'La aprobación usa bloqueo de fila y restricciones únicas.',
            'Los fallos de Mascotas provocan rollback y respuesta 503.',
          ]}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <InfoDocumentacion
          titulo="Objetivo del sistema"
          items={[
            'Centralizar el catálogo de mascotas disponibles.',
            'Permitir solicitudes de adopción con seguimiento por documento.',
            'Garantizar decisiones consistentes entre Mascotas y Adopciones.',
          ]}
        />
        <InfoDocumentacion
          titulo="Tecnologías"
          items={[
            'React, Vite y Material UI en el frontend.',
            'FastAPI, Pydantic y SQLAlchemy en los servicios.',
            'PostgreSQL/Supabase para persistencia aislada por esquema.',
          ]}
        />
        <InfoDocumentacion
          titulo="Criterios de calidad"
          items={[
            'Validación de datos en frontend y backend.',
            'Estados HTTP claros para errores y conflictos.',
            'Interfaz responsive y accesible para los roles.',
          ]}
        />
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="eyebrow">Integración entre APIs</p>
        <h3 className="mt-2 text-xl font-bold text-bosque">Qué ocurre al aprobar una solicitud</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          <PasoTecnico numero="1" texto="Admin envía PATCH a Adopciones." />
          <PasoTecnico numero="2" texto="Adopciones bloquea la solicitud pendiente." />
          <PasoTecnico numero="3" texto="Adopciones consulta disponibilidad." />
          <PasoTecnico numero="4" texto="Mascotas cambia el estado a adoptada." />
          <PasoTecnico numero="5" texto="Adopciones confirma y persiste la decisión." />
        </div>
        <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">
          La integración es REST/JSON: Adopciones no modifica directamente la tabla
          de Mascotas. Cada servicio conserva la responsabilidad de sus propios datos.
        </p>
      </div>

      <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <p className="eyebrow">Servicios desplegados</p>
        <h3 className="mt-2 text-xl font-bold text-bosque">Servicios y documentación</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {servicios.map((servicio) => (
            <div key={servicio.nombre} className="rounded-2xl border border-slate-200 p-4">
              <span className="text-sm font-bold text-bosque">{servicio.nombre}</span>
              <span className="mt-1 block break-all text-sm text-slate-500">{servicio.url}</span>
              <span className="mt-2 block text-xs text-slate-500">{servicio.descripcion}</span>
              <code className="mt-3 block rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{servicio.endpoints}</code>
              <a href={servicio.docs} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg bg-bosque px-3 py-2 text-xs font-bold text-white transition hover:bg-hoja">
                Abrir Swagger /docs
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <p className="eyebrow">Modelo de datos</p>
          <h3 className="mt-2 text-xl font-bold text-bosque">Dos esquemas autónomos</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ModeloServicio nombre="svc_mascotas" tabla="mascotas" campos="id, nombre, especie, estado, foto_url" />
            <ModeloServicio nombre="svc_adopciones" tabla="solicitudes" campos="id, mascota_id, solicitante, estado, decisión" />
          </div>
        </div>
      </div>

    </section>
  )
}

function PasoTecnico({ numero, texto }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><span className="grid h-8 w-8 place-items-center rounded-full bg-terracota text-xs font-bold text-white">{numero}</span><p className="mt-3 text-sm leading-6 text-slate-600">{texto}</p></div>
}

function FlujoPaso({ numero, titulo, texto }) {
  return (
    <article className="flow-step">
      <span className="flow-step-number">{numero}</span>
      <div>
        <h4 className="font-bold text-bosque">{titulo}</h4>
        <p className="mt-1 text-sm leading-6 text-slate-600">{texto}</p>
      </div>
    </article>
  )
}

function InfoDocumentacion({ titulo, items }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-bosque">{titulo}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
        {items.map((item) => <li key={item} className="flex gap-2"><span className="text-terracota">•</span><span>{item}</span></li>)}
      </ul>
    </article>
  )
}

function ModeloServicio({ nombre, tabla, campos }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-hoja">{nombre}</p>
      <p className="mt-1 font-semibold text-slate-800">tabla {tabla}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{campos}</p>
    </div>
  )
}

function MascotasAdmin({ onUnauthorized, onMensaje }) {
  const [mascotas, setMascotas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [lenta, setLenta] = useState(false)
  const [formulario, setFormulario] = useState(null)
  const [mascotaEliminar, setMascotaEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    if (!formulario) return
    requestAnimationFrame(() => {
      document.getElementById('formulario-mascota')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [formulario])

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

  async function eliminar() {
    if (!mascotaEliminar) return
    setEliminando(true)
    try {
      await eliminarMascota(mascotaEliminar.id)
      onMensaje({ tipo: 'exito', texto: 'Mascota eliminada correctamente.' })
      setMascotaEliminar(null)
      await cargar()
    } catch (fallo) {
      if (fallo.status === 401) onUnauthorized()
      else onMensaje({ tipo: 'error', texto: mensajeAccion(fallo) })
    } finally {
      setEliminando(false)
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
      {formulario && <div id="formulario-mascota" className="scroll-mt-24"><MascotaFormulario inicial={formulario.datos} id={formulario.id} onGuardar={guardar} onCancelar={() => setFormulario(null)} /></div>}
      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Nombre</th><th className="px-4 py-3">Especie</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acciones</th></tr></thead>
          <tbody>{mascotas.map((mascota) => <tr key={mascota.id} className="border-t border-slate-100"><td className="px-4 py-4 font-semibold text-bosque">{mascota.nombre}</td><td className="px-4 py-4 capitalize">{mascota.especie}</td><td className="px-4 py-4"><Estado estado={mascota.estado} /></td><td className="px-4 py-4"><div className="flex gap-2"><button onClick={() => setFormulario({ datos: mascota, id: mascota.id })} className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 hover:border-hoja hover:text-hoja">Editar</button><button onClick={() => setMascotaEliminar(mascota)} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 hover:bg-red-50">Eliminar</button></div></td></tr>)}</tbody>
        </table>
        {mascotas.length === 0 && <p className="p-8 text-center text-slate-500">No hay mascotas registradas.</p>}
      </div>
      {mascotaEliminar && <ConfirmacionModal
        titulo="Eliminar mascota"
        texto={`¿Quieres eliminar a ${mascotaEliminar.nombre}? Esta acción no se puede deshacer.`}
        confirmando={eliminando}
        onConfirmar={eliminar}
        onCancelar={() => !eliminando && setMascotaEliminar(null)}
      />}
    </div>
  )
}

function MascotaFormulario({ inicial, id, onGuardar, onCancelar }) {
  const [datos, setDatos] = useState({ ...mascotaInicial, ...inicial })
  const [guardando, setGuardando] = useState(false)
  function cambiar(evento) { setDatos({ ...datos, [evento.target.name]: evento.target.value }) }
  async function enviar(evento) {
    evento.preventDefault()
    setGuardando(true)
    try { await onGuardar(datos, id) } finally { setGuardando(false) }
  }
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
      {datos.foto_url && <div className="rounded-xl bg-slate-50 p-2 sm:col-span-2"><img src={datos.foto_url} alt={`Vista previa de ${datos.nombre || 'la mascota'}`} className="h-40 w-full rounded-lg object-cover" onError={(evento) => { evento.currentTarget.style.display = 'none' }} /></div>}
      <label className="label-admin sm:col-span-2">Descripción<textarea name="descripcion" value={datos.descripcion || ''} onChange={cambiar} rows="3" className="input-admin" /></label>
      <div className="flex gap-2 sm:col-span-2"><button disabled={guardando} className="rounded-xl bg-bosque px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{guardando ? 'Guardando...' : 'Guardar cambios'}</button><button type="button" onClick={onCancelar} disabled={guardando} className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 disabled:opacity-50">Cancelar</button></div>
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
  const [rechazo, setRechazo] = useState(null)
  const [procesandoId, setProcesandoId] = useState(null)

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
    setProcesandoId(id)
    try {
      await aprobarSolicitud(id)
      onMensaje({ tipo: 'exito', texto: 'Solicitud aprobada y mascota marcada como adoptada.' })
      await cargar()
    } catch (fallo) {
      if (fallo.status === 401) onUnauthorized()
      else onMensaje({ tipo: 'error', texto: mensajeAccion(fallo) })
    } finally {
      setProcesandoId(null)
    }
  }

  async function rechazar(motivo) {
    if (!rechazo || !motivo.trim()) return
    setProcesandoId(rechazo.id)
    try {
      await rechazarSolicitud(rechazo.id, motivo.trim())
      onMensaje({ tipo: 'exito', texto: 'Solicitud rechazada correctamente.' })
      setRechazo(null)
      await cargar()
    } catch (fallo) {
      if (fallo.status === 401) onUnauthorized()
      else onMensaje({ tipo: 'error', texto: mensajeAccion(fallo) })
    } finally {
      setProcesandoId(null)
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
      {!cargando && !error && <div className="overflow-x-auto rounded-2xl bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Mascota</th><th className="px-4 py-3">Solicitante</th><th className="px-4 py-3">Contacto</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Acciones</th></tr></thead><tbody>{solicitudes.map((solicitud) => { const ocupado = procesandoId === solicitud.id; return <tr key={solicitud.id} className="border-t border-slate-100 align-top"><td className="px-4 py-4 font-semibold text-bosque">{nombres[solicitud.mascota_id] || solicitud.mascota_id}</td><td className="px-4 py-4">{solicitud.nombre_solicitante}<br /><span className="text-xs text-slate-500">{solicitud.documento}</span></td><td className="px-4 py-4">{solicitud.email}<br /><span className="text-xs text-slate-500">{solicitud.telefono || 'Sin teléfono'}</span></td><td className="px-4 py-4"><Estado estado={solicitud.estado} /></td><td className="whitespace-nowrap px-4 py-4 text-slate-500">{new Date(solicitud.created_at).toLocaleString('es-CO')}</td><td className="px-4 py-4">{solicitud.estado === 'pendiente' && <div className="flex flex-wrap gap-2"><button disabled={ocupado} onClick={() => aprobar(solicitud.id)} className="rounded-lg bg-hoja px-3 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{ocupado ? 'Procesando...' : 'Aprobar'}</button><button disabled={ocupado} onClick={() => setRechazo({ id: solicitud.id, mascota: nombres[solicitud.mascota_id] || 'esta mascota' })} className="rounded-lg border border-red-200 px-3 py-2 font-semibold text-red-700 disabled:opacity-50">Rechazar</button></div>}</td></tr> })}</tbody></table>{solicitudes.length === 0 && <p className="p-8 text-center text-slate-500">No hay solicitudes para esos filtros.</p>}</div>}
      {rechazo && <RechazoModal mascota={rechazo.mascota} onConfirmar={rechazar} onCancelar={() => setRechazo(null)} />}
    </div>
  )
}

function ConfirmacionModal({ titulo, texto, confirmando, onConfirmar, onCancelar }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="confirmacion-titulo">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-xl">!</div>
        <h2 id="confirmacion-titulo" className="text-xl font-bold text-bosque">{titulo}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{texto}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancelar} disabled={confirmando} className="secondary-button disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={onConfirmar} disabled={confirmando} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{confirmando ? 'Eliminando...' : 'Sí, eliminar'}</button>
        </div>
      </div>
    </div>
  )
}

function RechazoModal({ mascota, onConfirmar, onCancelar }) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  async function enviar(evento) {
    evento.preventDefault()
    if (motivo.trim().length < 3) return setError('Escribe un motivo de al menos 3 caracteres.')
    setEnviando(true)
    try { await onConfirmar(motivo) } finally { setEnviando(false) }
  }
  return (
    <div className="modal-backdrop" role="presentation">
      <form onSubmit={enviar} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="rechazo-titulo">
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-xl">✎</div>
        <h2 id="rechazo-titulo" className="text-xl font-bold text-bosque">Rechazar solicitud</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Indica el motivo para que quede registrado en el seguimiento de {mascota}.</p>
        <label className="label-admin mt-5 block">Motivo del rechazo<textarea autoFocus value={motivo} onChange={(evento) => { setMotivo(evento.target.value); setError('') }} rows="4" className={`input-admin ${error ? 'border-red-400' : ''}`} placeholder="Escribe una explicación clara y respetuosa..." /></label>
        {error && <p className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancelar} disabled={enviando} className="secondary-button disabled:opacity-50">Cancelar</button>
          <button disabled={enviando} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{enviando ? 'Guardando...' : 'Confirmar rechazo'}</button>
        </div>
      </form>
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
  return <EtiquetaEstado estado={estado} compact />
}

function Aviso({ tipo, children }) {
  const clases = tipo === 'exito' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : tipo === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-slate-50 text-slate-700'
  return <p className={`mt-4 rounded-xl border px-4 py-3 text-sm ${clases}`}>{children}</p>
}
