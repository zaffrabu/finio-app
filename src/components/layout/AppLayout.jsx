import { useState, useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { DataProvider, useData } from '../../contexts/DataContext'
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
        onClick={async () => {
          if ('caches' in window) {
            try { const ks = await caches.keys(); await Promise.all(ks.map(k => caches.delete(k))) } catch {}
          }
          if ('serviceWorker' in navigator) {
            try {
              const regs = await navigator.serviceWorker.getRegistrations()
              await Promise.all(regs.map(r => r.unregister()))
            } catch {}
          }
          window.location.reload()
        }}
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
  const [waitingWorker, setWaitingWorker] = useState(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const checkForWaiting = (reg) => {
      if (reg.waiting) {
        setWaitingWorker(reg.waiting)
        return
      }
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (!newWorker) return
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker)
          }
        })
      })
    }

    navigator.serviceWorker.ready.then(checkForWaiting)

    // Also reload when the new SW takes control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [])

  const handleUpdate = async () => {
    // 1. Tell waiting SW to activate
    if (waitingWorker) {
      try { waitingWorker.postMessage({ type: 'SKIP_WAITING' }) } catch {}
    }
    // 2. Clear ALL caches (critical for Safari)
    if ('caches' in window) {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map(k => caches.delete(k)))
      } catch {}
    }
    // 3. Hard reload
    window.location.reload()
  }

  if (!waitingWorker) return null

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
        onClick={handleUpdate}
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

// Banner shown while auto-syncing local data to Supabase
function CloudSyncBanner() {
  const { cloudSyncing, cloudSyncDone, transactions } = useData()
  const [visible, setVisible] = useState(false)

  useEffect(() => { if (cloudSyncing || cloudSyncDone) setVisible(true) }, [cloudSyncing, cloudSyncDone])
  useEffect(() => { if (cloudSyncDone) { const t = setTimeout(() => setVisible(false), 4000); return () => clearTimeout(t) } }, [cloudSyncDone])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9997, background: 'var(--bg-surface)',
      border: `1px solid ${cloudSyncDone ? 'var(--acento)' : 'var(--aviso)'}`,
      borderRadius: 12, padding: '10px 18px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: "'Poppins', sans-serif", fontSize: 13,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)', whiteSpace: 'nowrap',
    }}>
      {cloudSyncing ? (
        <>
          <div style={{ width: 16, height: 16, border: '2px solid var(--aviso)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'authSpin 0.6s linear infinite' }} />
          <span>Sincronizando {transactions.length} movimientos a la nube…</span>
        </>
      ) : (
        <>
          <span style={{ color: 'var(--acento)' }}>✅</span>
          <span>Datos sincronizados correctamente</span>
        </>
      )}
    </div>
  )
}

function AppInner() {
  const [collapsed, setCollapsed] = useState(false)
  const bannerVisible = !supabaseReady
  return (
    <>
      {bannerVisible && <StaleAppBanner />}
      <UpdateBanner />
      <CloudSyncBanner />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="main-area" style={bannerVisible ? { marginTop: 48 } : undefined}>
        <Topbar />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
      <MobileBottomNav />
    </>
  )
}

export default function AppLayout() {
  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  )
}
