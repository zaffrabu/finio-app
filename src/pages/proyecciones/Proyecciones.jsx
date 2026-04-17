import { useState, useMemo } from 'react'
import { useData } from '../../contexts/DataContext'

function fmt(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

export default function Proyecciones() {
  const {
    transactions, monthTransactions, income, monthIncome, monthSpending,
    margen, daysRemaining, categories, spendingByCategory,
    fixedExpenses, currentMonth, currentYear, loading,
  } = useData()

  const effectiveIncome = income || monthIncome
  const today = new Date().getDate()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const daysPassed = today

  // Daily burn rate and projection
  const dailySpend = daysPassed > 0 ? monthSpending / daysPassed : 0
  const projectedSpending = Math.round(dailySpend * daysInMonth)
  const projectedMargin = Math.round(effectiveIncome - projectedSpending)

  // Scenario calculations
  const optimisticSaving = Math.round(dailySpend * 0.15 * daysRemaining) // 15% reduction
  const pessimisticExtra = Math.round(dailySpend * 0.25 * daysRemaining) // 25% increase
  const optimisticMargin = projectedMargin + optimisticSaving
  const pessimisticMargin = projectedMargin - pessimisticExtra

  const monthName = new Date().toLocaleString('es-ES', { month: 'long' })

  // Upcoming fixed/committed expenses
  const committed = useMemo(() => {
    const items = []
    fixedExpenses.forEach(fe => {
      const dayNum = parseInt(fe.dia || '1')
      const paid = dayNum <= today
      items.push({
        icon: fe.emoji || '📅',
        name: fe.nombre || 'Gasto fijo',
        date: `Día ${dayNum} · mensual${paid ? ' · pagado' : ''}`,
        amount: `${fmt(fe.importe || 0)} €`,
        amountColor: paid ? undefined : dayNum <= today + 3 ? 'var(--aviso)' : undefined,
        badge: paid ? '✓ Pagado' : dayNum <= today + 3 ? '⏳ Próximo' : `${dayNum - today} días`,
        badgeBg: paid ? 'rgba(46,184,122,0.1)' : dayNum <= today + 3 ? 'rgba(184,125,0,0.12)' : 'var(--border)',
        badgeColor: paid ? 'var(--acento)' : dayNum <= today + 3 ? 'var(--aviso)' : 'var(--text-muted)',
        rowBg: !paid && dayNum <= today + 3 ? 'rgba(184,125,0,0.04)' : undefined,
        dayNum,
        paid,
      })
    })
    return items.sort((a, b) => a.dayNum - b.dayNum)
  }, [fixedExpenses, today])

  const totalPending = committed.filter(c => !c.paid).reduce((s, c) => {
    const num = parseFloat((c.amount || '0').replace(/[^\d,.-]/g, '').replace(',', '.'))
    return s + (isNaN(num) ? 0 : num)
  }, 0)

  // Historical monthly margins (last 12 months)
  const monthBars = useMemo(() => {
    const bars = []
    for (let i = 11; i >= 0; i--) {
      const m = new Date(currentYear, currentMonth - i, 1)
      const mMonth = m.getMonth()
      const mYear = m.getFullYear()
      const mLabel = m.toLocaleString('es-ES', { month: 'short' })
      const isNow = mMonth === currentMonth && mYear === currentYear

      const mTx = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === mMonth && d.getFullYear() === mYear
      })

      const mInc = mTx.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
      const mExp = mTx.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
      const mIncome = mInc > 0 ? mInc : (income || 0)
      const mMargin = isNow ? projectedMargin : mIncome - mExp

      bars.push({
        label: isNow ? `${mLabel} ▸` : mLabel,
        val: isNow ? `${fmt(mMargin)}€*` : `${fmt(mMargin)}€`,
        margin: mMargin,
        now: isNow,
        hasTx: mTx.length > 0,
      })
    }

    const maxAbs = Math.max(...bars.map(b => Math.abs(b.margin)), 1)
    return bars.map(b => {
      const h = b.hasTx || b.now ? Math.max(8, Math.round((Math.abs(b.margin) / maxAbs) * 100)) : 0
      const bad  = b.margin < 0
      const good = b.margin > maxAbs * 0.5
      return {
        ...b,
        h,
        bg: b.now ? 'linear-gradient(to top,var(--acento),#72E4A5)'
          : bad  ? 'rgba(214,59,39,0.45)'
          : good ? 'rgba(46,184,122,0.35)'
          : 'rgba(46,184,122,0.15)',
        bad,
        good,
        shadow: b.now ? '0 0 14px rgba(46,184,122,0.3)' : undefined,
      }
    })
  }, [transactions, income, currentMonth, currentYear, projectedMargin])

  // Levers: top spending categories user can adjust
  const initLevers = useMemo(() => {
    return Object.entries(spendingByCategory)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, spent]) => {
        const cat = categories.find(c => c.name === name)
        return {
          name: `${cat?.emoji || '📦'} ${name} (actual: ${fmt(Math.round(spent))} €)`,
          sub: cat?.budget ? `Límite: ${fmt(cat.budget)} €` : 'Sin límite definido',
          min: 0,
          max: Math.round(spent),
          val: Math.round(spent),
          multiplier: 1,
        }
      })
  }, [spendingByCategory, categories])

  const [levers, setLevers] = useState(null)
  const currentLevers = levers || initLevers.map(l => l.val)

  const totalSavings = initLevers.reduce((sum, l, i) => {
    const diff = l.val - (currentLevers[i] ?? l.val)
    return sum + diff * l.multiplier
  }, 0)
  const simulatedMargin = projectedMargin + totalSavings

  if (loading) return <div className="auth-loading"><div className="auth-spinner"></div></div>

  const kpis = [
    { label: `Proyección fin de ${monthName}`, value: fmt(projectedMargin), cls: 'accent', phrase: 'Si sigues al ritmo actual' },
    { label: 'Escenario optimista', value: fmt(optimisticMargin), cls: 'green', delta: `+${fmt(optimisticSaving)} €`, deltaDir: 'up', deltaSuffix: ' reduciendo gasto 15%' },
    { label: 'Escenario pesimista', value: fmt(pessimisticMargin), cls: 'red', delta: `−${fmt(pessimisticExtra)} €`, deltaDir: 'down', deltaSuffix: ' si hay imprevistos' },
    { label: 'Gasto diario medio', value: fmt(Math.round(dailySpend)), cls: '', deltaTxt: `${daysPassed} días transcurridos de ${daysInMonth}` },
  ]

  return (
    <div>
      {/* KPI strip */}
      <div className="proj-kpi-strip">
        {kpis.map((k, i) => (
          <div key={i} className={`kpi-card${k.cls ? ` ${k.cls}` : ''}`}>
            <div className="kpi-label">{k.label}</div>
            <div className={`kpi-value${k.cls ? ` ${k.cls}` : ''}`}><span className="eur">€</span>{k.value}</div>
            {k.phrase && <div className="kpi-phrase">{k.phrase}</div>}
            {k.delta && <div className="kpi-delta"><span className={`delta-${k.deltaDir}`}>{k.delta}</span>{k.deltaSuffix}</div>}
            {k.deltaTxt && <div className="kpi-delta">{k.deltaTxt}</div>}
          </div>
        ))}
      </div>

      {/* Hero card */}
      <div className="proj-hero-card">
        <div className="proj-hero-inner">
          <div className="proj-hero-left">
            <div className="proj-eyebrow">Proyección — fin de {monthName} {currentYear}</div>
            <div className="proj-big"><span className="eur">€</span>{fmt(projectedMargin)}</div>
            <div className="proj-caption">
              {projectedMargin > 0
                ? <>A este ritmo cerrarás {monthName} con <strong>{fmt(projectedMargin)} € de margen</strong>. Llevas {daysPassed} días y te quedan {daysRemaining}.</>
                : <>Cuidado: al ritmo actual cerrarás {monthName} con <strong>{fmt(Math.abs(projectedMargin))} € de déficit</strong>.</>
              }
            </div>
            <div className="scen-bars">
              {(() => {
                const scenarios = [
                  { label: 'Optimista', color: '#72E4A5',           margin: optimisticMargin },
                  { label: 'Actual',    color: 'rgba(212,245,226,0.7)', margin: projectedMargin },
                  { label: 'Pesimista', color: 'rgba(255,107,91,0.8)', margin: pessimisticMargin },
                ]
                const maxAbs = Math.max(...scenarios.map(s => Math.abs(s.margin)), 1)
                return scenarios.map((s, i) => {
                  const pct = Math.max(5, Math.round((Math.abs(s.margin) / maxAbs) * 100))
                  const sign = s.margin >= 0 ? '+' : '−'
                  return (
                    <div key={i} className="scen-bar-row">
                      <span className="scen-bar-label" style={{ color: s.color }}>{s.label}</span>
                      <div className="scen-bar-track"><div className="scen-bar-fill" style={{ width: `${pct}%`, background: s.color }}></div></div>
                      <span className="scen-bar-val" style={{ color: s.color }}>{sign}{fmt(Math.abs(s.margin))} €</span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Two col */}
      <div className="proj-two-col">
        {/* Levers */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">🎛️ Simula tu margen</span>
            <button className="panel-action" onClick={() => setLevers(initLevers.map(l => l.val))}>Reiniciar</button>
          </div>
          <div>
            {initLevers.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Sin datos de gasto para simular. Importa movimientos para activar esta función.
              </div>
            ) : (
              initLevers.map((l, i) => {
                const saving = l.val - (currentLevers[i] ?? l.val)
                return (
                  <div key={i} className="lever-row">
                    <div className="lever-info">
                      <div className="lever-name">{l.name}</div>
                      <div className="lever-sub">{l.sub}</div>
                    </div>
                    <div className="lever-slider-wrap">
                      <input type="range" className="lever-slider" min={l.min} max={l.max} value={currentLevers[i] ?? l.val}
                        onChange={e => {
                          const newLevers = [...(currentLevers)]
                          newLevers[i] = +e.target.value
                          setLevers(newLevers)
                        }} />
                    </div>
                    <div className="lever-impact">
                      <div className="lever-impact-val" style={{ color: saving > 0 ? 'var(--acento)' : 'var(--text-muted)' }}>{saving > 0 ? `+${saving}` : saving} €</div>
                      <div className="lever-impact-lbl">ahorro</div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          {initLevers.length > 0 && (
            <div className="proj-result-bar">
              <div>
                <div className="proj-result-label">Margen proyectado con estos ajustes</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {totalSavings > 0 ? `Ahorro total: +${totalSavings} €` : 'Mueve los controles para simular'}
                </div>
              </div>
              <div className="proj-result-val">{fmt(simulatedMargin)} €</div>
            </div>
          )}
        </div>

        {/* Committed */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">📅 Comprometidos este mes</span>
          </div>
          <div>
            {committed.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                Sin gastos fijos configurados. Añádelos desde Ajustes.
              </div>
            ) : (
              <>
                {committed.map((c, i) => (
                  <div key={i} className="committed-row" style={c.rowBg ? { background: c.rowBg } : undefined}>
                    <div className="comm-icon">{c.icon}</div>
                    <div className="comm-info">
                      <div className="comm-name">{c.name}</div>
                      <div className="comm-date">{c.date}</div>
                    </div>
                    <div className="comm-right">
                      <div className="comm-amount" style={c.amountColor ? { color: c.amountColor } : undefined}>{c.amount}</div>
                      <span className="comm-badge" style={{ background: c.badgeBg, color: c.badgeColor }}>{c.badge}</span>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '12px 18px', background: 'var(--bg-surface2)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total comprometido pendiente</span>
                  <span style={{ fontFamily: "'Poppins',serif", fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.8px' }}>{fmt(Math.round(totalPending))} €</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Monthly comparison */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <span className="panel-title">Histórico de margen mensual — últimos 12 meses</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {monthBars.filter(b => b.hasTx).length > 0 && (
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--text-muted)' }}>
                Media: {fmt(Math.round(monthBars.filter(b => b.hasTx).reduce((s, b) => s + b.margin, 0) / (monthBars.filter(b => b.hasTx).length || 1)))} €/mes
              </span>
            )}
          </div>
        </div>
        <div className="panel-body">
          <div className="month-comp-wrap">
            <div className="month-comp-bars">
              {monthBars.map((b, i) => (
                <div key={i} className="mc2-col">
                  <div className={`mc2-val${b.bad ? ' bad' : b.good ? ' good' : b.now ? ' now' : ''}`}>{b.hasTx || b.now ? b.val : '—'}</div>
                  <div className="mc2-bar-wrap">
                    <div className="mc2-bar" style={{ height: `${b.hasTx || b.now ? b.h : 0}%`, background: b.bg, ...(b.shadow ? { boxShadow: b.shadow } : {}) }}></div>
                  </div>
                  <div className={`mc2-label${b.now ? ' now' : ''}`}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
