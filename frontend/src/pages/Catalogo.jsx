import { useCallback, useState } from 'react'
import { listarMascotas } from '../api'
import { AvisoServidor, Cargando, ErrorPeticion } from '../components/EstadoPeticion'
import { usePeticion } from '../components/usePeticion'
import TarjetaMascota from '../components/TarjetaMascota'

export default function Catalogo() {
  const [especie, setEspecie] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const cargar = useCallback(() => listarMascotas({ especie, q: busqueda }), [especie, busqueda])
  const { cargando, datos, error, lenta } = usePeticion(cargar, [cargar])

  return (
    <section>
      <div className="hero-panel mb-8 overflow-hidden rounded-[2rem] bg-bosque px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow text-emerald-200">Adopta con amor</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">Un hogar cambia dos vidas.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50 sm:text-lg">Conoce a los animales que esperan una familia responsable, paciente y llena de cariño.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-white/10 px-4 py-2 text-emerald-50">🐾 Adopción responsable</span><span className="rounded-full bg-white/10 px-4 py-2 text-emerald-50">🤍 Compañía para siempre</span></div>
        </div>
      </div>
      <div className="filter-card mb-8 grid gap-4 rounded-2xl bg-white p-5 shadow-sm sm:grid-cols-[12rem_1fr]">
        <label className="field-label">Especie
          <select value={especie} onChange={(e) => setEspecie(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-hoja">
            <option value="">Todas</option><option value="perro">Perros</option><option value="gato">Gatos</option><option value="otro">Otros</option>
          </select>
        </label>
        <label className="field-label">Buscar por nombre
          <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. Luna" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-3 font-normal outline-none focus:border-hoja" />
        </label>
      </div>
      {lenta && <AvisoServidor />}
      {cargando && <Cargando texto="Buscando mascotas disponibles..." />}
      {!cargando && error && <ErrorPeticion error={error} reintentar={() => cargar()} />}
      {!cargando && !error && datos?.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-slate-600 shadow-sm">No encontramos mascotas con esos filtros.</p>}
      {!cargando && !error && datos?.length > 0 && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{datos.map((mascota) => <TarjetaMascota key={mascota.id} mascota={mascota} />)}</div>}
    </section>
  )
}
