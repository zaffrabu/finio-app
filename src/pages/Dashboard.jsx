import StatCard from '../components/dashboard/StatCard'
import WeeklyChart from '../components/dashboard/WeeklyChart'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import MonthSelector from '../components/ui/MonthSelector'
import { BUDGETS } from '../data/sampleData'

function fmt(n) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function filterByMonth(transactions, month) {
  return transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
  })
}

export default function Dashboard({ transactions, selectedMonth, onMonthChange }) {
  const tx = filterByMonth(transactions, selectedMonth)

  const totalIngresos = tx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalGastos   = tx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalAhorro   = tx.filter(t => t.tipo === 'Ahorro').reduce((s, t) => s + Math.abs(t.amount), 0)
  const saldo         = totalIngresos - totalGastos
  const savingRate    = totalIngresos > 0 ? Math.round((totalAhorro / totalIngresos) * 100) : 0

  const sueldo  = tx.filter(t => t.category === 'Sueldo').reduce((s, t) => s + t.amount, 0)
  const dogCare = tx.filter(t => t.category === 'Cuidado canino').reduce((s, t) => s + t.amount, 0)

  const gastosFijos     = tx.filter(t => t.tipo === 'Fijo'     && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const gastosVariables = tx.filter(t => t.tipo === 'Variable' && t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const gastosDeuda     = tx.filter(t => t.tipo === 'Deuda').reduce((s, t) => s + Math.abs(t.amount), 0)

  const spentByCategory = {}
  tx.filter(t => t.amount < 0).forEach(t => {
    spentByCategory[t.category] = (spentByCategory[t.category] || 0) + Math.abs(t.amount)
  })
  const budgetStatus = BUDGETS.map(b => ({
    ...b,
    spent: spentByCategory[b.category] || 0,
    pct:   Math.min(((spentByCategory[b.category] || 0) / b.budget) * 100, 100),
    over:  (spentByCategory[b.category] || 0) > b.budget,
  })).sort((a, b) => b.pct - a.pct).slice(0, 4)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-medium text-primary">Dashboard</h1>
        <MonthSelector value={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Saldo neto"
          value={fmt(saldo)}
          sub="ingresos − gastos"
          accent="#042C53"
        />
        <StatCard
          label="Ingresos"
          value={fmt(totalIngresos)}
          sub={`Sueldo ${fmt(sueldo)} · Perros ${fmt(dogCare)}`}
          accent="#0F6E56"
        />
        <StatCard
          label="Gastos"
          value={fmt(totalGastos)}
          sub={`Fijos ${fmt(gastosFijos)} · Variables ${fmt(gastosVariables)}`}
          accent="#993C1D"
        />
        <StatCard
          label="Ahorro del mes"
          value={fmt(totalAhorro)}
          sub={`${savingRate}% tasa de ahorro`}
          accent="#042C53"
        />
      </div>

      {/* Chart + Budget */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3">
          <WeeklyChart />
        </div>
        <div className="col-span-2 bg-card rounded-lg border border-border shadow-card px-5 py-5">
          <p className="text-sm font-medium text-primary mb-4">Top presupuestos</p>
          <div className="space-y-4">
            {budgetStatus.map(({ category, spent, budget, pct, over }) => (
              <div key={category}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs text-secondary truncate pr-2">{category}</span>
                  <span
                    className="text-xs font-medium tabular whitespace-nowrap"
                    style={{ color: over ? '#993C1D' : '#9CA3AF' }}
                  >
                    {fmt(spent)} / {fmt(budget)}
                  </span>
                </div>
                <div className="h-1.5 bg-page rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: over ? '#993C1D' : '#185FA5' }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-2 gap-3">
            <div>
              <p className="text-2xs text-muted">Gastos fijos</p>
              <p className="text-sm font-medium tabular mt-0.5" style={{ color: '#993C1D' }}>{fmt(gastosFijos)}</p>
            </div>
            <div>
              <p className="text-2xs text-muted">Deuda mensual</p>
              <p className="text-sm font-medium tabular mt-0.5" style={{ color: '#854F0B' }}>{fmt(gastosDeuda)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Income + debt strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted mb-1">Sueldo Acceleralia</p>
          <p className="text-xl font-medium tabular" style={{ color: '#0F6E56' }}>{fmt(sueldo)}</p>
          <p className="text-2xs text-muted mt-1">{totalIngresos > 0 ? Math.round((sueldo / totalIngresos) * 100) : 0}% del total de ingresos</p>
          <div className="h-1 bg-page rounded-full mt-2">
            <div className="h-full rounded-full" style={{ width: `${totalIngresos > 0 ? (sueldo / totalIngresos) * 100 : 0}%`, backgroundColor: '#0F6E56' }} />
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted mb-1">Cuidado canino</p>
          <p className="text-xl font-medium tabular" style={{ color: '#0F6E56' }}>{fmt(dogCare)}</p>
          <p className="text-2xs text-muted mt-1">{totalIngresos > 0 ? Math.round((dogCare / totalIngresos) * 100) : 0}% del total de ingresos</p>
          <div className="h-1 bg-page rounded-full mt-2">
            <div className="h-full rounded-full" style={{ width: `${totalIngresos > 0 ? (dogCare / totalIngresos) * 100 : 0}%`, backgroundColor: '#185FA5' }} />
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted mb-1">Deuda BBVA restante</p>
          <p className="text-xl font-medium tabular" style={{ color: '#854F0B' }}>≈ 1.890 €</p>
          <p className="text-2xs text-muted mt-1">164,62 €/mes · hasta oct 2027</p>
          <div className="h-1 bg-page rounded-full mt-2">
            <div className="h-full rounded-full" style={{ width: '63%', backgroundColor: '#854F0B' }} />
          </div>
        </div>
      </div>

      <RecentTransactions transactions={tx} />
    </div>
  )
}
