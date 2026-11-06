import { useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { obtenerMascota } from '../api'
import { AvisoServidor, Cargando, ErrorPeticion } from '../components/EstadoPeticion'
import { usePeticion } from '../components/usePeticion'

const imagenReemplazo = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1000&q=80'

export default function DetalleMascota() {
  const { id } = useParams()
  const navegar = useNavigate()
  const cargar = useCallback(() => obtenerMascota(id), [id])
  const { cargando, datos: mascota, error, lenta } = usePeticion(cargar, [cargar])

  if (cargando) return <Cargando texto="Cargando información de la mascota..." />
  if (error) return <><ErrorPeticion error={error} reintentar={() => navegar(0)} />{lenta && <AvisoServidor />}</>

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm">
      {lenta && <AvisoServidor />}
      <div className="grid lg:grid-cols-2">
        <img src={mascota.foto_url || imagenReemplazo} alt={`Foto de ${mascota.nombre}`} className="h-full min-h-80 w-full object-cover" />
        <div className="p-6 sm:p-10">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mascota.estado === 'adoptada' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-hoja'}`}>{mascota.estado}</span>
          <h1 className="mt-4 text-4xl font-bold text-bosque">{mascota.nombre}</h1>
          <p className="mt-2 capitalize text-hoja">{mascota.especie}{mascota.raza ? ` · ${mascota.raza}` : ''}</p>
          <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <Dato titulo="Sexo" valor={mascota.sexo || 'No especificado'} />
            <Dato titulo="Edad" valor={edadTexto(mascota.edad_meses)} />
            <Dato titulo="Tamaño" valor={mascota.tamano || 'No especificado'} />
          </dl>
          <p className="mt-8 leading-7 text-slate-600">{mascota.descripcion || 'Esta mascota está esperando una familia que le brinde amor y cuidado.'}</p>
          {mascota.estado !== 'adoptada' && <Link to={`/solicitar/${mascota.id}`} className="mt-8 block rounded-xl bg-terracota px-5 py-3 text-center font-semibold text-white hover:bg-orange-700">Solicitar adopción</Link>}
          <Link to="/" className="mt-4 block text-center text-sm font-semibold text-hoja hover:text-bosque">Volver al catálogo</Link>
        </div>
      </div>
    </article>
  )
}

function Dato({ titulo, valor }) { return <div className="rounded-xl bg-crema p-3"><dt className="text-xs uppercase text-slate-500">{titulo}</dt><dd className="mt-1 capitalize font-semibold text-bosque">{valor}</dd></div> }
function edadTexto(meses) { if (meses === null || meses === undefined) return 'No especificada'; if (meses < 12) return `${meses} meses`; return `${Math.floor(meses / 12)} años`; }
