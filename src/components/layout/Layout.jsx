import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import { Outlet } from 'react-router-dom'

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [breakpoint])
  return isMobile
}

function ThemeToggle() {
  const [theme, setTheme] = useState(() => localStorage.getItem('finio_theme') || 'light')
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('finio_theme', theme)
  }, [theme])

  return (
    <button 
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="p-2 rounded-lg hover:bg-page transition-colors text-secondary hover:text-primary"
      title="Cambiar tema"
    >
      {theme === 'light' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="18.36" x2="5.64" y2="16.92"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
      )}
    </button>
  )
}

export default function Layout({ user, onSignOut, coachAlertCount = 0, isSuperadmin = false }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => { if (!isMobile) setMobileOpen(false) }, [isMobile])

  const sidebarWidth = isMobile ? 220 : (collapsed ? 64 : 220)
  const mainMargin   = isMobile ? 0 : sidebarWidth

  return (
    <div className="min-h-screen bg-page transition-colors duration-300">
      {/* Top Header for Dark Toggle & Stats (Optional) */}
      <div 
        className="fixed top-0 right-0 h-14 z-20 flex items-center px-6 gap-4"
        style={{ left: mainMargin }}
      >
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-30 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded text-secondary hover:text-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <span className="font-bold text-primary tracking-tight">Finio</span>
      </div>

      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30" onClick={() => setMobileOpen(false)} />}

      <Navbar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        sidebarWidth={sidebarWidth}
        user={user}
        onSignOut={onSignOut}
        coachAlertCount={coachAlertCount}
        isSuperadmin={isSuperadmin}
      />

      <main className="min-h-screen transition-all duration-300" style={{ marginLeft: mainMargin, paddingTop: 56 }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
