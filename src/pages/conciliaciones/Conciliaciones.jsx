import { useState, useMemo, useCallback, useEffect } from 'react'
import { useData } from '../../contexts/DataContext'
import { useAuthContext } from '../../contexts/AuthContext'

function fmt(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 2 }) }

const METODOS = ['Bizum', 'Transferencia', 'Efectivo', 'Tarjeta', 'Otro']
const STORAGE_KEY = 'finio_conciliaciones'

function loadMatches() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveMatches(matches) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(matches)) } catch {}
}

// ── Modal vincular N previstos → 1 pago real ─────────────────────────────────
function VincularModal({ selectedPrevs, reales, onConfirm, onClose }) {
  const total = selectedPrevs.reduce((s, t) => s + t.amount, 0)
  const [mode, setMode]       = useState('buscar')  // 'buscar' | 'nuevo'
  const [realId, setRealId]   = useState('')
  const [metodo, setMetodo]   = useState('Bizum')
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10))
  const [newDesc, setNewDesc] = useState('')
  const [newAmt, setNewAmt]   = useState(fmt(total).replace('.', ''))
  const [nota, setNota]       = useState('')

  const selectedReal = reales.find(r => r.id === realId)
  const diff = selectedReal ? selectedReal.amount - total : null

  const handleConfirm = () => {
    if (mode === 'buscar' && !realId) return
    onConfirm({
      previstosIds: selectedPrevs.map(p => p.id),
      realId: mode === 'buscar' ? realId : null,
      newPago: mode === 'nuevo' ? { date: newDate, description: newDesc || `Cobro ${metodo}`, amount: parseFloat(String(newAmt).replace(',', '.')), metodo } : null,
      metodo,
      nota,
      totalPrevisto: total,
    })
  }

  return (
    <div className="cat-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cat-modal" style={{ maxWidth: 520 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">💳 Vincular al pago real</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cat-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Resumen previstos seleccionados */}
          <div style={{ background: 'rgba(79,201,239,0.07)', border: '1px solid rgba(79,201,239,0.2)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
              🗓 {selectedPrevs.length} PREVISTO{selectedPrevs.length !== 1 ? 'S' : ''} SELECCIONADOS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {selectedPrevs.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-primary)' }}>
                  <span>{p.date} · {p.description}</span>
                  <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 600, color: 'var(--acento)' }}>+{fmt(p.amount)} €</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid rgba(79,201,239,0.2)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13 }}>
              <span>Total previsto</span>
              <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--acento)' }}>+{fmt(total)} €</span>
            </div>
          </div>

          {/* Método de pago */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Método de cobro</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {METODOS.map(m => (
                <button key={m} onClick={() => setMetodo(m)}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    background: metodo === m ? 'var(--acento)' : 'var(--bg-surface2)',
                    color: metodo === m ? '#fff' : 'var(--text-muted)', transition: 'all .15s' }}>
                  {{ Bizum: '📲', Transferencia: '🏦', Efectivo: '💵', Tarjeta: '💳', Otro: '•' }[m]} {m}
                </button>
              ))}
            </div>
          </div>

          {/* Modo: buscar real existente vs crear nuevo */}
          <div style={{ display: 'flex', gap: 0, background: 'var(--bg-surface2)', borderRadius: 10, padding: 3 }}>
            {[{ id: 'buscar', label: '🔍 Buscar en movimientos reales' }, { id: 'nuevo', label: '✏️ Registrar pago manualmente' }].map(opt => (
              <button key={opt.id} onClick={() => setMode(opt.id)}
                style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all .15s',
                  background: mode === opt.id ? 'var(--bg-surface)' : 'transparent',
                  color: mode === opt.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: mode === opt.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Buscar real existente */}
          {mode === 'buscar' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                Selecciona el movimiento real que corresponde a este cobro
              </label>
              <select value={realId} onChange={e => setRealId(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 12, border: realId ? '1px solid var(--acento)' : '1px solid var(--border)', background: 'var(--bg-surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }}>
                <option value="">— Selecciona un movimiento —</option>
                {reales.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.date} · {r.description} · +{fmt(r.amount)} €
                  </option>
                ))}
              </select>
              {selectedReal && diff !== null && (
                <div style={{ marginTop: 8, fontSize: 12, padding: '6px 10px', borderRadius: 7,
                  background: Math.abs(diff) < 0.01 ? 'rgba(46,184,122,0.08)' : 'rgba(255,184,48,0.1)',
                  color: Math.abs(diff) < 0.01 ? 'var(--acento)' : 'var(--aviso)' }}>
                  {Math.abs(diff) < 0.01 ? '✓ Importe exacto' : `Diferencia: ${diff > 0 ? '+' : ''}${fmt(diff)} € (${diff > 0 ? 'el Bizum es mayor' : 'el Bizum es menor'})`}
                </div>
              )}
            </div>
          )}

          {/* Registrar pago nuevo */}
          {mode === 'nuevo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Fecha de cobro</label>
                  <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }} />
                </div>
                <div style={{ width: 120 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Importe cobrado</label>
                  <input type="text" value={newAmt} onChange={e => setNewAmt(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12, border: '1px solid var(--acento)', background: 'var(--bg-surface)', fontFamily: "'DM Mono',monospace", color: 'var(--text-primary)', textAlign: 'right' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Descripción (opcional)</label>
                <input type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder={`Cobro ${metodo} — ${selectedPrevs[0]?.detail || selectedPrevs[0]?.description || ''}`}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }} />
              </div>
            </div>
          )}

          {/* Nota */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Nota interna (opcional)</label>
            <input type="text" value={nota} onChange={e => setNota(e.target.value)} placeholder="Ej: Pago mensual Berri, incluye paseos + alojamiento"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontFamily: 'inherit', color: 'var(--text-primary)' }} />
          </div>
        </div>
        <div className="cat-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <div style={{ flex: 1 }} />
          <button className="btn-primary" onClick={handleConfirm}
            disabled={mode === 'buscar' && !realId}>
            ✓ Conciliar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal: diferencia pendiente post-conciliación ─────────────────────────────
function DiffPrevistoModal({ diff, prevTx, onSave, onClose }) {
  // Default date: same day as previsto but next month
  const nextMonthDate = (() => {
    const d = new Date(prevTx.date)
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  })()

  const [targetDate, setTargetDate] = useState(nextMonthDate)
  const [saving, setSaving] = useState(false)

  const fieldStyle = {
    width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 13,
    border: '1px solid var(--border)', background: 'var(--bg-surface)',
    color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  const handleSave = async () => {
    setSaving(true)
    await onSave(targetDate)
    setSaving(false)
    onClose()
  }

  return (
    <div className="cat-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cat-modal" style={{ maxWidth: 440 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">⚠️ Cobro con diferencia</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cat-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Info diferencia */}
          <div style={{ background: 'rgba(255,184,48,0.1)', border: '1px solid rgba(255,184,48,0.3)',
            borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--aviso)', marginBottom: 6 }}>
              El cobro real es {fmt(diff)} € menor que el previsto
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Previsto: <strong>{prevTx.description}</strong> · +{fmt(prevTx.amount)} €<br/>
              Diferencia pendiente: <strong style={{ color: 'var(--aviso)' }}>+{fmt(diff)} €</strong>
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
            ¿Quieres crear un nuevo <strong>previsto</strong> por los <strong style={{ color: 'var(--aviso)' }}>{fmt(diff)} € pendientes</strong> para el mes siguiente?
          </div>

          {/* Fecha */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              FECHA DEL NUEVO PREVISTO
            </label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={fieldStyle} />
          </div>

          <div style={{ background: 'rgba(46,184,122,0.06)', border: '1px solid rgba(46,184,122,0.18)',
            borderRadius: 9, padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
            Se creará: <strong>{prevTx.description}</strong> · <span style={{ color: 'var(--acento)', fontWeight: 700 }}>+{fmt(diff)} €</span> · previsto para {targetDate}
          </div>
        </div>
        <div className="cat-modal-footer">
          <button className="btn-secondary" onClick={onClose}>No, ignorar diferencia</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !targetDate}>
            {saving ? 'Creando...' : '✅ Crear previsto'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Conciliaciones() {
  const { transactions, addTransactions, updateTransaction } = useData()
  const { user } = useAuthContext()

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`
  })
  const [selectedPrevIds, setSelectedPrevIds] = useState(new Set())
  const [showVincular, setShowVincular]       = useState(false)
  const [matches, setMatches]                 = useState(loadMatches)
  const [catFilter, setCatFilter]             = useState('all')
  const [pendingDiff, setPendingDiff]         = useState(null)  // { diff, prevTx }

  // Persist matches
  useEffect(() => { saveMatches(matches) }, [matches])

  // Migración: conciliaciones antiguas cuyos previstos aún tienen status='previsto'
  useEffect(() => {
    if (!matches.length || !transactions.length) return
    const txMap = Object.fromEntries(transactions.map(t => [t.id, t]))
    const toFix = matches.flatMap(m => m.previstosIds).filter(id => txMap[id]?.status === 'previsto')
    if (toFix.length > 0) {
      toFix.forEach(id => updateTransaction(id, { status: 'conciliado' }))
    }
  }, [matches, transactions, updateTransaction])

  // Incluye 'previsto' + 'conciliado' para tener el total correcto en KPIs
  const previstos = useMemo(() => transactions.filter(t => t.status === 'previsto' || t.status === 'conciliado'), [transactions])
  const reales    = useMemo(() => transactions.filter(t => t.status !== 'previsto' && t.status !== 'conciliado'), [transactions])

  const months = useMemo(() => {
    const set = new Set(transactions.map(t => t.date?.slice(0, 7)).filter(Boolean))
    return [...set].sort().reverse()
  }, [transactions])

  const monthPrevistos = useMemo(() => previstos.filter(t => t.date?.startsWith(selectedMonth)), [previstos, selectedMonth])
  const monthReales    = useMemo(() => reales.filter(t => t.date?.startsWith(selectedMonth)), [reales, selectedMonth])

  // Matches for this month
  const monthMatches = useMemo(() =>
    matches.filter(m => m.month === selectedMonth),
    [matches, selectedMonth]
  )

  // IDs already conciliados este mes
  const conciliadosPrevIds = useMemo(() => new Set(monthMatches.flatMap(m => m.previstosIds)), [monthMatches])
  const conciliadosRealIds = useMemo(() => new Set(monthMatches.map(m => m.realId).filter(Boolean)), [monthMatches])

  // Previstos pendientes (no conciliados)
  const pendingPrevs = useMemo(() =>
    monthPrevistos.filter(t => !conciliadosPrevIds.has(t.id)),
    [monthPrevistos, conciliadosPrevIds]
  )

  // Reales sin conciliar (positivos = ingresos)
  const pendingReales = useMemo(() =>
    monthReales.filter(t => t.amount > 0 && !conciliadosRealIds.has(t.id)),
    [monthReales, conciliadosRealIds]
  )

  // Unique categories from previstos
  const prevCats = useMemo(() => [...new Set(monthPrevistos.map(t => t.category).filter(Boolean))].sort(), [monthPrevistos])

  const filteredPrevs = useMemo(() =>
    catFilter === 'all' ? pendingPrevs : pendingPrevs.filter(t => t.category === catFilter),
    [pendingPrevs, catFilter]
  )

  const selectedPrevs = useMemo(() =>
    filteredPrevs.filter(t => selectedPrevIds.has(t.id)),
    [filteredPrevs, selectedPrevIds]
  )

  const totalPrevisto   = monthPrevistos.reduce((s, t) => s + t.amount, 0)
  const totalConciliado = monthMatches.reduce((s, m) => s + (m.totalPrevisto || 0), 0)
  const totalPendiente  = totalPrevisto - totalConciliado

  const togglePrev = (id) => setSelectedPrevIds(prev => {
    const n = new Set(prev)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  const toggleAll = () => {
    if (selectedPrevIds.size === filteredPrevs.length) {
      setSelectedPrevIds(new Set())
    } else {
      setSelectedPrevIds(new Set(filteredPrevs.map(t => t.id)))
    }
  }

  const handleConciliar = useCallback(async ({ previstosIds, realId, newPago, metodo, nota, totalPrevisto: tp }) => {
    let finalRealId = realId
    let realAmount = 0

    // Si es pago nuevo, crearlo como transacción real
    if (newPago) {
      const tx = {
        id: crypto.randomUUID(),
        date: newPago.date,
        description: newPago.description,
        amount: newPago.amount,
        category: selectedPrevs[0]?.category || '',
        tipo: 'Ingreso',
        account: newPago.metodo,
        status: 'real',
        matchSource: 'manual',
      }
      await addTransactions([tx])
      finalRealId = tx.id
      realAmount = newPago.amount
    } else if (realId) {
      const realTx = transactions.find(t => t.id === realId)
      realAmount = realTx ? Math.abs(realTx.amount) : 0
    }

    const newMatch = {
      id: crypto.randomUUID(),
      month: selectedMonth,
      previstosIds,
      realId: finalRealId,
      metodo,
      nota,
      totalPrevisto: tp,
      fecha: new Date().toISOString().slice(0, 10),
    }

    setMatches(prev => [...prev, newMatch])

    // Marcar cada previsto como conciliado → desaparece del tab Previstos
    await Promise.all(previstosIds.map(id => updateTransaction(id, { status: 'conciliado' })))

    setSelectedPrevIds(new Set())
    setShowVincular(false)

    // Detectar diferencia: si cobré menos de lo previsto, ofrecer crear previsto por la diferencia
    const totalPrev = Math.abs(tp)
    const diff = totalPrev - realAmount
    if (diff > 0.01 && selectedPrevs.length > 0) {
      // Usamos el primer previsto como referencia para la descripción y fecha
      setPendingDiff({ diff, prevTx: selectedPrevs[0] })
    }
  }, [selectedPrevs, selectedMonth, transactions, addTransactions, updateTransaction])

  const handleSaveDiff = useCallback(async (targetDate) => {
    if (!pendingDiff) return
    const { diff, prevTx } = pendingDiff
    const newPrevisto = {
      id: crypto.randomUUID(),
      date: targetDate,
      description: prevTx.description,
      detail: `Diferencia pendiente (cobro parcial de ${fmt(Math.abs(prevTx.amount))} €)`,
      amount: Math.abs(prevTx.amount) > 0 ? diff : -diff,  // same sign as original
      category: prevTx.category || '',
      tipo: prevTx.tipo || 'Ingreso',
      account: prevTx.account || '',
      status: 'previsto',
      matchSource: 'manual',
    }
    await addTransactions([newPrevisto])
    setPendingDiff(null)
  }, [pendingDiff, addTransactions])

  const handleDeleteMatch = async (id) => {
    const match = matches.find(m => m.id === id)
    if (match) {
      // Restaurar previstos a su estado original
      await Promise.all(match.previstosIds.map(pid => updateTransaction(pid, { status: 'previsto' })))
    }
    setMatches(prev => prev.filter(m => m.id !== id))
  }

  if (previstos.length === 0) {
    return (
      <div className="panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗓</div>
        <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Sin previsiones</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
          Importa previsiones de ingresos desde <strong>Importar → Previsiones de ingresos</strong>, o añade movimientos marcados como "Previsto" en Movimientos.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showVincular && (
        <VincularModal
          selectedPrevs={selectedPrevs}
          reales={pendingReales}
          onConfirm={handleConciliar}
          onClose={() => setShowVincular(false)}
        />
      )}

      {/* Modal diferencia post-conciliación */}
      {pendingDiff && (
        <DiffPrevistoModal
          diff={pendingDiff.diff}
          prevTx={pendingDiff.prevTx}
          onSave={handleSaveDiff}
          onClose={() => setPendingDiff(null)}
        />
      )}

      {/* ── KPIs ── */}
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Total previsto</div>
          <div className="kpi-value" style={{ color: 'var(--acento)' }}>+{fmt(totalPrevisto)} €</div>
          <div className="kpi-delta">{monthPrevistos.length} previsiones</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Conciliado</div>
          <div className="kpi-value" style={{ color: 'var(--acento)' }}>+{fmt(totalConciliado)} €</div>
          <div className="kpi-delta">{monthMatches.length} pagos vinculados</div>
        </div>
        <div className="kpi-card" style={totalPendiente > 0 ? { borderColor: 'var(--aviso)' } : undefined}>
          <div className="kpi-label">Pendiente de cobro</div>
          <div className="kpi-value" style={{ color: totalPendiente > 0 ? 'var(--aviso)' : 'var(--text-muted)' }}>
            +{fmt(totalPendiente)} €
          </div>
          <div className="kpi-delta">{pendingPrevs.length} previsiones sin conciliar</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Reales sin vincular</div>
          <div className="kpi-value">{pendingReales.length}</div>
          <div className="kpi-delta">cobros aún no asignados</div>
        </div>
      </div>

      {/* ── Selector mes + categoría ── */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono',monospace" }}>MES</span>
        <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); setSelectedPrevIds(new Set()) }}
          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 13, color: 'var(--text-primary)' }}>
          {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        {prevCats.length > 1 && (
          <>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono',monospace" }}>CATEGORÍA</span>
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setSelectedPrevIds(new Set()) }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 13, color: 'var(--text-primary)' }}>
              <option value="all">Todas</option>
              {prevCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

        {/* ── PREVISTOS PENDIENTES ── */}
        <div className="panel">
          <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="panel-title">🗓 Previstos pendientes</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {selectedPrevs.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--acento)', fontWeight: 600 }}>
                  {selectedPrevs.length} sel. · +{fmt(selectedPrevs.reduce((s, t) => s + t.amount, 0))} €
                </span>
              )}
              <button
                onClick={() => setShowVincular(true)}
                disabled={selectedPrevs.length === 0}
                style={{ padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all .15s',
                  background: selectedPrevs.length > 0 ? 'var(--acento)' : 'var(--bg-surface2)',
                  color: selectedPrevs.length > 0 ? '#fff' : 'var(--text-muted)',
                  opacity: selectedPrevs.length === 0 ? 0.5 : 1 }}>
                💳 Vincular pago →
              </button>
            </div>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {filteredPrevs.length === 0 ? (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                ✅ Todos los previstos de este mes están conciliados
              </div>
            ) : (
              <table className="mov-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>
                      <input type="checkbox"
                        checked={selectedPrevIds.size === filteredPrevs.length && filteredPrevs.length > 0}
                        onChange={toggleAll} style={{ cursor: 'pointer' }} />
                    </th>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'right' }}>Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrevs.map(t => {
                    const sel = selectedPrevIds.has(t.id)
                    return (
                      <tr key={t.id}
                        onClick={() => togglePrev(t.id)}
                        style={{ cursor: 'pointer', background: sel ? 'rgba(46,184,122,0.06)' : undefined,
                          outline: sel ? '1.5px solid rgba(46,184,122,0.3)' : 'none', outlineOffset: '-1px' }}>
                        <td onClick={e => e.stopPropagation()}>
                          <input type="checkbox" checked={sel} onChange={() => togglePrev(t.id)} style={{ cursor: 'pointer' }} />
                        </td>
                        <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--text-muted)' }}>{t.date}</td>
                        <td>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{t.description}</div>
                          {t.detail && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.detail}</div>}
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.category || '—'}</td>
                        <td style={{ textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 700, color: 'var(--acento)' }}>
                          +{fmt(t.amount)} €
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── PAGOS REALES SIN VINCULAR ── */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">✅ Cobros reales sin vincular</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {pendingReales.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Sin cobros reales este mes.<br/>Los cobros en efectivo o Bizum se añaden manualmente en Movimientos.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {pendingReales.map(r => (
                  <div key={r.id} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{r.description}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.date} · {r.account || '—'}</div>
                    </div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 700, color: 'var(--acento)', whiteSpace: 'nowrap' }}>
                      +{fmt(r.amount)} €
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CONCILIACIONES HECHAS ── */}
      {monthMatches.length > 0 && (
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">✅ Conciliaciones del mes</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            {monthMatches.map(m => {
              const prevTxs  = m.previstosIds.map(id => transactions.find(t => t.id === id)).filter(Boolean)
              const realTx   = m.realId ? transactions.find(t => t.id === m.realId) : null
              const realAmt  = realTx?.amount || m.totalPrevisto
              const diff     = realAmt - m.totalPrevisto

              return (
                <div key={m.id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Previstos */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      🗓 {prevTxs.length} PREVISTO{prevTxs.length !== 1 ? 'S' : ''}
                    </div>
                    {prevTxs.map(p => (
                      <div key={p.id} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 2 }}>
                        {p.date} · {p.description} · <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--acento)' }}>+{fmt(p.amount)} €</span>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                      Total: <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--acento)' }}>+{fmt(m.totalPrevisto)} €</span>
                    </div>
                  </div>

                  {/* Flecha */}
                  <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                    <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>→</div>
                  </div>

                  {/* Pago real */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      {{ Bizum: '📲', Transferencia: '🏦', Efectivo: '💵', Tarjeta: '💳', Otro: '•' }[m.metodo] || '💳'} {m.metodo?.toUpperCase()}
                    </div>
                    {realTx ? (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {realTx.date} · {realTx.description}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Registrado manualmente</div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", color: 'var(--acento)' }}>+{fmt(realAmt)} €</span>
                      {Math.abs(diff) > 0.01 && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: diff > 0 ? 'var(--acento)' : 'var(--alerta)' }}>
                          ({diff > 0 ? '+' : ''}{fmt(diff)} €)
                        </span>
                      )}
                    </div>
                    {m.nota && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>{m.nota}</div>}
                  </div>

                  {/* Estado + borrar */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span className="inline-badge" style={{ background: 'rgba(46,184,122,0.12)', color: 'var(--acento)' }}>✓ Conciliado</span>
                    <button onClick={() => handleDeleteMatch(m.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}
                      title="Deshacer conciliación">↩ Deshacer</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
