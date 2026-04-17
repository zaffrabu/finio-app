import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'

function fmt(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
function fmt2(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

function relativeTime(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 2)   return 'hace un momento'
  if (mins < 60)  return `hace ${mins} min`
  if (hours < 24) return `hace ${hours}h`
  if (days === 1) return 'ayer'
  if (days < 7)   return `hace ${days} días`
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

// Mini ring/gauge for margen card
function MargenRing({ pct, positive }) {
  const r = 28, stroke = 5
  const circ = 2 * Math.PI * r
  const abs = Math.min(100, Math.abs(pct))
  const dash = (abs / 100) * circ
  const color = positive ? '#72E4A5' : '#D63B27'
  return (
    <svg width={70} height={70} style={{ flexShrink: 0 }}>
      <circle cx={35} cy={35} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle cx={35} cy={35} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 35 35)"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text x={35} y={39} textAnchor="middle"
        style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700, fill: color }}>
        {abs}%
      </text>
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    transactions, monthTransactions, categories, income, monthIncome, monthSpending,
    spendingByCategory, margen, daysRemaining, loading, lastImportAt,
    currentMonth, currentYear,
  } = useData()

  const effectiveIncome = income || monthIncome
  const margenPct = effectiveIncome > 0 ? Math.round((margen / effectiveIncome) * 100) : 0
  const savingsRate = effectiveIncome > 0 ? Math.max(0, Math.round((margen / effectiveIncome) * 100)) : 0
  const dailyBurn = monthSpending / Math.max(1, new Date().getDate())
  const monthName = new Date().toLocaleString('es-ES', { month: 'long' })

  // Category rows using actual user categories
  const catMap = useMemo(() => Object.fromEntries(categories.map(c => [c.name, c])), [categories])

  const categoryRows = useMemo(() => {
    const rows = []
    // Only expense categories with spending
    for (const [name, spent] of Object.entries(spendingByCategory)) {
      const cat = catMap[name]
      if (cat?.tipo === 'Ingreso') continue
      const budget = cat?.budget || 0
      const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : (spent > 0 ? 101 : 0)
      const rest = budget > 0 ? budget - spent : null
      rows.push({
        name,
        emoji: cat?.emoji || '📦',
        color: cat?.color || '#8A8A8A',
        spent,
        budget,
        pct,
        rest,
        isOver: budget > 0 && spent > budget,
        isWarn: budget > 0 && spent >= budget * 0.8 && spent <= budget,
      })
    }
    return rows.sort((a, b) => b.spent - a.spent)
  }, [spendingByCategory, catMap])

  // Alerts
  const alerts = useMemo(() => {
    const list = []
    categoryRows.forEach(c => {
      if (c.isOver)
        list.push({ icon: '🚨', title: `${c.emoji} ${c.name} superó el límite`, sub: `${fmt(c.spent)} € gastados · límite ${fmt(c.budget)} €`, severity: 'crítica', color: 'var(--alerta)', bg: 'rgba(214,59,39,0.08)' })
      else if (c.isWarn)
        list.push({ icon: '⚠️', title: `${c.emoji} ${c.name} al ${c.pct}%`, sub: `Solo ${fmt(c.rest)} € hasta el límite`, severity: 'aviso', color: 'var(--aviso)', bg: 'rgba(184,125,0,0.08)' })
    })
    if (list.length === 0 && monthTransactions.length > 0)
      list.push({ icon: '✅', title: 'Todo bajo control', sub: 'Ninguna categoría cerca del límite', severity: 'ok', color: 'var(--acento)', bg: 'rgba(46,184,122,0.08)' })
    if (monthTransactions.length === 0)
      list.push({ icon: '📂', title: 'Sin movimientos este mes', sub: 'Importa un extracto para empezar', severity: 'info', color: 'var(--text-muted)', bg: 'var(--bg-surface2)' })
    return list.slice(0, 4)
  }, [categoryRows, monthTransactions])

  // Recent transactions (last 6, sorted by date desc)
  const recentTx = useMemo(() =>
    [...monthTransactions]
      .filter(t => t.status !== 'previsto' && t.status !== 'conciliado')
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6),
    [monthTransactions]
  )

  // Top 3 spending categories for the mini breakdown
  const top3 = categoryRows.slice(0, 3)

  // Last 3 months mini sparkline data
  const miniHistory = useMemo(() => {
    const result = []
    for (let i = 2; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1)
      const m = d.getMonth(), y = d.getFullYear()
      const txs = transactions.filter(t => {
        const td = new Date(t.date)
        return td.getMonth() === m && td.getFullYear() === y && t.status !== 'previsto'
      })
      const inc = txs.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
      const exp = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
      result.push({ label: d.toLocaleString('es-ES', { month: 'short' }), margen: inc - exp, isNow: i === 0 })
    }
    return result
  }, [transactions, currentMonth, currentYear])

  // Fecha de corte: último import registrado, o la transacción más reciente
  const latestTxDate = useMemo(() => {
    if (!transactions.length) return null
    const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date))
    return sorted[0]?.date || null   // formato YYYY-MM-DD
  }, [transactions])

  if (loading) return <div className="auth-loading"><div className="auth-spinner"></div></div>

  // Preferir timestamp exacto de import; si no, usar fecha de tx más reciente
  const corteIso  = lastImportAt || (latestTxDate ? `${latestTxDate}T00:00:00` : null)
  const corteText = corteIso ? `Último corte ${relativeTime(corteIso)}` : 'Sin datos'
  const corteDateLabel = corteIso
    ? new Date(corteIso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', ...(lastImportAt ? { hour: '2-digit', minute: '2-digit' } : {}) })
    : null

  return (
    <div>

      {/* ── Corte strip ─────────────────────────────────────────────────────── */}
      {corteIso && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          padding: '8px 14px', borderRadius: 10, background: 'var(--bg-surface)',
          border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--acento)', flexShrink: 0, boxShadow: '0 0 6px var(--acento)' }} />
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>{corteText}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>· {corteDateLabel}</span>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => navigate('/importar')}
            style={{ padding: '4px 12px', borderRadius: 7, border: '1px solid var(--border-accent)', background: 'transparent', color: 'var(--acento)', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Mono',monospace", letterSpacing: '0.04em' }}
          >
            ↑ Actualizar
          </button>
        </div>
      )}

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="kpi-row" style={{ marginBottom: 16 }}>

        {/* Margen */}
        <div className="kpi-card accent" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div className="kpi-label">Tu margen en {monthName}</div>
            <div className="kpi-value" style={{ fontSize: 28, color: margen >= 0 ? '#72E4A5' : '#FF6B5B' }}>
              <span className="eur">€</span>{fmt(Math.abs(margen))}
            </div>
            <div className="kpi-phrase">
              {margen >= 0
                ? `+${margenPct}% · ${daysRemaining} días restantes`
                : `Déficit · ${daysRemaining} días restantes`}
            </div>
            {/* Mini 3-month history */}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'flex-end' }}>
              {miniHistory.map((m, i) => {
                const maxAbs = Math.max(...miniHistory.map(x => Math.abs(x.margen)), 1)
                const h = Math.max(3, Math.round((Math.abs(m.margen) / maxAbs) * 22))
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: 20, height: h, borderRadius: 3, background: m.isNow ? (m.margen >= 0 ? '#72E4A5' : '#FF6B5B') : 'rgba(255,255,255,0.15)', transition: 'height 0.4s' }} />
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, color: m.isNow ? '#72E4A5' : 'rgba(212,245,226,0.35)', fontWeight: m.isNow ? 700 : 400 }}>{m.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
          <MargenRing pct={margenPct} positive={margen >= 0} />
        </div>

        {/* Ingresos */}
        <div className="kpi-card">
          <div className="kpi-label">Ingresos este mes</div>
          <div className="kpi-value green"><span className="eur">€</span>{fmt(effectiveIncome)}</div>
          <div className="kpi-delta">{monthTransactions.filter(t => t.amount > 0 && t.status !== 'previsto').length} operaciones</div>
          {/* Vs gasto bar */}
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono',monospace", marginBottom: 4 }}>
              <span>Gastado</span>
              <span>{effectiveIncome > 0 ? Math.round((monthSpending / effectiveIncome) * 100) : 0}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 100, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 100, background: monthSpending > effectiveIncome ? 'var(--alerta)' : monthSpending > effectiveIncome * 0.8 ? 'var(--aviso)' : 'var(--acento)', width: `${Math.min(100, effectiveIncome > 0 ? (monthSpending / effectiveIncome) * 100 : 0)}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>

        {/* Gastos */}
        <div className="kpi-card">
          <div className="kpi-label">Gastado este mes</div>
          <div className="kpi-value" style={{ color: 'var(--text-primary)' }}><span className="eur">€</span>{fmt(monthSpending)}</div>
          <div className="kpi-delta">{monthTransactions.filter(t => t.amount < 0 && t.status !== 'previsto').length} operaciones</div>
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            {top3.map((c, i) => (
              <div key={i} title={c.name} style={{ flex: 1, background: `${c.color}20`, borderRadius: 6, padding: '4px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 14 }}>{c.emoji}</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{fmt(c.spent)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Ahorro / quema diaria */}
        <div className="kpi-card">
          <div className="kpi-label">Quema diaria media</div>
          <div className="kpi-value"><span className="eur">€</span>{fmt(Math.round(dailyBurn))}</div>
          <div className="kpi-delta">/ día · {new Date().getDate()} días pasados</div>
          <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: savingsRate > 0 ? 'rgba(46,184,122,0.08)' : 'rgba(214,59,39,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)' }}>Tasa de ahorro</span>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 700, color: savingsRate > 0 ? 'var(--acento)' : 'var(--alerta)' }}>
              {savingsRate > 0 ? '+' : ''}{margenPct}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────────────────────────────── */}
      <div className="dashboard-grid" style={{ marginBottom: 16 }}>

        {/* Categorías con barras */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">📊 Categorías — {monthName}</span>
            <button className="panel-action" onClick={() => navigate('/categorias')}>Ver todas →</button>
          </div>
          {categoryRows.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Sin movimientos categorizados.<br />
              <button className="auth-link" style={{ marginTop: 8, display: 'inline-block' }} onClick={() => navigate('/importar')}>Importa un extracto</button>
            </div>
          ) : (
            <div style={{ padding: '4px 0 8px' }}>
              {categoryRows.slice(0, 8).map(c => {
                const barW = c.budget > 0 ? Math.min(100, c.pct) : Math.min(100, Math.round((c.spent / (monthSpending || 1)) * 100))
                const barColor = c.isOver ? 'var(--alerta)' : c.isWarn ? 'var(--aviso)' : (c.color || 'var(--acento)')
                return (
                  <div key={c.name} style={{ padding: '9px 18px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{c.emoji}</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{c.name}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, fontWeight: 600, color: c.isOver ? 'var(--alerta)' : 'var(--text-primary)', flexShrink: 0 }}>
                        {fmt2(c.spent)} €
                      </span>
                      {c.budget > 0 && (
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
                          / {fmt(c.budget)} €
                        </span>
                      )}
                      {(c.isOver || c.isWarn) && (
                        <span style={{ fontSize: 11, background: c.isOver ? 'rgba(214,59,39,0.1)' : 'rgba(184,125,0,0.1)', color: c.isOver ? 'var(--alerta)' : 'var(--aviso)', padding: '1px 6px', borderRadius: 20, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
                          {c.isOver ? `+${fmt(c.spent - c.budget)}` : `${c.pct}%`}
                        </span>
                      )}
                    </div>
                    <div style={{ height: 4, borderRadius: 100, background: 'var(--border)', overflow: 'hidden', marginLeft: 32 }}>
                      <div style={{ height: '100%', width: `${barW}%`, borderRadius: 100, background: barColor, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Alertas */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">🔔 Alertas</span>
            <button className="panel-action" onClick={() => navigate('/alertas')}>Ver todas</button>
          </div>
          <div style={{ padding: '4px 0' }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {a.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>{a.title}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>{a.sub}</div>
                </div>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 700, color: a.color, letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0, paddingTop: 2 }}>{a.severity}</span>
              </div>
            ))}
          </div>

          {/* Resumen ingresos vs gastos */}
          {effectiveIncome > 0 && (
            <div style={{ margin: '12px 16px 8px', padding: '12px 14px', borderRadius: 10, background: 'var(--bg-surface2)', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Resumen del mes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'Ingresos', val: effectiveIncome, color: 'var(--acento)' },
                  { label: 'Gastos', val: monthSpending, color: monthSpending > effectiveIncome ? 'var(--alerta)' : 'var(--text-primary)' },
                  { label: 'Margen', val: margen, color: margen >= 0 ? 'var(--acento)' : 'var(--alerta)', sign: true },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>{row.label}</span>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 700, color: row.color }}>
                      {row.sign && margen >= 0 ? '+' : ''}{fmt2(row.val)} €
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Últimos movimientos ──────────────────────────────────────────────── */}
      <div className="panel" style={{ marginBottom: 14 }}>
        <div className="panel-header">
          <span className="panel-title">🕐 Últimos movimientos</span>
          <button className="panel-action" onClick={() => navigate('/movimientos')}>Ver todos →</button>
        </div>
        {recentTx.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Sin movimientos.{' '}
            <button className="auth-link" onClick={() => navigate('/importar')}>Importa tu primer extracto</button>
          </div>
        ) : (
          <div>
            {recentTx.map((t, i) => {
              const cat = catMap[t.category]
              const catEmoji = cat?.emoji || '📦'
              const catColor = cat?.color || '#8A8A8A'
              const isIncome = t.amount > 0
              return (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px',
                  borderBottom: i < recentTx.length - 1 ? '1px solid var(--border)' : 'none',
                  background: isIncome ? 'rgba(46,184,122,0.025)' : undefined,
                }}>
                  {/* Icon */}
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${catColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {catEmoji}
                  </div>
                  {/* Description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.description}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)' }}>{t.date}</span>
                      {t.category && (
                        <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: `${catColor}18`, color: catColor, fontFamily: "'DM Mono',monospace", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {t.category}
                        </span>
                      )}
                      {t.account && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono',monospace" }}>{t.account}</span>
                      )}
                    </div>
                  </div>
                  {/* Amount */}
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 700, color: isIncome ? 'var(--acento)' : 'var(--text-primary)', flexShrink: 0, letterSpacing: '-0.3px' }}>
                    {isIncome ? '+' : '−'}{fmt2(Math.abs(t.amount))} €
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
