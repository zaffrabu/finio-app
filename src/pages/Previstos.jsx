import { useState, useEffect } from 'react'
import MonthSelector from '../components/ui/MonthSelector'

function fmt(n) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

const STORAGE_KEY = 'finio_planned_items'

export default function Previstos({ transactions, selectedMonth, onMonthChange, cats }) {
  const [planned, setPlanned] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : [
        { id: '1', name: 'Nómina Acceleralia', amount: 2100, type: 'Ingreso', category: 'Sueldo', day: 1 },
        { id: '2', name: 'Zaffra & Panther (Est.)', amount: 450, type: 'Ingreso', category: 'Cuidado canino', day: 15 },
        { id: '3', name: 'Ventas Zaffly', amount: 150, type: 'Ingreso', category: 'Ingreso SaaS', day: 20 },
        { id: '4', name: 'Alquiler / Hipoteca', amount: -850, type: 'Gasto', category: 'Vivienda', day: 1 },
        { id: '5', name: 'Autónomos / Seguros', amount: -320, type: 'Gasto', category: 'Seguros y salud', day: 30 },
      ]
    } catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(planned))
  }, [planned])

  const [adding, setAdding] = useState(null) // 'Ingreso' | 'Gasto'

  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear()
  })

  // Check which planned items have already occurred
  const itemsWithStatus = planned.map(p => {
    const isIncome = p.amount > 0
    const matchedTx = currentMonthTx.find(t => {
      const descMatch = t.description.toLowerCase().includes(p.name.split(' ')[0].toLowerCase())
      const amountMatch = Math.abs(t.amount - p.amount) < Math.abs(p.amount * 0.2) // 20% tolerance
      return descMatch || (isIncome === (t.amount > 0) && amountMatch)
    })
    return { ...p, occurred: !!matchedTx, actualAmount: matchedTx?.amount }
  })

  const totalPlannedIncome = planned.filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0)
  const totalPlannedExpense = planned.filter(p => p.amount < 0).reduce((s, p) => s + Math.abs(p.amount), 0)
  const projectBalance = totalPlannedIncome - totalPlannedExpense

  const ocurredIncome = itemsWithStatus.filter(p => p.amount > 0 && p.occurred).reduce((s, p) => s + p.amount, 0)
  const ocurredExpense = itemsWithStatus.filter(p => p.amount < 0 && p.occurred).reduce((s, p) => s + Math.abs(p.amount), 0)

  const pendingIncome = totalPlannedIncome - ocurredIncome
  const pendingExpense = totalPlannedExpense - ocurredExpense

  function addItem(e) {
    e.preventDefault()
    const fd = new FormData(e.target)
    const newItem = {
      id: crypto.randomUUID(),
      name: fd.get('name'),
      amount: parseFloat(fd.get('amount')) * (adding === 'Gasto' ? -1 : 1),
      type: adding,
      category: fd.get('category'),
      day: parseInt(fd.get('day')) || 1
    }
    setPlanned([...planned, newItem])
    setAdding(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-primary">Previstos</h1>
          <p className="text-sm text-muted mt-0.5">Planificación y Flujo de Caja</p>
        </div>
        <MonthSelector value={selectedMonth} onChange={onMonthChange} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border shadow-card p-5">
          <p className="text-xs text-muted mb-1">Ingresos Previstos</p>
          <p className="text-2xl font-semibold text-income-text tabular">{fmt(totalPlannedIncome)}</p>
          <p className="text-xs text-muted mt-2">Faltan por cobrar: {fmt(pendingIncome)}</p>
        </div>
        <div className="bg-card rounded-lg border border-border shadow-card p-5">
          <p className="text-xs text-muted mb-1">Gastos Previstos</p>
          <p className="text-2xl font-semibold text-expense-text tabular">{fmt(totalPlannedExpense)}</p>
          <p className="text-xs text-muted mt-2">Faltan por pagar: {fmt(pendingExpense)}</p>
        </div>
        <div className="bg-card rounded-lg border-2 border-tri-100 shadow-card p-5" style={{ backgroundColor: '#F0F7FF' }}>
          <p className="text-xs text-tri-700 font-medium mb-1">Resultado del Mes</p>
          <p className="text-2xl font-bold text-primary tabular">{fmt(projectBalance)}</p>
          <p className="text-xs text-tri-600 mt-2">Capacidad de ahorro proyectada</p>
        </div>
      </div>

      {/* Planning split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incomes */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-income-text" /> 
              Ingresos del mes
            </h2>
            <button onClick={() => setAdding('Ingreso')} className="text-xs text-tri-600 font-medium hover:underline">+ Añadir ingreso</button>
          </div>
          
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden divide-y divide-border/50">
            {itemsWithStatus.filter(p => p.amount > 0).map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-page/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.occurred ? 'bg-income-text' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-primary">{p.name}</p>
                    <p className="text-2xs text-muted">Día {p.day} · {p.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular text-primary">{fmt(p.amount)}</p>
                  {p.occurred ? (
                    <span className="text-2xs text-income-text font-medium">✓ Recibido</span>
                  ) : (
                    <span className="text-2xs text-muted">Pendiente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Expenses */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-expense-text" /> 
              Gastos esperados
            </h2>
            <button onClick={() => setAdding('Gasto')} className="text-xs text-tri-600 font-medium hover:underline">+ Añadir gasto</button>
          </div>
          
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden divide-y divide-border/50">
            {itemsWithStatus.filter(p => p.amount < 0).map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between hover:bg-page/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.occurred ? 'bg-expense-text' : 'bg-gray-300'}`} />
                  <div>
                    <p className="text-sm font-medium text-primary">{p.name}</p>
                    <p className="text-2xs text-muted">Día {p.day} · {p.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium tabular text-primary">{fmt(Math.abs(p.amount))}</p>
                  {p.occurred ? (
                    <span className="text-2xs text-expense-text font-medium">✓ Pagado</span>
                  ) : (
                    <span className="text-2xs text-muted">Pendiente</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Add Modal */}
      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <form onSubmit={addItem} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="font-medium text-primary">Añadir {adding} Previsto</h3>
              <button type="button" onClick={() => setAdding(null)} className="text-muted hover:text-primary">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Concepto</label>
                <input name="name" required autoFocus className="w-full text-sm border border-border rounded-md px-3 py-2 focus:ring-1 focus:ring-tri-400 outline-none" placeholder="Ej: Recibo de la Luz" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Importe (€)</label>
                  <input name="amount" type="number" step="0.01" required className="w-full text-sm border border-border rounded-md px-3 py-2 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Día del mes</label>
                  <input name="day" type="number" min="1" max="31" required className="w-full text-sm border border-border rounded-md px-3 py-2 outline-none" placeholder="1-31" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Categoría</label>
                <select name="category" className="w-full text-sm border border-border rounded-md px-3 py-2 outline-none bg-white">
                  {(cats?.categoryNames || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-page/50 border-t border-border flex justify-end gap-3">
              <button type="button" onClick={() => setAdding(null)} className="text-sm px-4 py-2 text-secondary">Cancelar</button>
              <button type="submit" className="text-sm px-4 py-2 bg-tri-600 text-white rounded-md font-medium">Guardar {adding}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
