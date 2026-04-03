import { useState } from 'react'
import AmountBadge from '../components/ui/AmountBadge'
import TypeBadge from '../components/ui/TypeBadge'
import CategoryDot, { CATEGORY_COLORS } from '../components/ui/CategoryDot'
import CategorySelect from '../components/ui/CategorySelect'
import { CATEGORIES, TIPOS } from '../data/sampleData'

export default function Transactions({ transactions, updateCategory }) {
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterType, setFilterType] = useState('')

  const filtered = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase())
    const matchCat    = !filterCat   || t.category === filterCat
    const matchTipo   = !filterTipo  || t.tipo === filterTipo
    const matchType   = !filterType  || (filterType === 'ingreso' ? t.amount > 0 : t.amount < 0)
    return matchSearch && matchCat && matchTipo && matchType
  }).sort((a, b) => new Date(b.date) - new Date(a.date))

  const totalShown = filtered.reduce((s, t) => s + t.amount, 0)

  const selectCls = "text-sm border border-border rounded-sm px-3 py-2 bg-white text-secondary focus:outline-none transition-colors"

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-medium text-primary">Transacciones</h1>
          <p className="text-sm text-muted mt-0.5">{filtered.length} resultados</p>
        </div>
        <span
          className="text-sm font-medium tabular"
          style={{ color: totalShown >= 0 ? '#0F6E56' : '#993C1D' }}
        >
          Balance: {totalShown.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar en Finio..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] text-sm border border-border rounded-sm px-3 py-2 bg-white focus:outline-none focus:border-tri-300 transition-colors"
        />
        <select value={filterType}  onChange={e => setFilterType(e.target.value)}  className={selectCls}>
          <option value="">Todo</option>
          <option value="ingreso">Ingresos</option>
          <option value="gasto">Gastos</option>
        </select>
        <select value={filterTipo}  onChange={e => setFilterTipo(e.target.value)}  className={selectCls}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterCat}   onChange={e => setFilterCat(e.target.value)}   className={selectCls}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-page/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted">Tipo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted">Categoría</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-muted">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-page/50 transition-colors">
                <td className="px-4 py-3 text-xs text-muted tabular whitespace-nowrap">
                  {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <CategoryDot category={t.category} size={8} />
                    <div>
                      <p className="text-sm text-primary">{t.description}</p>
                      {t.account && <p className="text-xs text-muted mt-0.5">{t.account}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><TypeBadge tipo={t.tipo} /></td>
                <td className="px-4 py-3">
                  <CategorySelect value={t.category} onChange={cat => updateCategory(t.id, cat)} />
                </td>
                <td className="px-4 py-3 text-right"><AmountBadge amount={t.amount} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm text-muted">
                  Sin resultados en Finio
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
