import { NavLink } from 'react-router-dom'

const mainLinks = [
  {
    to: '/', label: 'Dashboard', end: true,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  },
  {
    to: '/transacciones', label: 'Transacciones', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  },
  {
    to: '/presupuesto', label: 'Presupuesto', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  {
    to: '/categorias', label: 'Categorías', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  },
  {
    to: '/subir', label: 'Subir extracto', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  },
]

const aiLinks = [
  {
    to: '/coach', label: 'Finio Coach', end: false,
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/></svg>,
  },
]

function NavItem({ to, label, end, icon, collapsed, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded text-sm transition-colors ${isActive ? 'font-medium' : 'hover:bg-page'}`
      }
      style={({ isActive }) =>
        isActive
          ? { backgroundColor: '#E6F1FB', color: '#185FA5' }
          : { color: '#2C2C2A' }
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex-shrink-0" style={{ color: isActive ? '#185FA5' : '#9CA3AF' }}>{icon}</span>
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function Navbar({ collapsed, onToggle, isMobile, mobileOpen, onMobileClose, sidebarWidth, user, onSignOut, coachAlertCount = 0, isSuperadmin = false }) {
  // On mobile: slide in/out via transform. On desktop: always visible.
  const translateClass = isMobile
    ? (mobileOpen ? 'translate-x-0' : '-translate-x-full')
    : 'translate-x-0'

  const handleLinkClick = () => { if (isMobile) onMobileClose() }

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-sidebar border-r border-border flex flex-col z-40 overflow-hidden transition-all duration-200 ${translateClass}`}
      style={{ width: sidebarWidth }}
    >
      {/* Brand */}
      <div className="px-3 pt-6 pb-5 border-b border-border/50 flex-shrink-0">
        <div className={`flex items-center ${collapsed && !isMobile ? 'justify-center' : 'gap-2.5'}`}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
            style={{ backgroundColor: '#185FA5' }}
          >
            <span className="text-white font-bold text-sm leading-none" style={{ fontFamily: 'Georgia, serif' }}>F</span>
          </div>
          {(!collapsed || isMobile) && (
            <div className="overflow-hidden">
              <span className="font-medium text-sm tracking-tight whitespace-nowrap" style={{ color: '#042C53' }}>Finio</span>
              <p className="text-2xs text-muted leading-none mt-0.5 whitespace-nowrap">Finanzas personales</p>
            </div>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 pt-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {mainLinks.map(l => (
          <NavItem key={l.to} {...l} collapsed={collapsed && !isMobile} onClick={handleLinkClick} />
        ))}

        {isSuperadmin && (
          <>
            <div className="pt-3 pb-1">
              {(!collapsed || isMobile) && (
                <p className="px-3 text-2xs font-medium text-muted uppercase tracking-widest whitespace-nowrap">Admin</p>
              )}
            </div>
            <div className="h-px bg-border/60 mx-1 mb-2" />
            <NavItem
              to="/admin"
              label="Panel Admin"
              end={false}
              collapsed={collapsed && !isMobile}
              onClick={handleLinkClick}
              icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            />
          </>
        )}

        <div className="pt-3 pb-1">
          {(!collapsed || isMobile) && (
            <p className="px-3 text-2xs font-medium text-muted uppercase tracking-widest whitespace-nowrap">Inteligencia</p>
          )}
        </div>
        <div className="h-px bg-border/60 mx-1 mb-2" />

        {aiLinks.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            title={collapsed && !isMobile ? l.label : undefined}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `relative flex items-center ${collapsed && !isMobile ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded text-sm transition-colors ${isActive ? 'font-medium' : 'hover:bg-page'}`
            }
            style={({ isActive }) =>
              isActive
                ? { backgroundColor: '#E6F1FB', color: '#185FA5' }
                : { color: '#2C2C2A' }
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative flex-shrink-0" style={{ color: isActive ? '#185FA5' : '#9CA3AF' }}>
                  {l.icon}
                  {collapsed && !isMobile && coachAlertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 border border-sidebar" />
                  )}
                </span>
                {(!collapsed || isMobile) && (
                  <>
                    <span className="truncate">{l.label}</span>
                    {!isActive && (
                      <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                        {coachAlertCount > 0 && (
                          <span
                            className="w-4 h-4 rounded-full text-white flex items-center justify-center font-bold flex-shrink-0"
                            style={{ backgroundColor: '#993C1D', fontSize: '9px' }}
                          >
                            {coachAlertCount}
                          </span>
                        )}
                        <span
                          className="text-2xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: '#E6F1FB', color: '#185FA5' }}
                        >
                          IA
                        </span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer — user info + settings + logout */}
      <div className="border-t border-border/50 flex-shrink-0">
        {(!collapsed || isMobile) ? (
          <div className="px-3 py-3 flex items-center gap-2.5">
            <NavLink
              to="/ajustes"
              onClick={handleLinkClick}
              title="Ajustes"
              className="flex items-center gap-2.5 flex-1 min-w-0 rounded hover:bg-page px-1 py-0.5 transition-colors"
            >
              {({ isActive }) => (
                <>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                    style={{ backgroundColor: isActive ? '#0F6E56' : '#185FA5' }}
                  >
                    {user?.email?.[0]?.toUpperCase() ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary truncate">{user?.email ?? 'Usuario'}</p>
                    <p className="text-2xs text-muted">Ajustes y cuenta</p>
                  </div>
                </>
              )}
            </NavLink>
            <button
              onClick={onSignOut}
              title="Cerrar sesión"
              className="p-1.5 rounded text-muted hover:text-primary hover:bg-page transition-colors flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center py-2 gap-1">
            <NavLink
              to="/ajustes"
              onClick={handleLinkClick}
              title="Ajustes"
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium transition-colors"
              style={{ backgroundColor: '#185FA5' }}
            >
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </NavLink>
            <button
              onClick={onSignOut}
              title="Cerrar sesión"
              className="p-1.5 rounded text-muted hover:text-primary hover:bg-page transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Desktop collapse toggle — hidden on mobile */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute top-1/2 -translate-y-1/2 right-0 translate-x-1/2 w-5 h-5 rounded-full bg-card border border-border shadow-sm flex items-center justify-center hover:bg-page transition-colors z-50"
          style={{ color: '#9CA3AF' }}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <polyline points="9 18 15 12 9 6" />
              : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      )}
    </aside>
  )
}
