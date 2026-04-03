import { CATEGORIES, BUDGETS } from '../data/sampleData'
import { CATEGORY_COLORS } from '../components/ui/CategoryDot'
import MonthSelector from '../components/ui/MonthSelector'

function fmt(n) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

export default function Categories({ transactions, selectedMonth, onMonthChange }) {
  const tx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear()
  })

  const expenses = tx.filter(t => t.amount < 0)
  const totalGastos = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const budgetMap = Object.fromEntries(BUDGETS.map(b => [b.category, b.budget]))

  const byCategory = CATEGORIES.map(cat => {
    const txs   = expenses.filter(t => t.category === cat)
    const total = txs.reduce((s, t) => s + Math.abs(t.amount), 0)
    return {
      cat, total, count: txs.length,
      pct:    totalGastos > 0 ? (total / totalGastos) * 100 : 0,
      budget: budgetMap[cat] || null,
      color:  CATEGORY_COLORS[cat] ?? '#9CA3AF',
    }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-primary">Categorías</h1>
          <p className="text-sm text-muted mt-0.5">Gastos del mes — {fmt(totalGastos)} total</p>
        </div>
        <MonthSelector value={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Distribution bar */}
      <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
        <p className="text-xs text-muted mb-3">Distribución de gastos</p>
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {byCategory.map(({ cat, pct, color }) => (
            <div
              key={cat}
              className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              style={{ width: `${pct}%`, backgroundColor: color }}
              title={`${cat}: ${pct.toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {byCategory.slice(0, 6).map(({ cat, pct, color }) => (
            <div key={cat} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-xs text-secondary">{cat}</span>
              <span className="text-xs text-muted tabular">{pct.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Category cards */}
      <div className="space-y-2">
        {byCategory.map(({ cat, total, count, pct, budget, color }) => {
          const budgetPct = budget ? Math.min((total / budget) * 100, 100) : null
          const over      = budget && total > budget

          return (
            <div key={cat} className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">{cat}</p>
                    <p className="text-xs text-muted">
                      {count} transacción{count !== 1 ? 'es' : ''} · {pct.toFixed(1)}% del total
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary tabular">{fmt(total)}</p>
                  {budget && (
                    <p className="text-xs tabular mt-0.5" style={{ color: over ? '#993C1D' : '#9CA3AF' }}>
                      {over ? `+${fmt(total - budget)} sobre límite` : `${fmt(budget - total)} restante`}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-1.5 bg-page rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>

              {budget && (
                <div className="mt-2">
                  <div className="flex justify-between text-2xs text-muted mb-1">
                    <span>Presupuesto {fmt(budget)}</span>
                    <span className="tabular">{Math.round(budgetPct)}%</span>
                  </div>
                  <div className="h-1 bg-page rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${budgetPct}%`, backgroundColor: over ? '#993C1D' : color, opacity: 0.55 }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {byCategory.length === 0 && (
          <p className="text-sm text-muted text-center py-16">No hay gastos en este mes.</p>
        )}
      </div>
    </div>
  )
}
