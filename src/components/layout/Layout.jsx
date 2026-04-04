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

export default function Layout({ user, onSignOut }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useIsMobile()

  // Close mobile drawer when resizing to desktop
  useEffect(() => { if (!isMobile) setMobileOpen(false) }, [isMobile])

  const sidebarWidth = isMobile ? 208 : (collapsed ? 56 : 208)
  const mainMargin   = isMobile ? 0 : sidebarWidth

  return (
    <div className="min-h-screen bg-page">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-12 bg-sidebar border-b border-border z-30 flex items-center px-4 gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded text-muted hover:text-primary transition-colors"
          aria-label="Abrir menú"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: '#185FA5' }}>
            <span className="text-white font-bold text-xs leading-none" style={{ fontFamily: 'Georgia, serif' }}>F</span>
          </div>
          <span className="font-medium text-sm tracking-tight" style={{ color: '#042C53' }}>Finio</span>
        </div>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Navbar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        sidebarWidth={sidebarWidth}
        user={user}
        onSignOut={onSignOut}
      />

      <main
        className="min-h-screen transition-all duration-200"
        style={{ marginLeft: mainMargin, paddingTop: isMobile ? 48 : 0 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
