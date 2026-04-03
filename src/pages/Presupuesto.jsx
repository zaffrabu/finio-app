import { BUDGETS } from '../data/sampleData'
import MonthSelector from '../components/ui/MonthSelector'

function fmt(n) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

const TIPO_STYLES = {
  Fijo:     { bar: '#217d8f', badge: 'bg-fixed-bg text-fixed-text border border-fixed-border' },
  Variable: { bar: '#2599af', badge: 'bg-tri-50 text-tri-700 border border-tri-200' },
  Deuda:    { bar: '#a93ed1', badge: 'bg-debt-bg text-debt-text border border-debt-border' },
}

export default function Presupuesto({ transactions, selectedMonth, onMonthChange }) {
  const tx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear()
  })

  const spentByCategory = {}
  tx.filter(t => t.amount < 0).forEach(t => {
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Math.abs(t.amount)
  })

  const totalBudget = BUDGETS.reduce((s, b) => s + b.budget, 0)
  const totalSpent  = BUDGETS.reduce((s, b) => s + (spentByCategory[b.category] || 0), 0)
  const totalLeft   = totalBudget - totalSpent

  const items = BUDGETS.map(b => ({
    ...b,
    spent: spentByCategory[b.category] || 0,
    left:  b.budget - (spentByCategory[b.category] || 0),
    pct:   Math.min(((spentByCategory[b.category] || 0) / b.budget) * 100, 100),
    over:  (spentByCategory[b.category] || 0) > b.budget,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-primary">Presupuesto</h1>
          <p className="text-sm text-muted mt-0.5">Seguimiento mensual</p>
        </div>
        <MonthSelector value={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted mb-1.5">Presupuestado</p>
          <p className="text-2xl font-medium text-primary tabular">{fmt(totalBudget)}</p>
        </div>
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted mb-1.5">Gastado</p>
          <p className={`text-2xl font-medium tabular ${totalSpent > totalBudget ? 'text-expense-text' : 'text-primary'}`}>
            {fmt(totalSpent)}
          </p>
        </div>
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted mb-1.5">Disponible</p>
          <p className={`text-2xl font-medium tabular ${totalLeft < 0 ? 'text-expense-text' : 'text-income-text'}`}>
            {fmt(totalLeft)}
          </p>
        </div>
      </div>

      {/* Global progress */}
      <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
        <div className="flex justify-between text-xs text-muted mb-2">
          <span>Progreso total del presupuesto Finio</span>
          <span className="tabular font-medium text-tri-700">{Math.round((totalSpent / totalBudget) * 100)}%</span>
        </div>
        <div className="h-2 bg-page rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%`,
              backgroundColor: totalSpent > totalBudget ? '#DC2626' : '#2599af',
            }}
          />
        </div>
      </div>

      {/* Category list */}
      <div className="bg-card rounded-lg border border-border shadow-card divide-y divide-border/40">
        <div className="px-5 py-3 grid grid-cols-12 text-xs font-medium text-muted">
          <span className="col-span-4">Categoría</span>
          <span className="col-span-4">Progreso</span>
          <span className="col-span-2 text-right">Gastado</span>
          <span className="col-span-2 text-right">Disponible</span>
        </div>
        {items.map(({ category, spent, budget, left, pct, over, tipo }) => {
          const style = TIPO_STYLES[tipo] || TIPO_STYLES.Variable
          return (
            <div key={category} className="px-5 py-4 grid grid-cols-12 items-center gap-2 hover:bg-tri-50/30 transition-colors">
              <div className="col-span-4 flex items-center gap-2">
                <span className={`text-2xs font-medium px-1.5 py-0.5 rounded ${style.badge}`}>
                  {tipo}
                </span>
                <span className="text-sm text-primary truncate">{category}</span>
              </div>
              <div className="col-span-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-page rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: over ? '#DC2626' : style.bar }}
                    />
                  </div>
                  <span className={`text-2xs tabular w-8 text-right ${over ? 'text-expense-text font-medium' : 'text-muted'}`}>
                    {Math.round(pct)}%
                  </span>
                </div>
              </div>
              <div className="col-span-2 text-right">
                <span className="text-sm text-primary tabular">{fmt(spent)}</span>
                <span className="text-xs text-muted block">de {fmt(budget)}</span>
              </div>
              <div className="col-span-2 text-right">
                <span className={`text-sm font-medium tabular ${left < 0 ? 'text-expense-text' : 'text-income-text'}`}>
                  {fmt(left)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
