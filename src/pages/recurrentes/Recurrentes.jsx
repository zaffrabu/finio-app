import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'

const QUICK_EMOJIS = ['📅','🏠','💡','📱','🎵','🏋️','☁️','🔒','🚗','💊','📺','🎮','🐶','🏦','📦']

// ── Modal: confirmar y guardar como gasto fijo ────────────────────────────────
function AddFixedModal({ detected, onSave, onClose }) {
  const [nombre,  setNombre]  = useState(detected.description.slice(0, 40))
  const [importe, setImporte] = useState(String(Math.round(detected.avgAmount * 100) / 100))
  const [dia,     setDia]     = useState(String(detected.avgDay))
  const [emoji,   setEmoji]   = useState('📅')
  const [saving,  setSaving]  = useState(false)

  const handle = async () => {
    if (!nombre.trim() || !importe) return
    setSaving(true)
    await onSave({ emoji, nombre: nombre.trim(), dia, importe: parseFloat(importe.replace(',', '.')) })
    setSaving(false)
    onClose()
  }

  return (
    <div className="cat-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cat-modal" style={{ maxWidth: 440 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">📌 Añadir como gasto fijo</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cat-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Info del patrón detectado */}
          <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(79,201,239,0.06)', border: '1px solid rgba(79,201,239,0.15)', fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono',monospace" }}>
            Detectado en <strong style={{ color: 'var(--text-primary)' }}>{detected.monthCount} meses</strong> · importe medio <strong style={{ color: 'var(--text-primary)' }}>−{detected.avgAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong>
          </div>

          {/* Emoji */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Icono</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {QUICK_EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: emoji === e ? '2px solid var(--acento)' : '1px solid var(--border)', background: emoji === e ? 'rgba(46,184,122,0.1)' : 'var(--bg-surface2)', fontSize: 18, cursor: 'pointer' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} maxLength={50}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13, boxSizing: 'border-box' }} />
          </div>

          {/* Importe + Día */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Importe (€)</label>
              <input type="number" value={importe} onChange={e => setImporte(e.target.value)} min="0" step="0.01"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 600, boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6, fontFamily: "'DM Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>Día del mes</label>
              <input type="number" value={dia} onChange={e => setDia(e.target.value)} min="1" max="31"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 600, boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        <div className="cat-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <div style={{ flex: 1 }} />
          <button className="btn-primary" onClick={handle} disabled={saving || !nombre.trim()}>
            {saving ? 'Guardando...' : '📌 Añadir a gastos fijos'}
          </button>
        </div>
      </div>
    </div>
  )
}

function fmt(n)  { return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }
function fmt2(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

// Normalize description for grouping (remove numbers, extra spaces, lowercase)
function normDesc(s) {
  return (s || '').toLowerCase()
    .replace(/\d{2}\/\d{2}(\/\d{2,4})?/g, '')   // remove dates like 01/04
    .replace(/\b\d+\b/g, '')                       // remove standalone numbers
    .replace(/\s+/g, ' ').trim()
}

// Detect recurring from all transactions
function detectRecurring(transactions) {
  const expenses = transactions.filter(t =>
    t.amount < 0 && t.status !== 'previsto' && t.status !== 'conciliado'
  )

  const groups = {}
  expenses.forEach(t => {
    const key = normDesc(t.description)
    if (!key || key.length < 4) return
    if (!groups[key]) groups[key] = []
    groups[key].push(t)
  })

  const result = []
  for (const [key, txs] of Object.entries(groups)) {
    const months = new Set(txs.map(t => t.date.slice(0, 7)))
    if (months.size < 2) continue

    const amounts  = txs.map(t => Math.abs(t.amount))
    const avg      = amounts.reduce((s, a) => s + a, 0) / amounts.length
    const minA     = Math.min(...amounts)
    const maxA     = Math.max(...amounts)
    const variation = avg > 0 ? (maxA - minA) / avg : 0
    if (variation > 0.25) continue  // skip if amount varies >25%

    const sorted   = [...txs].sort((a, b) => b.date.localeCompare(a.date))
    const lastDate = sorted[0].date
    const dayNums  = txs.map(t => parseInt(t.date.slice(8, 10)))
    const avgDay   = Math.round(dayNums.reduce((s, d) => s + d, 0) / dayNums.length)

    // Confidence: more months = higher confidence
    const confidence = months.size >= 4 ? 'alta' : months.size === 3 ? 'media' : 'baja'

    result.push({
      key,
      description: sorted[0].description,
      category: sorted[0].category || 'Sin categoría',
      avgAmount: avg,
      monthCount: months.size,
      txCount: txs.length,
      avgDay,
      lastDate,
      confidence,
      txs: sorted,
    })
  }

  return result.sort((a, b) => b.monthCount - a.monthCount || b.avgAmount - a.avgAmount)
}

// Match a detected recurring with a fixed expense config
function matchFixed(detected, fixedExpenses) {
  return fixedExpenses.find(fe => {
    const nameMatch = normDesc(fe.nombre).includes(normDesc(detected.description).slice(0, 6)) ||
                      normDesc(detected.description).includes(normDesc(fe.nombre).slice(0, 6))
    const amtMatch  = Math.abs((fe.importe || 0) - detected.avgAmount) < 10
    return nameMatch || amtMatch
  })
}

// ── Detected card ─────────────────────────────────────────────────────────────
function DetectedCard({ d, isIgnored, onIgnore, onAdd }) {
  const [open, setOpen] = useState(false)
  const confColor = d.confidence === 'alta' ? 'var(--acento)' : d.confidence === 'media' ? 'var(--aviso)' : 'var(--text-muted)'
  const confBg    = d.confidence === 'alta' ? 'rgba(46,184,122,0.1)' : d.confidence === 'media' ? 'rgba(184,125,0,0.1)' : 'rgba(138,138,138,0.08)'

  if (isIgnored) return null

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10,
      background: 'var(--bg-surface)', overflow: 'hidden',
      transition: 'border-color 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        {/* Icon */}
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(79,201,239,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          🔁
        </div>
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {d.description}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)' }}>
              {d.monthCount} meses · ~día {d.avgDay}
            </span>
            <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: confBg, color: confColor, fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
              Confianza {d.confidence}
            </span>
            {d.category && (
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: 'var(--bg-surface2)', color: 'var(--text-muted)', fontFamily: "'DM Mono',monospace" }}>
                {d.category}
              </span>
            )}
          </div>
        </div>
        {/* Amount */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
            −{fmt2(d.avgAmount)} €
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)' }}>/ mes aprox.</div>
        </div>
        {/* Chevron */}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block', marginLeft: 4 }}>▶</span>
      </div>

      {/* Expanded: historial + acciones */}
      {open && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-surface2)' }}>
          {/* Historial de apariciones */}
          <div style={{ padding: '10px 16px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {d.txs.slice(0, 8).map((t, i) => (
              <div key={i} style={{ padding: '4px 10px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', fontSize: 11, fontFamily: "'DM Mono',monospace" }}>
                <span style={{ color: 'var(--text-muted)' }}>{t.date.slice(0, 7)}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600, marginLeft: 6 }}>−{fmt2(Math.abs(t.amount))} €</span>
              </div>
            ))}
          </div>
          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => onIgnore(d.key)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
              ✕ Ignorar
            </button>
            <div style={{ flex: 1 }} />
            <button onClick={() => onAdd(d)}
              style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: 'var(--acento)', color: '#0D1F16', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
              + Añadir a gastos fijos
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Fixed expense card ────────────────────────────────────────────────────────
function FixedCard({ fe, matchedTx, today }) {
  const dayNum     = parseInt(fe.dia || '1')
  const paid       = dayNum <= today
  const isUpcoming = !paid && dayNum <= today + 3
  const amount     = fe.importe || 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px',
      border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10,
      background: 'var(--bg-surface)',
      borderLeft: `3px solid ${paid ? 'var(--acento)' : isUpcoming ? 'var(--aviso)' : 'var(--border)'}`,
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: paid ? 'rgba(46,184,122,0.08)' : 'rgba(138,138,138,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
        {fe.emoji || '📅'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {fe.nombre || 'Gasto fijo'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20,
            background: paid ? 'rgba(46,184,122,0.1)' : isUpcoming ? 'rgba(184,125,0,0.12)' : 'rgba(138,138,138,0.08)',
            color: paid ? 'var(--acento)' : isUpcoming ? 'var(--aviso)' : 'var(--text-muted)',
            fontFamily: "'DM Mono',monospace", fontWeight: 700 }}>
            {paid ? `✓ Pagado · día ${dayNum}` : isUpcoming ? `⏳ Próximo · día ${dayNum}` : `Pendiente · día ${dayNum}`}
          </span>
          {matchedTx && (
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono',monospace" }}>
              ↔ {matchedTx.description?.slice(0, 28)}
            </span>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700, color: isUpcoming ? 'var(--aviso)' : 'var(--text-primary)' }}>
          {fmt2(amount)} €
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)' }}>/ mes</div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Recurrentes() {
  const navigate  = useNavigate()
  const { fixedExpenses, settings, saveSettings, transactions, monthTransactions, loading } = useData()

  const today     = new Date().getDate()
  const monthName = new Date().toLocaleString('es-ES', { month: 'long' })
  const [tab, setTab]             = useState('fijos')
  const [ignored, setIgnored]     = useState(new Set())
  const [addingFixed, setAddingFixed] = useState(null)   // detected item being confirmed

  // Detect recurring from full transaction history
  const detected = useMemo(() => detectRecurring(transactions), [transactions])

  // Match fixed expenses with detected (to show link)
  const fixedWithMatch = useMemo(() => {
    return fixedExpenses.map(fe => {
      const match = monthTransactions.find(t => {
        const amtClose = Math.abs(Math.abs(t.amount) - (fe.importe || 0)) < 10
        const dayClose = Math.abs(parseInt(t.date.slice(8, 10)) - parseInt(fe.dia || '1')) <= 5
        return t.amount < 0 && amtClose && dayClose
      })
      return { fe, matchedTx: match || null }
    })
  }, [fixedExpenses, monthTransactions])

  // Detected NOT already in fixed expenses
  const newDetected = useMemo(() => {
    return detected.filter(d => !matchFixed(d, fixedExpenses) && !ignored.has(d.key))
  }, [detected, fixedExpenses, ignored])

  // KPIs
  const totalFixed   = fixedExpenses.reduce((s, fe) => s + (fe.importe || 0), 0)
  const paidCount    = fixedExpenses.filter(fe => parseInt(fe.dia || '1') <= today).length
  const pendingCount = fixedExpenses.length - paidCount
  const totalPending = fixedExpenses.filter(fe => parseInt(fe.dia || '1') > today).reduce((s, fe) => s + (fe.importe || 0), 0)

  const handleIgnore = (key) => setIgnored(prev => new Set([...prev, key]))

  const handleAdd = (d) => setAddingFixed(d)

  const handleSaveFixed = async (newFe) => {
    const updated = [...fixedExpenses, newFe]
    await saveSettings({ ...(settings || {}), fixed_expenses: updated })
    // Also ignore the detected entry so it disappears from the list
    setIgnored(prev => new Set([...prev, addingFixed.key]))
  }

  if (loading) return <div className="auth-loading"><div className="auth-spinner"></div></div>

  return (
    <div>
      {addingFixed && (
        <AddFixedModal
          detected={addingFixed}
          onSave={handleSaveFixed}
          onClose={() => setAddingFixed(null)}
        />
      )}
      {/* KPI strip */}
      <div className="rec-kpi-strip" style={{ marginBottom: 20 }}>
        <div className="kpi-card accent">
          <div className="kpi-label">Total fijos / mes</div>
          <div className="kpi-value accent"><span className="eur">€</span>{fmt(totalFixed)}</div>
          <div className="kpi-phrase">{fixedExpenses.length} gastos fijos configurados</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Pendientes este mes</div>
          <div className="kpi-value" style={{ color: totalPending > 0 ? 'var(--aviso)' : 'var(--acento)' }}>
            <span className="eur">€</span>{fmt(totalPending)}
          </div>
          <div className="kpi-delta">{pendingCount} cobros por llegar</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Ya pagados</div>
          <div className="kpi-value">{paidCount}</div>
          <div className="kpi-delta">de {fixedExpenses.length} este mes</div>
        </div>
        <div className="kpi-card" style={{ borderColor: newDetected.length > 0 ? 'rgba(79,201,239,0.3)' : undefined }}>
          <div className="kpi-label">Detectados automáticamente</div>
          <div className="kpi-value" style={{ color: newDetected.length > 0 ? '#4FC9EF' : 'var(--text-muted)' }}>
            {newDetected.length}
          </div>
          <div className="kpi-delta">posibles recurrentes nuevos</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid var(--border)' }}>
        {[
          { key: 'fijos',      label: '📌 Gastos fijos',           count: fixedExpenses.length },
          { key: 'detectados', label: '🔍 Detectados automáticamente', count: newDetected.length, highlight: newDetected.length > 0 },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '10px 18px', border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--acento)' : '2px solid transparent',
              marginBottom: -2, display: 'flex', alignItems: 'center', gap: 7,
            }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ padding: '1px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: t.highlight ? 'rgba(79,201,239,0.15)' : 'var(--bg-surface2)',
                color: t.highlight ? '#4FC9EF' : 'var(--text-muted)',
              }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Gastos Fijos ─────────────────────────────────────────────── */}
      {tab === 'fijos' && (
        <div className="rec-layout">
          <div>
            {fixedExpenses.length === 0 ? (
              <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📌</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Sin gastos fijos configurados</div>
                <div style={{ fontSize: 13, marginBottom: 16 }}>Añádelos en Ajustes → Perfil, o usa la pestaña "Detectados" para importarlos automáticamente.</div>
                <button className="btn-primary" onClick={() => navigate('/ajustes')}>Ir a Ajustes →</button>
              </div>
            ) : (
              <>
                {/* Pendientes */}
                {fixedWithMatch.filter(({ fe }) => parseInt(fe.dia || '1') > today).length > 0 && (
                  <>
                    <div className="rec-group-header" style={{ marginBottom: 10 }}>
                      Pendientes en {monthName}
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)' }}>{pendingCount} · {fmt(totalPending)} €</span>
                    </div>
                    {fixedWithMatch.filter(({ fe }) => parseInt(fe.dia || '1') > today)
                      .sort((a, b) => parseInt(a.fe.dia || '1') - parseInt(b.fe.dia || '1'))
                      .map(({ fe, matchedTx }, i) => <FixedCard key={i} fe={fe} matchedTx={matchedTx} today={today} />)}
                  </>
                )}

                {/* Pagados */}
                {fixedWithMatch.filter(({ fe }) => parseInt(fe.dia || '1') <= today).length > 0 && (
                  <>
                    <div className="rec-group-header" style={{ marginTop: 8, marginBottom: 10 }}>
                      Ya cobrados
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)' }}>{paidCount} pagados</span>
                    </div>
                    {fixedWithMatch.filter(({ fe }) => parseInt(fe.dia || '1') <= today)
                      .sort((a, b) => parseInt(a.fe.dia || '1') - parseInt(b.fe.dia || '1'))
                      .map(({ fe, matchedTx }, i) => <FixedCard key={i} fe={fe} matchedTx={matchedTx} today={today} />)}
                  </>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="rec-sidebar">
            <div className="panel">
              <div className="panel-header"><span className="panel-title">Desglose mensual</span></div>
              <div className="panel-body">
                <div className="rec-donut-wrap">
                  <svg className="rec-donut-svg" viewBox="0 0 90 90">
                    <circle cx="45" cy="45" r="30" fill="none" stroke="var(--border)" strokeWidth="12"/>
                    {totalFixed > 0 && (() => {
                      const circ = 2 * Math.PI * 30
                      let offset = -circ * 0.25
                      return fixedExpenses.map((fe, i) => {
                        const pct  = (fe.importe || 0) / totalFixed
                        const dash = pct * circ
                        const paid = parseInt(fe.dia || '1') <= today
                        const el   = <circle key={i} cx="45" cy="45" r="30" fill="none"
                          stroke={paid ? 'var(--acento)' : 'var(--aviso)'}
                          strokeWidth="12" strokeDasharray={`${dash} ${circ - dash}`}
                          strokeDashoffset={-offset} strokeLinecap="butt" opacity="0.75" />
                        offset += dash
                        return el
                      })
                    })()}
                    <text x="45" y="41" textAnchor="middle" fontFamily="Poppins" fontSize="12" fontWeight="900" fill="var(--text-primary)">{fmt(totalFixed)}€</text>
                    <text x="45" y="52" textAnchor="middle" fontFamily="DM Mono" fontSize="6" fill="var(--text-muted)" letterSpacing="0.5">/ MES</text>
                  </svg>
                  <div className="rec-donut-legend">
                    {fixedExpenses.map((fe, i) => (
                      <div key={i} className="rec-legend-row">
                        <div className="rec-legend-dot" style={{ background: parseInt(fe.dia || '1') <= today ? 'var(--acento)' : 'var(--aviso)' }}/>
                        <span className="rec-legend-name">{fe.emoji} {fe.nombre}</span>
                        <span className="rec-legend-val">{fmt(fe.importe || 0)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Detectados ───────────────────────────────────────────────── */}
      {tab === 'detectados' && (
        <div>
          <div style={{ padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, fontFamily: "'Poppins',sans-serif", fontSize: 13, color: 'var(--text-muted)' }}>
              Patrones detectados en tu historial de movimientos. Aparecen en 2+ meses con importe similar.
            </div>
            {ignored.size > 0 && (
              <button onClick={() => setIgnored(new Set())}
                style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}>
                Restaurar ignorados ({ignored.size})
              </button>
            )}
          </div>

          {newDetected.length === 0 ? (
            <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                {transactions.length === 0 ? 'Sin movimientos para analizar' : 'Sin recurrentes nuevos detectados'}
              </div>
              <div style={{ fontSize: 13 }}>
                {transactions.length < 20
                  ? 'Importa más meses de movimientos para mejorar la detección.'
                  : 'Todos los patrones detectados ya están configurados como gastos fijos.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>
              <div>
                {newDetected.map(d => (
                  <DetectedCard key={d.key} d={d} isIgnored={false} onIgnore={handleIgnore} onAdd={handleAdd} />
                ))}
              </div>

              {/* Mini panel resumen */}
              <div className="panel" style={{ position: 'sticky', top: 16 }}>
                <div className="panel-header"><span className="panel-title">Resumen detección</span></div>
                <div style={{ padding: '8px 0' }}>
                  {[
                    { label: 'Total detectados', val: detected.length },
                    { label: 'Ya configurados',  val: detected.filter(d => matchFixed(d, fixedExpenses)).length },
                    { label: 'Nuevos candidatos', val: newDetected.length, color: '#4FC9EF' },
                    { label: 'Ignorados',         val: ignored.size, color: 'var(--text-muted)' },
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: 'var(--text-muted)' }}>{r.label}</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 700, color: r.color || 'var(--text-primary)' }}>{r.val}</span>
                    </div>
                  ))}
                  <div style={{ padding: '10px 16px' }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Ahorro mensual potencial detectado
                    </div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.8px' }}>
                      {fmt(Math.round(newDetected.reduce((s, d) => s + d.avgAmount, 0)))} €
                    </div>
                  </div>
                  <div style={{ padding: '0 16px 12px' }}>
                    <button className="btn-primary" style={{ width: '100%', fontSize: 13 }} onClick={() => navigate('/ajustes')}>
                      Gestionar gastos fijos →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
