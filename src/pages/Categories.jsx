import { useState } from 'react'
import MonthSelector from '../components/ui/MonthSelector'
import AmountBadge from '../components/ui/AmountBadge'

function fmt(n) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function filterMonth(transactions, month) {
  return transactions.filter(t => {
    const d = new Date(t.date)
    return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()
  })
}

function TrendBadge({ current, previous }) {
  if (!previous || previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  const up = pct > 0
  if (Math.abs(pct) < 1) return null
  return (
    <span
      className="inline-flex items-center gap-0.5 text-2xs font-medium px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: up ? '#FAECE7' : '#EAF3DE',
        color: up ? '#993C1D' : '#0F6E56',
      }}
    >
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {up
          ? <polyline points="18 15 12 9 6 15" />
          : <polyline points="6 9 12 15 18 9" />}
      </svg>
      {Math.abs(pct).toFixed(0)}%
    </span>
  )
}

function CategoryCard({ cat, total, prevTotal, count, pct, budget, color, transactions }) {
  const [expanded, setExpanded] = useState(false)
  const budgetPct = budget ? Math.min((total / budget) * 100, 100) : null
  const over = budget && total > budget

  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-4 text-left hover:bg-page/40 transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}18` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-primary">{cat}</p>
                <TrendBadge current={total} previous={prevTotal} />
              </div>
              <p className="text-xs text-muted mt-0.5">
                {count} transacción{count !== 1 ? 'es' : ''} · {pct.toFixed(1)}% del total
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-primary tabular">{fmt(total)}</p>
              {budget && (
                <p className="text-xs tabular mt-0.5" style={{ color: over ? '#993C1D' : '#9CA3AF' }}>
                  {over ? `+${fmt(total - budget)} sobre límite` : `${fmt(budget - total)} disponible`}
                </p>
              )}
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="text-muted flex-shrink-0 transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-1.5 bg-page rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
          {budget && (
            <div>
              <div className="flex justify-between text-2xs text-muted mb-1">
                <span>Presupuesto {fmt(budget)}</span>
                <span className="tabular">{Math.round(budgetPct)}%</span>
              </div>
              <div className="h-1 bg-page rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${budgetPct}%`, backgroundColor: over ? '#993C1D' : color, opacity: 0.6 }}
                />
              </div>
            </div>
          )}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border/50 divide-y divide-border/30">
          {transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-page/30">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted tabular whitespace-nowrap">
                  {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
                <span className="text-sm text-primary truncate">{t.description}</span>
              </div>
              <AmountBadge amount={t.amount} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Category Manager Modal ─────────────────────────────────────────────────────

const TIPO_OPTIONS = ['Fijo', 'Variable', 'Ahorro', 'Deuda', 'Ingreso']
const COLOR_PALETTE = [
  '#185FA5','#0ea5e9','#8b5cf6','#f59e0b','#10b981',
  '#ef4444','#ec4899','#14b8a6','#f97316','#6366f1',
  '#84cc16','#0F6E56','#993C1D','#854F0B','#9CA3AF',
]

function CategoryForm({ initial, onSave, onCancel, title, parentOptions = [] }) {
  const [name,     setName]     = useState(initial?.name     ?? '')
  const [budget,   setBudget]   = useState(initial?.budget   ?? '')
  const [tipo,     setTipo]     = useState(initial?.tipo     ?? 'Variable')
  const [color,    setColor]    = useState(initial?.color    ?? '#185FA5')
  const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(', '))
  const [parent,   setParent]   = useState(initial?.parent   ?? '')
  const [error,    setError]    = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    onSave({
      name:     name.trim(),
      budget:   budget !== '' ? parseFloat(budget) : null,
      tipo,
      color,
      keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
      parent:   parent || null,
    })
  }

  const inputCls = "w-full text-sm border border-border rounded-md px-3 py-2 bg-white text-primary focus:outline-none focus:border-tri-400 focus:ring-1 focus:ring-tri-400/20 transition-colors"
  const labelCls = "block text-xs font-medium text-secondary mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm font-medium text-primary">{title}</p>

      <div>
        <label className={labelCls}>Nombre *</label>
        <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Ej: Suscripciones" disabled={!!initial && !initial.custom} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Presupuesto mensual (€)</label>
          <input type="number" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} className={inputCls} placeholder="Opcional" />
        </div>
        <div>
          <label className={labelCls}>Tipo de gasto</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className={inputCls}>
            {TIPO_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTE.map(c => (
            <button
              key={c} type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full transition-transform hover:scale-110 flex-shrink-0"
              style={{
                backgroundColor: c,
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      </div>

      {parentOptions.length > 0 && (
        <div>
          <label className={labelCls}>Subcategoría de (opcional)</label>
          <select value={parent} onChange={e => setParent(e.target.value)} className={inputCls}>
            <option value="">— Ninguna (categoría principal) —</option>
            {parentOptions.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {parent && <p className="text-2xs text-muted mt-1">Aparecerá agrupada bajo "{parent}" en los selectores</p>}
        </div>
      )}

      <div>
        <label className={labelCls}>Palabras clave (separadas por coma)</label>
        <input value={keywords} onChange={e => setKeywords(e.target.value)} className={inputCls} placeholder="Ej: mercadona, aldi, lidl" />
        <p className="text-2xs text-muted mt-1">Se usarán para categorizar automáticamente al importar</p>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="text-sm px-4 py-2 rounded-md border border-border text-secondary hover:bg-page transition-colors">
          Cancelar
        </button>
        <button type="submit" className="text-sm px-4 py-2 rounded-md text-white transition-colors" style={{ backgroundColor: '#185FA5' }}>
          Guardar
        </button>
      </div>
    </form>
  )
}

function CategoryManager({ cats, onClose }) {
  const { categories, addCategory, updateCategory, deleteCategory } = cats
  // Names that can be parents = categories without a parent themselves
  const parentOptions = categories.filter(c => !c.parent).map(c => c.name)
  const [view, setView]   = useState('list') // 'list' | 'add' | { editing: cat }
  const [confirm, setConfirm] = useState(null) // name to delete

  function handleAdd(data) {
    addCategory(data)
    setView('list')
  }

  function handleEdit(data) {
    updateCategory(view.editing.name, data)
    setView('list')
  }

  function handleDelete(name) {
    deleteCategory(name)
    setConfirm(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {view !== 'list' && (
              <button onClick={() => setView('list')} className="text-muted hover:text-primary transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <h2 className="text-base font-medium text-primary">Gestionar categorías</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-primary transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {view === 'list' && (
            <div className="space-y-1">
              {categories.map(cat => (
                <div
                  key={cat.name}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-page/60 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {cat.parent && <span className="text-2xs text-muted">{cat.parent} /</span>}
                        <p className="text-sm text-primary truncate">{cat.name}</p>
                      </div>
                      <p className="text-2xs text-muted">
                        {cat.tipo}
                        {cat.budget ? ` · ${fmt(cat.budget)}/mes` : ''}
                        {cat.custom ? ' · personalizada' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setView({ editing: cat })}
                      className="p-1.5 rounded text-muted hover:text-primary hover:bg-page transition-colors"
                      title="Editar"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    {cat.custom && (
                      <button
                        onClick={() => setConfirm(cat.name)}
                        className="p-1.5 rounded text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'add' && (
            <CategoryForm
              title="Nueva categoría"
              onSave={handleAdd}
              onCancel={() => setView('list')}
              parentOptions={parentOptions}
            />
          )}

          {view?.editing && (
            <CategoryForm
              title={`Editar: ${view.editing.name}`}
              initial={view.editing}
              onSave={handleEdit}
              onCancel={() => setView('list')}
              parentOptions={parentOptions}
            />
          )}
        </div>

        {/* Footer – only shown in list view */}
        {view === 'list' && (
          <div className="px-6 py-4 border-t border-border flex-shrink-0">
            <button
              onClick={() => setView('add')}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-lg border-2 border-dashed border-border text-muted hover:border-tri-400 hover:text-tri-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nueva categoría
            </button>
          </div>
        )}

        {/* Delete confirm dialog */}
        {confirm && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl">
            <div className="bg-white border border-border rounded-xl shadow-xl p-6 mx-4 max-w-sm w-full">
              <p className="text-sm font-medium text-primary mb-2">¿Eliminar categoría?</p>
              <p className="text-sm text-muted mb-5">Se eliminará <strong>{confirm}</strong>. Las transacciones existentes quedarán sin categoría.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirm(null)} className="flex-1 text-sm py-2 rounded-md border border-border text-secondary hover:bg-page transition-colors">Cancelar</button>
                <button onClick={() => handleDelete(confirm)} className="flex-1 text-sm py-2 rounded-md text-white transition-colors" style={{ backgroundColor: '#993C1D' }}>Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Categories Page ───────────────────────────────────────────────────────

export default function Categories({ transactions, selectedMonth, onMonthChange, cats }) {
  const [tab, setTab]         = useState('gastos')
  const [managing, setManaging] = useState(false)

  const colorMap  = cats?.colorMap  || {}
  const budgets   = cats?.budgets   || []
  const catNames  = cats?.categoryNames || []

  const tx     = filterMonth(transactions, selectedMonth)
  const prevMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1)
  const txPrev = filterMonth(transactions, prevMonth)

  const expenses      = tx.filter(t => t.amount < 0)
  const incomes       = tx.filter(t => t.amount > 0)
  const totalGastos   = expenses.reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalIngresos = incomes.reduce((s, t) => s + t.amount, 0)

  const budgetMap = Object.fromEntries(budgets.map(b => [b.category, b.budget]))

  const expenseCats = catNames.map(cat => {
    const catTx     = expenses.filter(t => t.category === cat)
    const prevTx    = txPrev.filter(t => t.amount < 0 && t.category === cat)
    const total     = catTx.reduce((s, t) => s + Math.abs(t.amount), 0)
    const prevTotal = prevTx.reduce((s, t) => s + Math.abs(t.amount), 0)
    return {
      cat, total, prevTotal, count: catTx.length,
      pct:    totalGastos > 0 ? (total / totalGastos) * 100 : 0,
      budget: budgetMap[cat] || null,
      color:  colorMap[cat] ?? '#9CA3AF',
      transactions: catTx.sort((a, b) => new Date(b.date) - new Date(a.date)),
    }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const incomeCats = catNames.map(cat => {
    const catTx     = incomes.filter(t => t.category === cat)
    const prevTx    = txPrev.filter(t => t.amount > 0 && t.category === cat)
    const total     = catTx.reduce((s, t) => s + t.amount, 0)
    const prevTotal = prevTx.reduce((s, t) => s + t.amount, 0)
    return {
      cat, total, prevTotal, count: catTx.length,
      pct:    totalIngresos > 0 ? (total / totalIngresos) * 100 : 0,
      budget: null,
      color:  colorMap[cat] ?? '#0F6E56',
      transactions: catTx.sort((a, b) => new Date(b.date) - new Date(a.date)),
    }
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const uncategorized      = tx.filter(t => !t.category || t.category === '' || t.category === 'Sin categoría' || t.category === 'Otros')
  const uncatExpenses      = uncategorized.filter(t => t.amount < 0)
  const uncatIncomes       = uncategorized.filter(t => t.amount > 0)

  const activeList           = tab === 'gastos' ? expenseCats : incomeCats
  const activeTotal          = tab === 'gastos' ? totalGastos : totalIngresos
  const activeUncategorized  = tab === 'gastos' ? uncatExpenses : uncatIncomes

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium text-primary">Categorías</h1>
          <p className="text-sm text-muted mt-0.5">
            {tab === 'gastos'
              ? `${fmt(totalGastos)} en gastos · ${expenseCats.length} categorías`
              : `${fmt(totalIngresos)} en ingresos · ${incomeCats.length} categorías`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setManaging(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-border text-secondary hover:bg-page hover:border-tri-300 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
            Gestionar
          </button>
          <MonthSelector value={selectedMonth} onChange={onMonthChange} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-page rounded-lg border border-border w-fit">
        {[
          { key: 'gastos',   label: 'Gastos',   value: fmt(totalGastos) },
          { key: 'ingresos', label: 'Ingresos', value: fmt(totalIngresos) },
        ].map(({ key, label, value }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 rounded text-sm transition-colors"
            style={tab === key
              ? { backgroundColor: '#fff', color: '#042C53', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
              : { color: '#9CA3AF' }}
          >
            {label}
            <span className="ml-2 text-xs tabular" style={{ color: tab === key ? '#185FA5' : '#C4CBD4' }}>
              {value}
            </span>
          </button>
        ))}
      </div>

      {/* Distribution bar */}
      {activeList.length > 0 && (
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted mb-3">Distribución por categoría</p>
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {activeList.map(({ cat, pct, color }) => (
              <div
                key={cat}
                className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
                title={`${cat}: ${pct.toFixed(1)}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
            {activeList.slice(0, 7).map(({ cat, pct, color }) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-secondary">{cat}</span>
                <span className="text-xs text-muted tabular">{pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary cards */}
      {activeList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card rounded-lg border border-border shadow-card px-4 py-3">
            <p className="text-xs text-muted mb-1">Mayor gasto</p>
            <p className="text-sm font-medium text-primary truncate">{activeList[0]?.cat}</p>
            <p className="text-xs tabular mt-0.5" style={{ color: '#993C1D' }}>{fmt(activeList[0]?.total)}</p>
          </div>
          <div className="bg-card rounded-lg border border-border shadow-card px-4 py-3">
            <p className="text-xs text-muted mb-1">Categorías activas</p>
            <p className="text-sm font-medium text-primary">{activeList.length}</p>
            <p className="text-xs text-muted mt-0.5">{activeUncategorized.length} sin categoría</p>
          </div>
          <div className="bg-card rounded-lg border border-border shadow-card px-4 py-3">
            <p className="text-xs text-muted mb-1">Vs mes anterior</p>
            {(() => {
              const prevTotal = filterMonth(transactions, prevMonth)
                .filter(t => tab === 'gastos' ? t.amount < 0 : t.amount > 0)
                .reduce((s, t) => s + Math.abs(t.amount), 0)
              const diff = activeTotal - prevTotal
              const pct  = prevTotal > 0 ? ((diff / prevTotal) * 100).toFixed(0) : null
              return (
                <>
                  <p className="text-sm font-medium tabular" style={{ color: diff > 0 ? '#993C1D' : '#0F6E56' }}>
                    {diff >= 0 ? '+' : ''}{fmt(diff)}
                  </p>
                  {pct && (
                    <p className="text-xs text-muted mt-0.5">{diff > 0 ? '▲' : '▼'} {Math.abs(pct)}% respecto a {prevMonth.toLocaleString('es-ES', { month: 'long' })}</p>
                  )}
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Category cards */}
      <div className="space-y-2">
        {activeList.map(({ cat, total, prevTotal, count, pct, budget, color, transactions: catTx }) => (
          <CategoryCard
            key={cat}
            cat={cat} total={total} prevTotal={prevTotal}
            count={count} pct={pct} budget={budget}
            color={color} transactions={catTx}
          />
        ))}

        {/* Sin categoría */}
        {activeUncategorized.length > 0 && (
          <div className="bg-card rounded-lg border border-border/70 shadow-card overflow-hidden">
            <div className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F3F4F6' }}>
                  <div className="w-3 h-3 rounded-full bg-gray-300" />
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary">Sin categoría</p>
                  <p className="text-xs text-muted">{activeUncategorized.length} transacciones pendientes de clasificar</p>
                </div>
              </div>
              <p className="text-sm font-medium tabular" style={{ color: '#854F0B' }}>
                {fmt(activeUncategorized.reduce((s, t) => s + Math.abs(t.amount), 0))}
              </p>
            </div>
            <div className="border-t border-border/50 divide-y divide-border/30">
              {activeUncategorized.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between px-5 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted tabular whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                    <span className="text-sm text-primary truncate">{t.description}</span>
                  </div>
                  <AmountBadge amount={t.amount} />
                </div>
              ))}
              {activeUncategorized.length > 5 && (
                <div className="px-5 py-2 text-xs text-muted text-center">
                  +{activeUncategorized.length - 5} más — clasifícalas en Transacciones
                </div>
              )}
            </div>
          </div>
        )}

        {activeList.length === 0 && activeUncategorized.length === 0 && (
          <p className="text-sm text-muted text-center py-16">No hay datos en este mes.</p>
        )}
      </div>

      {/* Category Manager Modal */}
      {managing && cats && (
        <CategoryManager cats={cats} onClose={() => setManaging(false)} />
      )}
    </div>
  )
}
