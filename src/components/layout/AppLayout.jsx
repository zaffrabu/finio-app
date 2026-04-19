import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { DataProvider } from '../../contexts/DataContext'
import { supabaseReady } from '../../lib/supabase'

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

// Banner shown when the app is cached without Supabase credentials (old SW version)
function StaleAppBanner() {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#B87D00', color: '#fff',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
      fontFamily: "'Poppins', sans-serif", fontSize: 13, fontWeight: 500,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <span style={{ fontSize: 18 }}>⚠️</span>
      <span style={{ flex: 1 }}>
        La app está desactualizada y no puede conectar con tu cuenta. Recarga para solucionarlo.
      </span>
      <button
        onClick={() => window.location.reload(true)}
        style={{
          background: '#fff', color: '#B87D00', border: 'none', borderRadius: 7,
          padding: '6px 14px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        🔄 Recargar
      </button>
      <button
        onClick={() => setDismissed(true)}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
      >
        ✕
      </button>
    </div>
  )
}

// Banner shown when a new service worker is ready
function UpdateBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.ready.then(reg => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setShow(true)
          }
        })
      })
    })
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9998, background: 'var(--bg-surface)',
      border: '1px solid var(--acento)', borderRadius: 12,
      padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12,
      fontFamily: "'Poppins', sans-serif", fontSize: 13,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
    }}>
      <span>🆕 Nueva versión disponible</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: 'var(--acento)', color: '#fff', border: 'none', borderRadius: 7,
          padding: '6px 14px', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}
      >
        Actualizar
      </button>
    </div>
  )
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <DataProvider>
      {!supabaseReady && <StaleAppBanner />}
      <UpdateBanner />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="main-area" style={!supabaseReady ? { marginTop: 48 } : undefined}>
        <Topbar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      <MobileBottomNav />
    </DataProvider>
  )
}
