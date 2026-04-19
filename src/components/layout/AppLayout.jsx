import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { DataProvider } from '../../contexts/DataContext'

const MOBILE_NAV = [
  { to: '/',             icon: '🏠', label: 'Inicio' },
  { to: '/movimientos',  icon: '📋', label: 'Movimientos' },
  { to: '/anual',        icon: '📅', label: 'Anual' },
  { to: '/proyecciones', icon: '📈', label: 'Proyección' },
  { to: '/ajustes',      icon: '⚙️', label: 'Ajustes' },
]

function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav">
      {MOBILE_NAV.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `mbn-item${isActive ? ' active' : ''}`}
        >
          <span className="mbn-icon">{item.icon}</span>
          <span className="mbn-label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <DataProvider>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="main-area">
        <Topbar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      <MobileBottomNav />
    </DataProvider>
  )
}
