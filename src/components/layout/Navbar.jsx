import { NavLink } from 'react-router-dom'

const mainLinks = [
  { to: '/', label: 'Dashboard', end: true, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { to: '/transacciones', label: 'Transacciones', end: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
  { to: '/presupuesto', label: 'Presupuesto', end: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
  { to: '/previstos', label: 'Previstos', end: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="m9 16 2 2 4-4"/></svg> },
  { to: '/categorias', label: 'Categorías', end: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> },
  { to: '/subir', label: 'Subir extracto', end: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> },
]

const aiLinks = [
  { to: '/coach', label: 'Finio Coach', end: false, icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/></svg> },
]

function NavItem({ to, label, end, icon, collapsed, onClick }) {
  return (
    <NavLink
      to={to} end={end} onClick={onClick}
      className={({ isActive }) =>
        `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded text-sm transition-colors ${
          isActive ? 'bg-tri-600/10 text-tri-600 font-medium' : 'text-secondary hover:bg-page hover:text-primary'
        }`
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </NavLink>
  )
}

export default function Navbar({ collapsed, onToggle, isMobile, mobileOpen, onMobileClose, sidebarWidth, user, onSignOut }) {
  const translateClass = isMobile ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-card border-r border-border flex flex-col z-40 overflow-hidden transition-all duration-300 ${translateClass}`}
      style={{ width: sidebarWidth }}
    >
      <div className="px-4 pt-6 pb-6 border-b border-border flex items-center gap-3">
         <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-card font-bold text-sm">F</span>
         </div>
         {!collapsed && <span className="font-bold text-primary tracking-tight">Finio</span>}
      </div>

      <nav className="flex-1 px-2 pt-4 space-y-1">
        {mainLinks.map(l => <NavItem key={l.to} {...l} collapsed={collapsed && !isMobile} onClick={() => isMobile && onMobileClose()} />)}
        <div className="pt-8 pb-2">
           {!collapsed && <p className="px-3 text-[10px] font-bold text-muted uppercase tracking-widest">IA & Plan</p>}
        </div>
        {aiLinks.map(l => <NavItem key={l.to} {...l} collapsed={collapsed && !isMobile} onClick={() => isMobile && onMobileClose()} />)}
      </nav>

      <div className="p-4 border-t border-border">
        {!collapsed ? (
           <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-card text-xs font-bold">
                 {user?.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-xs font-bold text-primary truncate">{user?.email}</p>
                 <button onClick={onSignOut} className="text-2xs text-secondary hover:underline">Salir</button>
              </div>
           </div>
        ) : (
           <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-card text-xs font-bold">
                 {user?.email?.[0]?.toUpperCase()}
              </div>
           </div>
        )}
      </div>
    </aside>
  )
}
