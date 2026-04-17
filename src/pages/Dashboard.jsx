import WeeklyChart from '../components/dashboard/WeeklyChart'
import RecentTransactions from '../components/dashboard/RecentTransactions'
import MonthSelector from '../components/ui/MonthSelector'

function fmt(n) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function filterByMonth(transactions, month) {
  return transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
  })
}

function StatCard({ label, value, sub, colorClass }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-card transition-all hover:translate-y-[-2px]">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-bold tabular ${colorClass || 'text-primary'}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-2">{sub}</p>}
    </div>
  )
}

export default function Dashboard({ transactions, selectedMonth, onMonthChange, cats }) {
  const tx = filterByMonth(transactions, selectedMonth)
  const totalIngresos = tx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalGastos   = tx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const saldo = totalIngresos - totalGastos
  const savingRate = totalIngresos > 0 ? Math.round(((totalIngresos - totalGastos) / totalIngresos) * 100) : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Resumen Mensual</h1>
          <p className="text-sm text-secondary">Control total de tus finanzas</p>
        </div>
        <MonthSelector value={selectedMonth} onChange={onMonthChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Saldo neto" value={fmt(saldo)} sub="Disponible este mes" colorClass={saldo >= 0 ? 'text-income-text' : 'text-expense-text'} />
        <StatCard label="Ingresos" value={fmt(totalIngresos)} sub="Total acumulado" />
        <StatCard label="Gastos" value={fmt(totalGastos)} sub="Variable + Fijo" />
        <StatCard label="Tasa de Ahorro" value={`${savingRate}%`} sub="Retención de capital" colorClass="text-tri-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-6">Actividad Semanal</h3>
            <div className="h-64">
              <WeeklyChart transactions={tx} selectedMonth={selectedMonth} />
            </div>
          </div>
          <RecentTransactions transactions={tx} />
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Presupuestos Clave</h3>
            <div className="space-y-5">
              {cats?.budgets?.slice(0, 4).map(b => {
                const spent = tx.filter(t => t.category === b.category && t.amount < 0).reduce((s,t) => s + Math.abs(t.amount), 0)
                const pct = Math.min((spent / b.budget) * 100, 100)
                const over = spent > b.budget
                return (
                  <div key={b.category}>
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-xs font-bold text-secondary uppercase truncate pr-2">{b.category}</span>
                      <span className={`text-xs tabular font-medium ${over ? 'text-expense-text' : 'text-primary'}`}>{Math.round(pct)}%</span>
                    </div>
                    <div className="h-2 bg-page rounded-full overflow-hidden">
                      <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: over ? '#F43F5E' : '#38BDF8' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-primary text-card rounded-xl p-6 shadow-card">
             <h4 className="font-bold text-lg mb-2">Finio Coach</h4>
             <p className="text-xs opacity-80 mb-4">"He detectado que puedes ahorrar 120€ más si optimizas tus servicios de Vivienda."</p>
             <button onClick={() => window.location.hash = '#/coach'} className="w-full py-2 bg-white text-primary font-bold text-xs rounded-lg hover:bg-tri-50 transition-colors">
                Ver Recomendación
             </button>
          </div>
        </div>
      </div>
    </div>
  )
}
