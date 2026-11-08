import { Link } from 'react-router-dom'

const imagenReemplazo = 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=800&q=80'

export default function TarjetaMascota({ mascota }) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/10">
      <div className="relative overflow-hidden">
        <img src={mascota.foto_url || imagenReemplazo} alt={`Foto de ${mascota.nombre}`} className="h-60 w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold capitalize text-bosque shadow-sm backdrop-blur">{mascota.especie}</span>
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold text-bosque">{mascota.nombre}</h2>
        </div>
        <p className="mt-2 text-sm text-slate-500">{edadTexto(mascota.edad_meses)} <span className="mx-1 text-slate-300">•</span> {mascota.raza || 'Compañero mestizo'}</p>
        <Link to={`/mascotas/${mascota.id}`} className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 font-semibold text-bosque transition group-hover:bg-emerald-50">Conocer a {mascota.nombre}<span aria-hidden="true">→</span></Link>
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
