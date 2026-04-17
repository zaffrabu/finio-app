import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'

const navSections = [
  {
    label: 'Principal',
    items: [
      { to: '/',             icon: '🏠', label: 'Dashboard' },
      { to: '/anual',        icon: '📅', label: 'Vista anual' },
      { to: '/movimientos',  icon: '📋', label: 'Movimientos' },
      { to: '/alertas',      icon: '🔔', label: 'Alertas', badge: '3' },
    ],
  },
  {
    label: 'Herramientas',
    items: [
      { to: '/proyecciones',   icon: '📈', label: 'Proyecciones' },
      { to: '/conciliaciones', icon: '⚖️', label: 'Conciliaciones' },
      { to: '/recurrentes',    icon: '📦', label: 'Recurrentes', badge: '8', badgeGreen: true },
      { to: '/ajustes',      icon: '⚙️', label: 'Ajustes' },
    ],
  },
]

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuthContext()

  const userEmail = user?.email || ''
  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : 'U'

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <button className="sidebar-toggle" onClick={onToggle} title={collapsed ? 'Expandir menú' : 'Contraer menú'}>
          <span>{collapsed ? '▶' : '◀'}</span>
        </button>
        <div className="logo-wrap">
          <div className="logo-text">finio</div>
          <div className="logo-dot"></div>
        </div>
      </div>

      {/* Nav sections */}
      {navSections.map((section) => (
        <div className="sidebar-section" key={section.label}>
          <div className="sidebar-section-label">{section.label}</div>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && (
                <span className={`nav-badge${item.badgeGreen ? ' nav-badge-green' : ''}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      ))}

      {/* Bottom */}
      <div className="sidebar-bottom">
        <button className="import-btn" onClick={() => navigate('/importar')}>
          <span>↑</span>
          <span className="import-btn-label">Importar extracto</span>
        </button>
        <div className="user-row" style={{ cursor: 'pointer' }} onClick={handleLogout} title="Cerrar sesión">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{userEmail}</div>
            <div className="user-plan">CERRAR SESIÓN</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
