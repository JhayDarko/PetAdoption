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
      <div className="mb-8 rounded-3xl bg-bosque px-6 py-10 text-white sm:px-10">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-200">Adopta con amor</p>
        <h1 className="max-w-2xl text-3xl font-bold sm:text-5xl">Encuentra un nuevo amigo para toda la vida.</h1>
        <p className="mt-4 max-w-xl text-emerald-50">Conoce a los animales que esperan un hogar responsable y lleno de cariño.</p>
      </div>
      <div className="mb-8 grid gap-4 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-[12rem_1fr]">
        <label className="text-sm font-semibold text-slate-600">Especie
          <select value={especie} onChange={(e) => setEspecie(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 font-normal outline-none focus:border-hoja">
            <option value="">Todas</option><option value="perro">Perros</option><option value="gato">Gatos</option><option value="otro">Otros</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-600">Buscar por nombre
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
