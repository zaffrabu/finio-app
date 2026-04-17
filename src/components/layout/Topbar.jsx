import { useState, useEffect } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

const ROUTE_TITLES = {
  '/':             'Dashboard',
  '/movimientos':  'Movimientos',
  '/alertas':      'Alertas',
  '/proyecciones': 'Proyecciones',
  '/recurrentes':  'Recurrentes',
  '/categorias':   'Categorías',
  '/ajustes':      'Ajustes',
  '/importar':     'Importar extracto',
  '/conciliaciones': 'Conciliaciones',
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('finio-theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('finio-theme', theme)
  }, [theme])

  return (
    <div className="theme-toggle">
      <button
        className={`theme-btn${theme === 'light' ? ' active' : ''}`}
        onClick={() => setTheme('light')}
        title="Modo claro"
      >
        ☀️ <span className="theme-btn-label">Claro</span>
      </button>
      <button
        className={`theme-btn${theme === 'dark' ? ' active' : ''}`}
        onClick={() => setTheme('dark')}
        title="Modo oscuro"
      >
        🌙 <span className="theme-btn-label">Oscuro</span>
      </button>
    </div>
  )
}

export default function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const isAnual = location.pathname === '/anual'

  // On anual page: period comes from URL (?period=mes|trim|año), default año
  const urlPeriod = searchParams.get('period') || 'año'
  const urlYear   = searchParams.get('year')   || String(new Date().getFullYear())

  // For non-anual pages: local period state (cosmetic)
  const [localPeriod, setLocalPeriod] = useState('Mes')

  const activePeriod = isAnual ? urlPeriod : localPeriod.toLowerCase()

  const handlePeriod = (p) => {
    const key = p.toLowerCase().replace('.', '')
    if (isAnual) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.set('period', key)
        return next
      })
    } else {
      setLocalPeriod(p)
      // MES/TRIM/AÑO on other pages: navigate to anual for TRIM/AÑO
      if (key === 'año')  navigate('/anual?period=año')
      if (key === 'trim') navigate('/anual?period=trim')
    }
  }

  // Title: dynamic
  let title = ROUTE_TITLES[location.pathname] || 'finio'
  if (isAnual) {
    const periodLabel = urlPeriod === 'trim' ? 'Trimestral' : 'Anual'
    title = `Vista ${periodLabel} · ${urlYear}`
  } else if (location.pathname === '/') {
    title = `Dashboard · ${new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`
  } else if (location.pathname === '/movimientos') {
    title = `Movimientos · ${new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`
  }

  const periods = [
    { label: 'Mes',   key: 'mes' },
    { label: 'Trim.', key: 'trim' },
    { label: 'Año',   key: 'año' },
  ]

  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-right">
        <div className="period-tabs">
          {periods.map(({ label, key }) => (
            <button
              key={key}
              className={`period-tab${activePeriod === key ? ' active' : ''}`}
              onClick={() => handlePeriod(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="topbar-search">🔍 Buscar movimiento...</div>
        <button className="topbar-action" onClick={() => navigate('/importar')}>
          ↑ Importar
        </button>
        <ThemeToggle />
      </div>
    </div>
  )
}
