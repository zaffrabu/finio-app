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

function NavItem({ to, label, end, icon, collapsed }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
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

export default function Navbar({ collapsed, onToggle }) {
  return (
    <aside
      className="fixed top-0 left-0 h-screen bg-sidebar border-r border-border flex flex-col z-40 overflow-hidden transition-all duration-200"
      style={{ width: collapsed ? 56 : 208 }}
    >
      {/* Brand */}
      <div className="px-3 pt-6 pb-5 border-b border-border/50 flex-shrink-0">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
            style={{ backgroundColor: '#185FA5' }}
          >
            <span className="text-white font-bold text-sm leading-none" style={{ fontFamily: 'Georgia, serif' }}>F</span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="font-medium text-sm tracking-tight whitespace-nowrap" style={{ color: '#042C53' }}>Finio</span>
              <p className="text-2xs text-muted leading-none mt-0.5 whitespace-nowrap">Finanzas personales</p>
            </div>
          )}
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 pt-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {mainLinks.map(l => <NavItem key={l.to} {...l} collapsed={collapsed} />)}

        {/* Divider — sección Inteligencia */}
        <div className="pt-3 pb-1">
          {!collapsed && (
            <p className="px-3 text-2xs font-medium text-muted uppercase tracking-widest whitespace-nowrap">Inteligencia</p>
          )}
        </div>
        <div className="h-px bg-border/60 mx-1 mb-2" />

        {aiLinks.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            title={collapsed ? l.label : undefined}
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
                <span className="flex-shrink-0" style={{ color: isActive ? '#185FA5' : '#9CA3AF' }}>{l.icon}</span>
                {!collapsed && (
                  <>
                    <span className="truncate">{l.label}</span>
                    {!isActive && (
                      <span
                        className="ml-auto text-2xs font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#E6F1FB', color: '#185FA5' }}
                      >
                        IA
                      </span>
                    )}
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-5 py-4 border-t border-border/50 flex-shrink-0">
          <p className="text-2xs text-muted whitespace-nowrap">Finio · Marzo 2026</p>
        </div>
      )}

      {/* Toggle button — sits on the right border, vertically centered */}
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
    </aside>
  )
}
