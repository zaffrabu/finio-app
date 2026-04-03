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
    </div>
  )
}
