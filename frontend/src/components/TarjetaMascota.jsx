import { Link } from 'react-router-dom'

const imagenReemplazo = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=800&q=80'

export default function TarjetaMascota({ mascota }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <img src={mascota.foto_url || imagenReemplazo} alt={`Foto de ${mascota.nombre}`} className="h-56 w-full object-cover" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-bosque">{mascota.nombre}</h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-hoja">{mascota.especie}</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">{edadTexto(mascota.edad_meses)}</p>
        <Link to={`/mascotas/${mascota.id}`} className="mt-5 block rounded-xl bg-bosque px-4 py-3 text-center font-semibold text-white transition hover:bg-hoja">Ver detalles</Link>
      </div>
    </article>
  )
}

function edadTexto(meses) {
  if (meses === null || meses === undefined) return 'Edad no especificada'
  if (meses < 12) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`
  const años = Math.floor(meses / 12)
  const restantes = meses % 12
  return `${años} ${años === 1 ? 'año' : 'años'}${restantes ? ` y ${restantes} meses` : ''}`
}
