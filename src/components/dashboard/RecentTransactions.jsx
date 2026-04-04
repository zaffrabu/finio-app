import { Link } from 'react-router-dom'
import AmountBadge from '../ui/AmountBadge'
import TypeBadge from '../ui/TypeBadge'
import CategoryDot from '../ui/CategoryDot'

export default function RecentTransactions({ transactions }) {
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7)

  return (
    <div className="bg-card rounded-lg border border-border shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <p className="text-sm font-medium text-primary">Últimas transacciones</p>
        <Link to="/transacciones" className="text-xs font-medium hover:underline" style={{ color: '#185FA5' }}>
          Ver todas →
        </Link>
      </div>
      {recent.length === 0 ? (
        <div className="px-5 py-12 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: '#EFF6FF' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-primary mb-1">Sin transacciones aún</p>
          <p className="text-xs text-muted mb-4 max-w-xs">Sube el extracto de tu banco para ver tus movimientos aquí.</p>
          <Link
            to="/subir"
            className="text-xs font-medium px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: '#185FA5' }}
          >
            Subir extracto
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {recent.map(t => (
            <li key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-page/60 transition-colors">
              <CategoryDot category={t.category} size={8} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary truncate">{t.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted">
                    {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                  </span>
                  {t.tipo && <TypeBadge tipo={t.tipo} />}
                </div>
              </div>
              <AmountBadge amount={t.amount} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
