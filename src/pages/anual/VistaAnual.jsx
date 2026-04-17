import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'

const meses     = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const trimestres = ['Q1 · Ene–Mar', 'Q2 · Abr–Jun', 'Q3 · Jul–Sep', 'Q4 · Oct–Dic']

// Aggregate 12-month array into 4 quarters
function toQuarters(data) {
  return [
    data.slice(0, 3).reduce((s, v) => s + v, 0),
    data.slice(3, 6).reduce((s, v) => s + v, 0),
    data.slice(6, 9).reduce((s, v) => s + v, 0),
    data.slice(9, 12).reduce((s, v) => s + v, 0),
  ]
}

function fmt(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

export default function VistaAnual() {
  const { transactions, categories, income, loading } = useData()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter]        = useState('Todos los gastos')
  const [expanded, setExpanded]    = useState(new Set())
  const [collapsed, setCollapsed]  = useState(new Set())   // sections collapsed

  const toggleSection = (name) => setCollapsed(prev => {
    const next = new Set(prev)
    next.has(name) ? next.delete(name) : next.add(name)
    return next
  })

  const currentYear  = new Date().getFullYear()
  const currentMonth = new Date().getMonth()

  // Year and period come from URL
  const year   = parseInt(searchParams.get('year')   || currentYear, 10)
  const period = searchParams.get('period') || 'año'  // 'año' | 'trim'

  const setYear = (fn) => {
    const next = typeof fn === 'function' ? fn(year) : fn
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('year', next); return n })
  }

  const isTrim = period === 'trim'
  const cols   = isTrim ? trimestres : meses

  const toggleExpand = (name) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(name) ? next.delete(name) : next.add(name)
    return next
  })

  // ── Build data ─────────────────────────────────────────────────────────────
  const { ingresoRows, gastoRows, monthlyIncome, monthlyExpense, monthlyMargen, totalIncome, totalExpense } = useMemo(() => {
    const yearTx = transactions.filter(t => new Date(t.date).getFullYear() === year)

    // Deduplicate categories by name (same logic as Ajustes/Categorias pages)
    // keeps first occurrence → prevents same-name subcats appearing under multiple parents
    const seen = new Set()
    const uniqueCats = categories.filter(c => {
      const k = c.name.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

    // Index categories
    const catById   = Object.fromEntries(uniqueCats.map(c => [c.id, c]))
    const catByName = Object.fromEntries(uniqueCats.map(c => [c.name, c]))

    // Determine effective tipo for a category (inherit from parent if needed)
    const effectiveTipo = (cat) => {
      if (cat.tipo === 'Ingreso') return 'Ingreso'
      if (cat.parent_id) {
        const parent = catById[cat.parent_id]
        if (parent?.tipo === 'Ingreso') return 'Ingreso'
      }
      return cat.tipo || 'Variable'
    }

    // Per-category monthly data (all transactions, split by category name)
    const leafData = {}
    yearTx.forEach(t => {
      const cat = t.category || 'Sin categoría'
      const m   = new Date(t.date).getMonth()
      if (!leafData[cat]) leafData[cat] = Array(12).fill(0)
      leafData[cat][m] += t.amount // keep sign: positive = income, negative = expense
    })

    // Parent categories (use deduplicated list)
    const parentCats = uniqueCats.filter(c => !c.parent_id)
    const childrenOf = (parentId) => uniqueCats.filter(c => c.parent_id === parentId)

    // Build rows for a section (Ingresos or Gastos)
    const buildRows = (sectionTipo) => {
      const isIngreso = sectionTipo === 'Ingreso'
      const result = []

      // ── 1. Parent categories that belong to this section ──────────────────
      parentCats.forEach(parent => {
        const parentIsIngreso = effectiveTipo(parent) === 'Ingreso'
        if (isIngreso !== parentIsIngreso) return

        const kids = childrenOf(parent.id)

        // Only roll up children whose tipo MATCHES the parent's section.
        // Children with a conflicting tipo are shown separately (handled below).
        const matchingKids = kids.filter(k => {
          if (!k.tipo || k.tipo === parent.tipo) return true          // same tipo → roll up
          const childIsIngreso = k.tipo === 'Ingreso'
          return isIngreso ? childIsIngreso : !childIsIngreso          // must agree with section
        })
        const mismatchKids = kids.filter(k => !matchingKids.includes(k))

        const parentOwn  = leafData[parent.name] ? [...leafData[parent.name]] : Array(12).fill(0)
        const kidsData   = matchingKids.map(child => ({
          cat: child,
          data: leafData[child.name] ? [...leafData[child.name]] : Array(12).fill(0),
        })).filter(k => k.data.some(v => v !== 0))

        const aggData = [...parentOwn]
        kidsData.forEach(k => k.data.forEach((v, i) => { aggData[i] += v }))

        const total = Math.abs(aggData.reduce((s, v) => s + v, 0))
        // Still add the row if there are mismatched kids (parent may have 0 own data)
        if (total === 0 && mismatchKids.length === 0) return
        if (filter === 'Solo variables' && parent.tipo === 'Fijo') return

        if (total > 0) {
          result.push({
            type: 'parent',
            name: parent.name,
            emoji: parent.emoji || '📦',
            color: parent.color || '#8A8A8A',
            data: aggData.map(v => Math.abs(v)),
            rawData: aggData,
            total,
            media: Math.round(total / (aggData.filter(v => v !== 0).length || 1)),
            budget: parent.budget || 0,
            hasChildren: kidsData.length > 0,
            children: kidsData.map(k => {
              const childTotal = Math.abs(k.data.reduce((s, v) => s + v, 0))
              return {
                type: 'child',
                parentName: parent.name,
                name: k.cat.name,
                emoji: k.cat.emoji || '📦',
                color: k.cat.color || parent.color || '#8A8A8A',
                data: k.data.map(v => Math.abs(v)),
                total: childTotal,
                media: Math.round(childTotal / (k.data.filter(v => v !== 0).length || 1)),
                budget: k.cat.budget || 0,
              }
            }),
          })
        }

        // ── 2. Mismatched children → standalone rows in the opposite section ──
        // (handled when buildRows is called for the other section — see below)
      })

      // ── 3. Mismatched children: belong to this section but parent doesn't ──
      uniqueCats.filter(c => c.parent_id).forEach(child => {
        const parent = catById[child.parent_id]
        if (!parent) return
        const parentIsIngreso = effectiveTipo(parent) === 'Ingreso'
        const childIsIngreso  = child.tipo === 'Ingreso'
        // Only show here if the child's tipo matches this section AND parent doesn't
        if (isIngreso !== childIsIngreso) return   // child doesn't belong to this section
        if (isIngreso === parentIsIngreso) return  // parent already handles it in its section

        const data  = leafData[child.name] ? [...leafData[child.name]] : Array(12).fill(0)
        const total = Math.abs(data.reduce((s, v) => s + v, 0))
        if (total === 0) return
        if (filter === 'Solo variables' && child.tipo === 'Fijo') return

        result.push({
          type: 'parent',
          name: `${parent.emoji||''} ${parent.name} › ${child.name}`,
          emoji: child.emoji || '📦',
          color: child.color || '#8A8A8A',
          data: data.map(v => Math.abs(v)),
          rawData: data,
          total,
          media: Math.round(total / (data.filter(v => v !== 0).length || 1)),
          budget: child.budget || 0,
          hasChildren: false,
          children: [],
        })
      })

      result.sort((a, b) => b.total - a.total)
      return result
    }

    const ingresoRows = buildRows('Ingreso')
    const gastoRows   = buildRows('Gasto')

    // Monthly totals
    const monthlyInc = Array(12).fill(0)
    const monthlyExp = Array(12).fill(0)
    ingresoRows.forEach(r => r.rawData?.forEach((v, i) => { monthlyInc[i] += Math.max(0, v) }))
    gastoRows.forEach(r => r.rawData?.forEach((v, i) => { monthlyExp[i] += Math.abs(Math.min(0, v)) + (v > 0 ? 0 : 0) }))

    // Recalculate monthly expense from gasto rows' absolute data
    const monthlyExpAbs = Array(12).fill(0)
    gastoRows.forEach(r => r.data?.forEach((v, i) => { monthlyExpAbs[i] += v }))
    // Also add children (they're in parent aggregate already)

    const monthlyIncAbs = Array(12).fill(0)
    ingresoRows.forEach(r => r.data?.forEach((v, i) => { monthlyIncAbs[i] += v }))

    const monthlyMarg = monthlyIncAbs.map((inc, i) => inc - monthlyExpAbs[i])

    const totalInc = ingresoRows.reduce((s, r) => s + r.total, 0)
    const totalExp = gastoRows.reduce((s, r) => s + r.total, 0)

    return {
      ingresoRows,
      gastoRows,
      monthlyIncome:  monthlyIncAbs,
      monthlyExpense: monthlyExpAbs,
      monthlyMargen:  monthlyMarg,
      totalIncome:  totalInc,
      totalExpense: totalExp,
    }
  }, [transactions, categories, year, filter, income])

  // ── Flatten rows for rendering ────────────────────────────────────────────
  const flatRows = useMemo(() => {
    const flat = []

    const addSection = (sectionName, sectionColor, sectionIcon, rows, isIngreso, emptyMsg) => {
      const isCollapsed = collapsed.has(sectionName)
      flat.push({ type: 'section', name: sectionName, color: sectionColor, icon: sectionIcon, isCollapsed, count: rows.length })
      if (!isCollapsed) {
        rows.forEach(row => {
          flat.push({ ...row, isIngreso })
          if (row.hasChildren && expanded.has(row.name)) {
            row.children.forEach(c => flat.push({ ...c, isIngreso }))
          }
        })
        if (rows.length === 0) {
          flat.push({ type: 'empty', message: emptyMsg })
        }
      }
    }

    addSection('Ingresos', 'var(--acento)', '💰', ingresoRows, true,
      'Sin categorías de ingreso. Crea una con tipo "Ingreso" en Ajustes → Categorías.')
    addSection('Gastos', 'var(--alerta)', '💸', gastoRows, false,
      'Sin categorías de gasto.')

    return flat
  }, [ingresoRows, gastoRows, expanded, collapsed])

  if (loading) return <div className="auth-loading"><div className="auth-spinner"></div></div>

  return (
    <div>
      <div className="annual-controls">
        <div className="year-selector">
          <button className="year-btn" onClick={() => setYear(y => y - 1)}>&lsaquo;</button>
          <div className="year-val">{year}</div>
          <button className="year-btn" onClick={() => setYear(y => y + 1)}>&rsaquo;</button>
        </div>
        {['Todos los gastos', 'Solo variables', 'Por categoría'].map(f => (
          <button key={f} className={`filter-btn${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>{f}</button>
        ))}
        <div style={{ flex: 1 }}></div>
      </div>

      <div className="annual-table-wrap">
        <div className="table-scroll">
          <table className="annual-table">
            <thead>
              <tr>
                <th>Categoría</th>
                {cols.map((m, i) => {
                  const isCurrentMonth = !isTrim && year === currentYear && i === currentMonth
                  const isFuture = !isTrim && year === currentYear && i > currentMonth
                  return (
                    <th key={m} className={isCurrentMonth ? 'current-month' : isFuture ? 'proj-stripe' : ''}>
                      {isCurrentMonth ? `${m} ▸` : m}
                    </th>
                  )
                })}
                <th className="total-col">Total</th>
                <th className="total-col">Media/mes</th>
              </tr>
            </thead>
            <tbody>
              {flatRows.map((row, ri) => {
                // Section header row
                if (row.type === 'section') {
                  const sectionTotal = row.name === 'Ingresos' ? totalIncome : totalExpense
                  return (
                    <tr key={`section-${row.name}`} style={{ cursor: 'pointer' }} onClick={() => toggleSection(row.name)}>
                      <td colSpan={16} style={{
                        padding: '10px 12px 6px',
                        borderTop: ri > 0 ? '2px solid var(--border)' : undefined,
                        background: row.isCollapsed ? 'rgba(0,0,0,0.02)' : undefined,
                        userSelect: 'none',
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          fontFamily: "'DM Mono',monospace", fontSize: 10,
                          fontWeight: 700, letterSpacing: '0.1em',
                          color: row.color, textTransform: 'uppercase',
                        }}>
                          <span style={{
                            fontSize: 9, transition: 'transform 0.2s',
                            transform: row.isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
                            display: 'inline-block', opacity: 0.7,
                          }}>▶</span>
                          <span>{row.icon}</span>
                          <span>{row.name}</span>
                          <span style={{ opacity: 0.5, fontWeight: 400 }}>({row.count})</span>
                          {row.isCollapsed && sectionTotal > 0 && (
                            <span style={{ marginLeft: 8, fontWeight: 700, opacity: 0.8 }}>
                              {fmt(Math.round(sectionTotal))} €
                            </span>
                          )}
                          <span style={{ marginLeft: 'auto', fontSize: 9, opacity: 0.5, fontWeight: 400 }}>
                            {row.isCollapsed ? 'expandir' : 'contraer'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                }

                // Empty state row
                if (row.type === 'empty') {
                  return (
                    <tr key={`empty-${ri}`}>
                      <td colSpan={16} style={{ padding: '12px 24px', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        {row.message}
                      </td>
                    </tr>
                  )
                }

                const isChild    = row.type === 'child'
                const isExpanded = expanded.has(row.name)

                return (
                  <tr key={`${row.name}-${ri}`}
                    className={row.isIngreso ? 'ingreso-row' : isChild ? 'annual-child-row' : ''}
                    style={isChild ? { background: 'rgba(0,0,0,0.02)' } : undefined}
                  >
                    <td>
                      <div className="cat-row-label" style={{ paddingLeft: isChild ? 28 : 0 }}>
                        {!isChild && row.hasChildren ? (
                          <button
                            onClick={() => toggleExpand(row.name)}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              padding: '0 4px 0 0', fontSize: 10, color: 'var(--text-muted)',
                              lineHeight: 1, flexShrink: 0, transition: 'transform 0.15s',
                              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}
                          >▶</button>
                        ) : isChild ? (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 4, opacity: 0.5 }}>↳</span>
                        ) : (
                          <span style={{ width: 14, display: 'inline-block' }} />
                        )}
                        <div className="cat-dot-sm" style={{ background: row.color, opacity: isChild ? 0.7 : 1 }}></div>
                        <span style={{ fontSize: isChild ? 12 : 13, color: isChild ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                          {row.emoji} {row.name}
                        </span>
                      </div>
                    </td>
                    {(isTrim ? toQuarters(row.data) : row.data).map((val, mi) => {
                      const isCurrentCol = !isTrim && year === currentYear && mi === currentMonth
                      const isFuture = !isTrim && year === currentYear && mi > currentMonth
                      const monthlyBudget = isTrim ? row.budget * 3 : row.budget
                      const isOver = !row.isIngreso && monthlyBudget > 0 && val > monthlyBudget
                      const isWarn = !row.isIngreso && monthlyBudget > 0 && val >= monthlyBudget * 0.8 && !isOver
                      let cls = ''
                      if (isCurrentCol) cls = `current-col${isOver ? ' cell-over' : isWarn ? ' cell-warn' : ''}`
                      else if (isFuture && val === 0) cls = 'cell-empty'
                      else if (isOver) cls = 'cell-over'
                      else if (isWarn) cls = 'cell-warn'
                      return (
                        <td key={mi} className={cls || undefined}
                          style={isChild ? { fontSize: 12, color: 'var(--text-secondary)' } : undefined}>
                          {val === 0 ? '—' : fmt(Math.round(val))}
                        </td>
                      )
                    })}
                    <td className="total-col" style={isChild ? { fontSize: 12 } : undefined}>
                      {fmt(Math.round(row.total))}
                    </td>
                    <td className="total-col" style={isChild ? { fontSize: 12 } : undefined}>
                      {fmt(Math.round(row.media))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td>Total gastos</td>
                {(isTrim ? toQuarters(monthlyExpense) : monthlyExpense).map((val, i) => (
                  <td key={i} className={!isTrim && year === currentYear && i === currentMonth ? 'current-col' : ''}>
                    {val === 0 ? '—' : fmt(Math.round(val))}
                  </td>
                ))}
                <td className="total-col">{fmt(Math.round(totalExpense))}</td>
                <td className="total-col">{fmt(Math.round(totalExpense / (isTrim ? (toQuarters(monthlyExpense).filter(v => v > 0).length || 1) : (monthlyExpense.filter(v => v > 0).length || 1))))}</td>
              </tr>
              <tr className="margen-row">
                <td>Margen</td>
                {(isTrim ? toQuarters(monthlyMargen) : monthlyMargen).map((val, i) => {
                  const expArr = isTrim ? toQuarters(monthlyExpense) : monthlyExpense
                  const incArr = isTrim ? toQuarters(monthlyIncome)  : monthlyIncome
                  return (
                    <td key={i} className={!isTrim && year === currentYear && i === currentMonth ? 'current-col' : ''}>
                      {incArr[i] === 0 && expArr[i] === 0 ? '—' : fmt(Math.round(val))}
                    </td>
                  )
                })}
                <td className="total-col">{fmt(Math.round(totalIncome - totalExpense))}</td>
                <td className="total-col">{fmt(Math.round((totalIncome - totalExpense) / (isTrim ? (toQuarters(monthlyExpense).filter(v => v > 0).length || 1) : (monthlyExpense.filter(v => v > 0).length || 1))))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {transactions.length === 0 && (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', marginTop: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Sin datos anuales</div>
          <div style={{ fontSize: 13 }}>Importa extractos bancarios para ver tu resumen anual.</div>
        </div>
      )}
    </div>
  )
}
