import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Catalogo from './pages/Catalogo'
import DetalleMascota from './pages/DetalleMascota'
import FormularioSolicitud from './pages/FormularioSolicitud'
import Seguimiento from './pages/Seguimiento'
import Admin from './pages/Admin'

function Layout({ children }) {
  const enlace = ({ isActive }) =>
    `transition hover:text-terracota ${isActive ? 'font-semibold text-terracota' : 'text-slate-600'}`

  return (
    <div className="min-h-screen bg-crema text-slate-800">
      <header className="border-b border-emerald-950/10 bg-white/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-lg font-bold text-bosque">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-hoja text-xl text-white">🐾</span>
            <span>Huellas de Esperanza</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm" aria-label="Navegación principal">
            <NavLink to="/" className={enlace}>Catálogo</NavLink>
            <NavLink to="/seguimiento" className={enlace}>Seguimiento</NavLink>
            <NavLink to="/admin" className={enlace}>Admin</NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="mt-12 border-t border-emerald-950/10 bg-white/60 py-6 text-center text-sm text-slate-500">
        Adopción responsable para una vida llena de compañía.
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/mascotas/:id" element={<DetalleMascota />} />
        <Route path="/solicitar/:id" element={<FormularioSolicitud />} />
        <Route path="/seguimiento" element={<Seguimiento />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  )
}

function NotFound() {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-bosque">Página no encontrada</h1>
      <Link to="/" className="mt-6 inline-block rounded-xl bg-bosque px-5 py-3 font-semibold text-white">Volver al catálogo</Link>
    </section>
  )
}
