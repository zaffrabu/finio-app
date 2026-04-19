import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { matchUserCategory } from '../../utils/categoryMatcher'

const PAGE_SIZE = 50

// ── Nueva transacción manual ──────────────────────────────────────────────────
function NewTransactionModal({ categories, existingAccounts, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10)
  const [date, setDate]         = useState(today)
  const [desc, setDesc]         = useState('')
  const [detail, setDetail]     = useState('')
  const [amount, setAmount]     = useState('')
  const [sign, setSign]         = useState(-1)           // -1 gasto / +1 ingreso
  const [parentId, setParentId] = useState('')
  const [childId, setChildId]   = useState('')
  const [account, setAccount]   = useState('')
  const [status, setStatus]     = useState('real')
  const [saving, setSaving]     = useState(false)

  const uniqueCats = useMemo(() => {
    const seen = new Set()
    return categories.filter(c => { const k = c.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
  }, [categories])
  const parentCats = uniqueCats.filter(c => !c.parent_id)
  const childrenOf = (pid) => uniqueCats.filter(c => c.parent_id === pid)

  const selectedParent = parentCats.find(p => p.id === parentId) || null
  const kids = parentId ? childrenOf(parentId) : []
  const selectedChild = kids.find(k => k.id === childId) || null
  const categoryName = selectedChild?.name || selectedParent?.name || ''
  const tipo = selectedParent?.tipo || (sign > 0 ? 'Ingreso' : 'Variable')

  const handleSave = async () => {
    if (!desc.trim() || !amount || !date) return
    setSaving(true)
    const tx = {
      id: crypto.randomUUID(),
      date,
      description: desc.trim(),
      detail: detail.trim(),
      amount: sign * Math.abs(parseFloat(amount)),
      category: categoryName,
      tipo,
      account: account.trim() || 'Manual',
      status,
      matchSource: 'manual',
    }
    await onSave(tx)
    setSaving(false)
    onClose()
  }

  const fieldStyle = {
    padding: '7px 10px', borderRadius: 7, fontSize: 13,
    border: '1px solid var(--border)', background: 'var(--bg-surface)',
    color: 'var(--text-primary)', fontFamily: 'inherit', width: '100%',
  }

  return (
    <div className="cat-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cat-modal" style={{ maxWidth: 520 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">➕ Nuevo movimiento</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cat-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Tipo gasto/ingreso */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setSign(-1)} style={{
              flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: sign < 0 ? 'rgba(214,59,39,0.1)' : 'var(--bg-surface2)',
              color: sign < 0 ? 'var(--alerta)' : 'var(--text-muted)',
              fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
            }}>− Gasto</button>
            <button onClick={() => setSign(1)} style={{
              flex: 1, padding: '9px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: sign > 0 ? 'rgba(46,184,122,0.1)' : 'var(--bg-surface2)',
              color: sign > 0 ? 'var(--acento)' : 'var(--text-muted)',
              fontWeight: 700, fontSize: 14, transition: 'all 0.15s',
            }}>+ Ingreso</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>FECHA</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>IMPORTE (€)</label>
              <input type="number" step="0.01" min="0" placeholder="0,00"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{ ...fieldStyle, color: sign > 0 ? 'var(--acento)' : 'var(--alerta)', fontWeight: 600 }} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>DESCRIPCIÓN *</label>
            <input type="text" placeholder="Ej: Mercadona, Netflix, Alquiler..." value={desc} onChange={e => setDesc(e.target.value)} style={fieldStyle} />
          </div>

          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>DETALLE / NOTA</label>
            <input type="text" placeholder="Nota adicional (opcional)" value={detail} onChange={e => setDetail(e.target.value)} style={fieldStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>CATEGORÍA</label>
              <select value={parentId} onChange={e => { setParentId(e.target.value); setChildId('') }} style={fieldStyle}>
                <option value="">— Sin categoría —</option>
                {parentCats.map(p => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>SUBCATEGORÍA</label>
              <select value={childId} onChange={e => setChildId(e.target.value)} style={fieldStyle} disabled={!kids.length}>
                <option value="">— General —</option>
                {kids.map(k => <option key={k.id} value={k.id}>{k.emoji} {k.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>CUENTA / BANCO</label>
              <input type="text" list="accounts-list" placeholder="Ej: BBVA, Revolut..." value={account} onChange={e => setAccount(e.target.value)} style={fieldStyle} />
              <datalist id="accounts-list">
                {existingAccounts.map(a => <option key={a} value={a} />)}
              </datalist>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>ESTADO</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={fieldStyle}>
                <option value="real">✅ Real</option>
                <option value="previsto">🗓 Previsto</option>
              </select>
            </div>
          </div>
        </div>
        <div className="cat-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !desc.trim() || !amount || !date}>
            {saving ? 'Guardando...' : 'Añadir movimiento'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Posponer Previsto Modal ───────────────────────────────────────────────────
function PostponerModal({ tx, onSave, onClose }) {
  // Next-month same day as default target date
  const nextMonthDate = (() => {
    const d = new Date(tx.date)
    d.setMonth(d.getMonth() + 1)
    return d.toISOString().slice(0, 10)
  })()

  const absAmount   = Math.abs(tx.amount)
  const [mode, setMode]         = useState('total')   // 'total' | 'parcial'
  const [receivedAmt, setReceivedAmt] = useState('')  // lo que ya cobré (sólo en parcial)
  const [newDate, setNewDate]   = useState(nextMonthDate)
  const [saving, setSaving]     = useState(false)

  const remaining = mode === 'parcial'
    ? Math.max(0, absAmount - Math.abs(parseFloat(receivedAmt) || 0))
    : absAmount

  const isValid = newDate && remaining > 0 &&
    (mode === 'total' || (parseFloat(receivedAmt) > 0 && parseFloat(receivedAmt) < absAmount))

  const fieldStyle = {
    padding: '8px 10px', borderRadius: 8, fontSize: 13,
    border: '1px solid var(--border)', background: 'var(--bg-surface)',
    color: 'var(--text-primary)', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box',
  }

  const handleSave = async () => {
    if (!isValid) return
    setSaving(true)
    await onSave({
      tx,
      mode,
      receivedAmt: mode === 'parcial' ? parseFloat(receivedAmt) : 0,
      remaining,
      newDate,
    })
    setSaving(false)
    onClose()
  }

  const sign = tx.amount < 0 ? -1 : 1
  const fmt = n => n.toLocaleString('es-ES', { minimumFractionDigits: 2 })

  return (
    <div className="cat-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="cat-modal" style={{ maxWidth: 460 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">⏭ Posponer previsto</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cat-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Resumen del previsto original */}
          <div style={{ background: 'var(--bg-surface2)', borderRadius: 10, padding: '12px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{tx.description}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Previsto para {tx.date}</div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 16, fontWeight: 700,
              color: sign > 0 ? 'var(--acento)' : 'var(--alerta)' }}>
              {sign > 0 ? '+' : '−'}{fmt(absAmount)} €
            </div>
          </div>

          {/* Tipo de posponer */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              ¿QUÉ OCURRIÓ?
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMode('total')} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: mode === 'total' ? 'rgba(155,143,255,0.15)' : 'var(--bg-surface2)',
                color: mode === 'total' ? '#7C6FE0' : 'var(--text-muted)',
                fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                outline: mode === 'total' ? '2px solid #9B8FFF60' : 'none',
              }}>
                ⏭ No se cobró nada<br/>
                <span style={{ fontSize: 11, fontWeight: 400 }}>Mover todo al siguiente mes</span>
              </button>
              <button onClick={() => setMode('parcial')} style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: mode === 'parcial' ? 'rgba(255,184,48,0.15)' : 'var(--bg-surface2)',
                color: mode === 'parcial' ? '#B87D00' : 'var(--text-muted)',
                fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                outline: mode === 'parcial' ? '2px solid var(--aviso)60' : 'none',
              }}>
                💰 Cobro parcial<br/>
                <span style={{ fontSize: 11, fontWeight: 400 }}>Sólo recibí una parte</span>
              </button>
            </div>
          </div>

          {/* Si cobro parcial: cuánto recibí */}
          {mode === 'parcial' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                IMPORTE RECIBIDO (€)
              </label>
              <input
                type="number" step="0.01" min="0.01" max={absAmount - 0.01}
                placeholder={`Menos de ${fmt(absAmount)} €`}
                value={receivedAmt}
                onChange={e => setReceivedAmt(e.target.value)}
                style={{ ...fieldStyle, color: 'var(--aviso)', fontWeight: 600 }}
              />
              {parseFloat(receivedAmt) > 0 && parseFloat(receivedAmt) < absAmount && (
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between',
                  fontSize: 12, color: 'var(--text-muted)', background: 'rgba(46,184,122,0.06)',
                  borderRadius: 8, padding: '8px 12px' }}>
                  <span>✅ Registrado como cobrado</span>
                  <span style={{ fontWeight: 700, color: 'var(--aviso)' }}>
                    Pendiente → {fmt(remaining)} €
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Fecha destino */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              NUEVA FECHA PREVISTA
            </label>
            <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} style={fieldStyle} />
          </div>

          {/* Resumen de lo que va a pasar */}
          {isValid && (
            <div style={{ background: 'rgba(46,184,122,0.06)', border: '1px solid rgba(46,184,122,0.2)',
              borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
              <div style={{ fontWeight: 600, color: 'var(--acento)', marginBottom: 6 }}>✅ Lo que pasará:</div>
              {mode === 'parcial' && (
                <div style={{ marginBottom: 4 }}>
                  • Se creará un movimiento <strong>real</strong> de {sign > 0 ? '+' : '−'}{fmt(parseFloat(receivedAmt))} € (lo cobrado)
                </div>
              )}
              <div style={{ marginBottom: 4 }}>
                • Se creará un nuevo <strong>previsto</strong> de {sign > 0 ? '+' : '−'}{fmt(remaining)} € para {newDate}
              </div>
              <div>• El previsto original ({tx.date}) se eliminará</div>
            </div>
          )}
        </div>
        <div className="cat-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving || !isValid}>
            {saving ? 'Guardando...' : '⏭ Posponer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bulk Replace Modal ────────────────────────────────────────────────────────
function BulkReplaceModal({ transactions, categories, onReplace, onClose }) {
  const uniqueCats = useMemo(() => {
    const seen = new Set(); return categories.filter(c => { const k=c.name.toLowerCase(); if(seen.has(k)) return false; seen.add(k); return true })
  }, [categories])
  const parentCats = uniqueCats.filter(c => !c.parent_id)
  const childrenOf = id => uniqueCats.filter(c => c.parent_id === id)
  const allUsedCats = useMemo(() => {
    const s = new Set(transactions.map(t => t.category).filter(Boolean)); return [...s]
  }, [transactions])

  const [fromCat, setFromCat]   = useState('')
  const [toParent, setToParent] = useState('')
  const [toChild, setToChild]   = useState('')
  const [toTipo, setToTipo]     = useState('')
  const [applying, setApplying] = useState(false)
  const [done, setDone]         = useState(null)

  const matchCount = fromCat ? transactions.filter(t => t.category === fromCat).length : 0
  const kids = toParent ? childrenOf(parentCats.find(p=>p.name===toParent)?.id||'') : []
  const toCat = toChild || toParent

  const handleApply = async () => {
    if (!fromCat || !toCat) return
    setApplying(true)
    const n = await onReplace(fromCat, toCat, toTipo || null)
    setDone(n)
    setApplying(false)
  }

  const tipoMap = { 'Fijo':'Gasto fijo', 'Variable':'Gasto variable', 'Ingreso':'Ingreso' }

  return (
    <div className="cat-modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="cat-modal" style={{ maxWidth:500 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">🔀 Reasignar categoría en bloque</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cat-modal-body" style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {done !== null ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:6 }}>
                {done} movimientos actualizados
              </div>
              <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>
                De <strong>{fromCat}</strong> → <strong>{toCat}</strong>
              </div>
              <button className="btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          ) : (
            <>
              {/* Origen */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:6 }}>
                  DE — categoría actual
                </label>
                <select value={fromCat} onChange={e=>setFromCat(e.target.value)}
                  style={{ width:'100%', padding:'8px 10px', borderRadius:8, fontSize:13, border:'1px solid var(--border)', background:'var(--bg-surface)', fontFamily:'inherit', color:'var(--text-primary)' }}>
                  <option value="">— Selecciona categoría de origen —</option>
                  {parentCats.map(parent => {
                    const kids = childrenOf(parent.id).filter(k => allUsedCats.includes(k.name))
                    const parentUsed = allUsedCats.includes(parent.name)
                    const count = n => transactions.filter(t=>t.category===n).length
                    if (!parentUsed && kids.length === 0) return null
                    return kids.length > 0 ? (
                      <optgroup key={parent.id} label={`${parent.emoji||''} ${parent.name}`}>
                        {parentUsed && <option value={parent.name}>{parent.emoji||''} {parent.name} ({count(parent.name)})</option>}
                        {kids.map(k => <option key={k.id} value={k.name}>↳ {k.emoji||''} {k.name} ({count(k.name)})</option>)}
                      </optgroup>
                    ) : (
                      <option key={parent.id} value={parent.name}>{parent.emoji||''} {parent.name} ({count(parent.name)})</option>
                    )
                  })}
                </select>
                {fromCat && (
                  <div style={{ marginTop:6, fontSize:12, color:'var(--aviso)', fontWeight:500 }}>
                    ⚠️ Se cambiarán <strong>{matchCount} movimientos</strong> con esta categoría
                  </div>
                )}
              </div>

              {/* Destino */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:6 }}>
                  A — nueva categoría
                </label>
                <select value={toParent} onChange={e=>{ setToParent(e.target.value); setToChild('') }}
                  style={{ width:'100%', padding:'8px 10px', borderRadius:8, fontSize:13, border:'1px solid var(--acento)', background:'var(--bg-surface)', fontFamily:'inherit', color:'var(--text-primary)', marginBottom:8 }}>
                  <option value="">— Selecciona categoría destino —</option>
                  {parentCats.map(p => <option key={p.id} value={p.name}>{p.emoji||''} {p.name}</option>)}
                </select>
                {kids.length > 0 && (
                  <select value={toChild} onChange={e=>setToChild(e.target.value)}
                    style={{ width:'100%', padding:'8px 10px', borderRadius:8, fontSize:13, border:'1px solid var(--border)', background:'var(--bg-surface2)', fontFamily:'inherit', color:'var(--text-primary)' }}>
                    <option value="">↳ Sin subcategoría (usar categoría general)</option>
                    {kids.map(k => <option key={k.id} value={k.name}>↳ {k.emoji||''} {k.name}</option>)}
                  </select>
                )}
              </div>

              {/* Tipo opcional */}
              <div>
                <label style={{ fontSize:12, fontWeight:600, color:'var(--text-muted)', display:'block', marginBottom:6 }}>
                  Cambiar tipo también <span style={{ fontWeight:400 }}>(opcional)</span>
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  {['', 'Variable', 'Fijo', 'Ingreso'].map(t => (
                    <button key={t} onClick={()=>setToTipo(t)}
                      style={{ flex:1, padding:'7px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all .15s',
                        background: toTipo===t ? (t==='Ingreso' ? 'rgba(79,201,239,0.2)' : t==='Fijo' ? 'rgba(46,184,122,0.15)' : t==='' ? 'var(--bg-surface2)' : 'rgba(184,125,0,0.15)') : 'var(--bg-surface2)',
                        color: toTipo===t ? (t==='Ingreso' ? '#0B7A9E' : t==='Fijo' ? 'var(--acento)' : t==='' ? 'var(--text-muted)' : 'var(--aviso)') : 'var(--text-muted)',
                      }}>
                      {t==='' ? 'Sin cambio' : tipoMap[t]}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        {done === null && (
          <div className="cat-modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            <div style={{flex:1}}/>
            <button className="btn-primary" onClick={handleApply}
              disabled={!fromCat || !toCat || applying || matchCount===0}>
              {applying ? 'Aplicando...' : `Cambiar ${matchCount} movimientos →`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Movimientos ───────────────────────────────────────────────────────────────
export default function Movimientos() {
  const navigate = useNavigate()
  const { transactions, categories, loading, updateTxCategory, updateTransaction, addTransactions, deleteTransaction, deleteAllTransactions } = useData()

  const [statusTab, setStatusTab]         = useState('real')   // 'real' | 'previsto'
  const [search, setSearch]               = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter]       = useState('all')
  const [pendingOnly, setPendingOnly]     = useState(false)
  const [dupMode, setDupMode]             = useState(false)
  const [deletingDups, setDeletingDups]   = useState(new Set())
  const [showBulkReplace, setShowBulkReplace] = useState(false)
  const [viewMode, setViewMode]           = useState('lista')  // 'lista' | 'tabla'
  const [showNewModal, setShowNewModal]   = useState(false)
  const [posponer, setPosponer]           = useState(null)  // tx to postpone
  const [page, setPage]                   = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deletingAll, setDeletingAll]     = useState(false)
  const [autoApplying, setAutoApplying]   = useState(false)
  const [autoResult, setAutoResult]       = useState(null)

  // ── Category maps ─────────────────────────────────────────────────────────
  const catMap = useMemo(() => {
    const map = {}
    const byId = Object.fromEntries(categories.map(c => [c.id, c]))
    for (const c of categories) {
      const parent = c.parent_id ? byId[c.parent_id] : null
      map[c.name] = {
        emoji: c.emoji || '📦', color: c.color || '#8A8A8A',
        bg: `${c.color || '#8A8A8A'}18`,
        parent: parent ? { name: parent.name, emoji: parent.emoji || '📦' } : null,
      }
    }
    return map
  }, [categories])

  const getCatMeta = (name) => catMap[name] || { emoji: '📦', color: '#8A8A8A', bg: 'rgba(138,138,138,0.1)', parent: null }

  const uniqueCats = useMemo(() => {
    const seen = new Set()
    return categories.filter(c => { const k = c.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
  }, [categories])
  const parentCats  = useMemo(() => uniqueCats.filter(c => !c.parent_id), [uniqueCats])
  const childrenOf  = useCallback(id => uniqueCats.filter(c => c.parent_id === id), [uniqueCats])

  // Unique accounts from existing transactions
  const existingAccounts = useMemo(() => {
    const set = new Set(transactions.map(t => t.account).filter(Boolean))
    return [...set].sort()
  }, [transactions])

  // Tab counts  (conciliado queda excluido de ambas tabs — vive solo en Conciliaciones)
  const realTxs     = useMemo(() => transactions.filter(t => t.status !== 'previsto' && t.status !== 'conciliado'), [transactions])
  const prevTxs     = useMemo(() => transactions.filter(t => t.status === 'previsto'), [transactions])
  const tabTxs      = statusTab === 'previsto' ? prevTxs : realTxs

  const pendingCount = useMemo(() =>
    realTxs.filter(t => !t.category || t.category === '').length, [realTxs])

  // ── Duplicate groups (same date + amount + description) ──────────────────
  const dupGroups = useMemo(() => {
    const map = {}
    for (const t of transactions) {
      const key = `${t.date}|${Math.round((t.amount||0)*100)}|${(t.description||'').toLowerCase().trim()}`
      if (!map[key]) map[key] = []
      map[key].push(t)
    }
    return Object.values(map)
      .filter(group => group.length > 1)
      .sort((a, b) => b.length - a.length)
  }, [transactions])

  const dupCount = dupGroups.reduce((s, g) => s + g.length - 1, 0) // extra copies

  const handleDeleteDup = useCallback(async (id) => {
    setDeletingDups(prev => new Set([...prev, id]))
    await deleteTransaction(id)
    setDeletingDups(prev => { const n = new Set(prev); n.delete(id); return n })
  }, [deleteTransaction])

  // ── Pending groups ────────────────────────────────────────────────────────
  const pendingGroups = useMemo(() => {
    if (!pendingOnly) return []
    const pending = realTxs.filter(t => !t.category || t.category === '')
    const groups = {}
    for (const t of pending) {
      const key = `${(t.description||'').trim().toLowerCase()}|${(t.detail||'').trim().toLowerCase()}`
      if (!groups[key]) {
        groups[key] = { key, description: t.description, detail: t.detail, ids: [], totalAmount: 0, lastDate: t.date,
          suggestedCat: ((t.detail ? matchUserCategory(t.detail, uniqueCats) : null) || matchUserCategory(t.description, uniqueCats))?.name || '' }
      }
      groups[key].ids.push(t.id)
      groups[key].totalAmount += t.amount
      if (t.date > groups[key].lastDate) groups[key].lastDate = t.date
    }
    return Object.values(groups).sort((a, b) => b.ids.length - a.ids.length)
  }, [transactions, pendingOnly, uniqueCats])

  const handleAutoApply = useCallback(async () => {
    setAutoApplying(true); setAutoResult(null)
    const pending = realTxs.filter(t => !t.category || t.category === '')
    let applied = 0
    for (const t of pending) {
      const match = (t.detail ? matchUserCategory(t.detail, uniqueCats) : null) || matchUserCategory(t.description, uniqueCats)
      if (match) { await updateTxCategory(t.id, match.name); applied++ }
    }
    setAutoResult({ applied, skipped: pending.length - applied })
    setAutoApplying(false)
  }, [realTxs, uniqueCats, updateTxCategory])

  const applyToGroup = useCallback((ids, category) => {
    ids.forEach(id => updateTxCategory(id, category))
  }, [updateTxCategory])

  // ── Bulk replace category ─────────────────────────────────────────────────
  const handleBulkReplace = useCallback(async (fromCat, toCat, toTipo) => {
    const targets = transactions.filter(t => t.category === fromCat)
    for (const t of targets) {
      await updateTxCategory(t.id, toCat)
      if (toTipo) await updateTransaction(t.id, { tipo: toTipo })
    }
    return targets.length
  }, [transactions, updateTxCategory, updateTransaction])

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...tabTxs]
    if (pendingOnly && statusTab === 'real') {
      list = list.filter(t => !t.category || t.category === '')
    } else {
      if (search) {
        const q = search.toLowerCase()
        list = list.filter(t =>
          (t.description||'').toLowerCase().includes(q) ||
          (t.category   ||'').toLowerCase().includes(q) ||
          (t.detail     ||'').toLowerCase().includes(q) ||
          (t.account    ||'').toLowerCase().includes(q) ||
          String(t.amount).includes(q)
        )
      }
      if (categoryFilter !== 'all') list = list.filter(t => t.category === categoryFilter)
      if (typeFilter === 'income')  list = list.filter(t => t.amount > 0)
      if (typeFilter === 'expense') list = list.filter(t => t.amount < 0)
    }
    list.sort((a, b) => new Date(b.date) - new Date(a.date))
    return list
  }, [tabTxs, search, categoryFilter, typeFilter, pendingOnly, statusTab])

  const totalPages  = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated   = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalIncome = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalExpense= filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)

  const handleDelete = (id) => {
    if (confirmDelete === id) { deleteTransaction(id); setConfirmDelete(null) }
    else setConfirmDelete(id)
  }

  const handlePosponer = useCallback(async ({ tx, mode, receivedAmt, remaining, newDate }) => {
    // 1. Create new previsto for remaining amount
    const newPrevisto = {
      id: crypto.randomUUID(),
      date: newDate,
      description: tx.description,
      detail: tx.detail || '',
      amount: tx.amount < 0 ? -remaining : remaining,
      category: tx.category || '',
      tipo: tx.tipo || 'Variable',
      account: tx.account || '',
      status: 'previsto',
      matchSource: 'manual',
      user_id: tx.user_id,
    }
    await addTransactions([newPrevisto])

    // 2. If partial: create a real transaction for the received amount
    if (mode === 'parcial' && receivedAmt > 0) {
      const realTx = {
        id: crypto.randomUUID(),
        date: tx.date,
        description: tx.description,
        detail: `Cobro parcial (previsto: ${Math.abs(tx.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €)`,
        amount: tx.amount < 0 ? -receivedAmt : receivedAmt,
        category: tx.category || '',
        tipo: tx.tipo || 'Variable',
        account: tx.account || '',
        status: 'real',
        matchSource: 'manual',
        user_id: tx.user_id,
      }
      await addTransactions([realTx])
    }

    // 3. Delete original previsto
    await deleteTransaction(tx.id)
  }, [addTransactions, deleteTransaction])

  // Category dropdown component
  function CatSelect({ value, onChange, style = {} }) {
    const meta = getCatMeta(value)
    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} onClick={e => e.stopPropagation()}
        style={{ padding:'3px 6px', borderRadius:6, fontSize:11,
          border:`1px solid ${value ? meta.color+'50' : 'var(--alerta)'}`,
          background: value ? meta.bg : 'rgba(214,59,39,0.05)',
          color: value ? meta.color : 'var(--alerta)',
          fontWeight:500, cursor:'pointer', minWidth:130, ...style }}>
        <option value="">— Sin categoría —</option>
        {!uniqueCats.find(c => c.name === value) && value && <option value={value}>{value}</option>}
        {parentCats.map(parent => {
          const kids = childrenOf(parent.id)
          return kids.length > 0 ? (
            <optgroup key={parent.id} label={`${parent.emoji||''} ${parent.name}`}>
              <option value={parent.name}>{parent.emoji||''} {parent.name}</option>
              {kids.map(child => <option key={child.id} value={child.name}>↳ {child.emoji||''} {child.name}</option>)}
            </optgroup>
          ) : <option key={parent.id} value={parent.name}>{parent.emoji||''} {parent.name}</option>
        })}
        <option value="Otros">📦 Otros</option>
      </select>
    )
  }

  if (loading) return <div className="auth-loading"><div className="auth-spinner"></div></div>

  return (
    <div>
      {/* Modal nueva transacción */}
      {showNewModal && (
        <NewTransactionModal
          categories={categories}
          existingAccounts={existingAccounts}
          onSave={tx => addTransactions([tx])}
          onClose={() => setShowNewModal(false)}
        />
      )}

      {/* Modal posponer previsto */}
      {posponer && (
        <PostponerModal
          tx={posponer}
          onSave={handlePosponer}
          onClose={() => setPosponer(null)}
        />
      )}

      {/* Modal reasignación en bloque */}
      {showBulkReplace && (
        <BulkReplaceModal
          transactions={transactions}
          categories={categories}
          onReplace={handleBulkReplace}
          onClose={() => setShowBulkReplace(false)}
        />
      )}

      {/* ── TABS Reales / Previstos ── */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:16,
        borderBottom:'2px solid var(--border)', paddingBottom:0 }}>
        {[
          { id:'real',     label:'✅ Reales',    count: realTxs.length },
          { id:'previsto', label:'🗓 Previstos',  count: prevTxs.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setStatusTab(tab.id); setPage(0); setPendingOnly(false); setAutoResult(null) }}
            style={{
              padding:'9px 20px', fontSize:13, fontWeight:600, cursor:'pointer',
              background:'none', border:'none', borderBottom: statusTab === tab.id ? '2px solid var(--acento)' : '2px solid transparent',
              marginBottom:'-2px', color: statusTab === tab.id ? 'var(--acento)' : 'var(--text-muted)',
              transition:'color .15s', display:'flex', alignItems:'center', gap:7,
            }}>
            {tab.label}
            <span style={{
              fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:10,
              background: statusTab === tab.id ? 'rgba(46,184,122,0.12)' : 'var(--bg-surface2)',
              color: statusTab === tab.id ? 'var(--acento)' : 'var(--text-muted)',
            }}>{tab.count}</span>
          </button>
        ))}
        <div style={{ flex:1 }} />
        {/* Acciones globales */}
        <div style={{ display:'flex', gap:8, alignItems:'center', paddingBottom:2 }}>
          <button onClick={() => setShowNewModal(true)}
            style={{ padding:'7px 13px', fontSize:12, borderRadius:8, cursor:'pointer',
              border:'1px solid var(--acento)', background:'rgba(46,184,122,0.08)',
              color:'var(--acento)', fontWeight:600, whiteSpace:'nowrap' }}>
            + Nuevo
          </button>
          <button className="btn-primary" style={{ padding:'7px 14px', fontSize:12 }} onClick={() => navigate('/importar')}>
            ↑ Importar
          </button>
          {transactions.length > 0 && (
            <button onClick={async () => {
                if (!confirmDeleteAll) { setConfirmDeleteAll(true); return }
                setDeletingAll(true); await deleteAllTransactions(); setDeletingAll(false); setConfirmDeleteAll(false)
              }}
              onBlur={() => setTimeout(() => setConfirmDeleteAll(false), 200)}
              disabled={deletingAll}
              style={{ padding:'7px 12px', fontSize:12, borderRadius:8, cursor:'pointer',
                border: confirmDeleteAll ? 'none' : '1px solid var(--border)',
                background: confirmDeleteAll ? 'var(--alerta)' : 'none',
                color: confirmDeleteAll ? '#fff' : 'var(--alerta)',
                fontWeight:500, transition:'all 0.15s', whiteSpace:'nowrap' }}>
              {deletingAll ? 'Eliminando...' : confirmDeleteAll ? `¿Borrar los ${transactions.length}?` : '🗑 Vaciar'}
            </button>
          )}
        </div>
      </div>

      {/* ── CONTROLES (filtros) — solo dentro de cada tab ── */}
      <div className="mov-controls">
        {!pendingOnly && (
          <input className="mov-search"
            placeholder="🔍 Buscar descripción, cuenta, categoría..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(0) }}
            style={{ background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', fontSize:13, color:'var(--text-primary)', flex:1, minWidth:200 }} />
        )}
        {!pendingOnly && (
          <select className="select-filter" value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(0) }}>
            <option value="all">Todas las categorías</option>
            {parentCats.map(parent => {
              const kids = childrenOf(parent.id).filter(k => transactions.some(t => t.category === k.name))
              const parentUsed = transactions.some(t => t.category === parent.name)
              if (!parentUsed && kids.length === 0) return null
              return kids.length > 0 ? (
                <optgroup key={parent.id} label={`${parent.emoji||''} ${parent.name}`}>
                  {parentUsed && <option value={parent.name}>{parent.emoji||''} {parent.name}</option>}
                  {kids.map(k => <option key={k.id} value={k.name}>↳ {k.emoji||''} {k.name}</option>)}
                </optgroup>
              ) : (
                <option key={parent.id} value={parent.name}>{parent.emoji||''} {parent.name}</option>
              )
            })}
          </select>
        )}
        {!pendingOnly && (
          <select className="select-filter" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(0) }}>
            <option value="all">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
        )}
        {/* Pendientes — solo en tab Reales */}
        {statusTab === 'real' && pendingCount > 0 && (
          <button onClick={() => { setPendingOnly(p => !p); setDupMode(false); setPage(0); setAutoResult(null) }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:8, fontSize:13, cursor:'pointer',
              border: pendingOnly ? 'none' : '1px solid var(--aviso)',
              background: pendingOnly ? 'var(--aviso)' : 'rgba(184,125,0,0.08)',
              color: pendingOnly ? '#fff' : 'var(--aviso)',
              fontWeight:600, whiteSpace:'nowrap', transition:'all 0.15s' }}>
            ⚠️ Pendientes
            <span style={{ background: pendingOnly ? 'rgba(255,255,255,0.25)' : 'var(--aviso)', color:'#fff', borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:700 }}>{pendingCount}</span>
          </button>
        )}
        {/* Duplicados */}
        {dupCount > 0 && (
          <button onClick={() => { setDupMode(d => !d); setPendingOnly(false); setPage(0) }}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 13px', borderRadius:8, fontSize:13, cursor:'pointer',
              border: dupMode ? 'none' : '1px solid #9B8FFF',
              background: dupMode ? '#9B8FFF' : 'rgba(155,143,255,0.08)',
              color: dupMode ? '#fff' : '#9B8FFF',
              fontWeight:600, whiteSpace:'nowrap', transition:'all 0.15s' }}>
            🔁 Duplicados
            <span style={{ background: dupMode ? 'rgba(255,255,255,0.25)' : '#9B8FFF', color:'#fff', borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:700 }}>{dupCount}</span>
          </button>
        )}
        {/* Reasignación en bloque */}
        {!pendingOnly && !dupMode && (
          <button onClick={() => setShowBulkReplace(true)}
            title="Cambiar la categoría de muchos movimientos a la vez"
            style={{ padding:'7px 13px', fontSize:12, borderRadius:8, cursor:'pointer',
              border:'1px solid var(--border)', background:'var(--bg-surface)',
              color:'var(--text-muted)', fontWeight:500, whiteSpace:'nowrap', transition:'all .15s' }}>
            🔀 Reasignar
          </button>
        )}
        {/* Vista toggle */}
        {!pendingOnly && !dupMode && (
          <div style={{ display:'flex', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
            {[['lista','📋'],['tabla','🗂']].map(([mode, icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding:'7px 12px', fontSize:13, cursor:'pointer', border:'none',
                background: viewMode === mode ? 'var(--acento)' : 'var(--bg-surface)',
                color: viewMode === mode ? '#fff' : 'var(--text-muted)',
                transition:'all 0.15s',
              }} title={mode === 'lista' ? 'Vista lista' : 'Vista tabla / Excel'}>{icon}</button>
            ))}
          </div>
        )}
      </div>

      {/* ── VISTA DUPLICADOS ── */}
      {dupMode && !pendingOnly && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16,
            background:'rgba(155,143,255,0.07)', border:'1px solid #9B8FFF40',
            borderRadius:10, padding:'10px 16px', flexWrap:'wrap' }}>
            <span style={{ fontSize:14 }}>🔁</span>
            <div>
              <span style={{ fontSize:13, color:'#9B8FFF', fontWeight:600 }}>
                {dupGroups.length} grupos con duplicados — {dupCount} copias extra
              </span>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                Misma fecha, importe y descripción. Elimina las copias que no necesites.
              </div>
            </div>
            <button onClick={() => setDupMode(false)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13 }}>
              Ver todos
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {dupGroups.map((group, gi) => (
              <div key={gi} style={{ background:'var(--bg-surface)', border:'1px solid #9B8FFF30', borderRadius:12, overflow:'hidden' }}>
                {/* Cabecera del grupo */}
                <div style={{ padding:'10px 16px', background:'rgba(155,143,255,0.06)', borderBottom:'1px solid #9B8FFF20',
                  display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:8, background:'#9B8FFF20', color:'#9B8FFF' }}>
                    {group.length} copias
                  </span>
                  <span style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', flex:1 }}>{group[0].description}</span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:12, color: group[0].amount > 0 ? 'var(--acento)' : 'var(--alerta)', fontWeight:700 }}>
                    {group[0].amount > 0 ? '+' : ''}{group[0].amount.toLocaleString('es-ES',{minimumFractionDigits:2})} €
                  </span>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--text-muted)' }}>{group[0].date}</span>
                </div>

                {/* Filas del grupo */}
                {group.map((t, ti) => {
                  const isFirst = ti === 0
                  const isDeleting = deletingDups.has(t.id)
                  return (
                    <div key={t.id} style={{
                      display:'flex', alignItems:'center', gap:12, padding:'10px 16px',
                      borderBottom: ti < group.length - 1 ? '1px solid var(--border)' : 'none',
                      background: isFirst ? 'rgba(46,184,122,0.03)' : 'transparent',
                      opacity: isDeleting ? 0.4 : 1, transition:'opacity .2s',
                    }}>
                      {/* Indicador original/copia */}
                      <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:6, whiteSpace:'nowrap',
                        background: isFirst ? 'rgba(46,184,122,0.12)' : 'rgba(214,59,39,0.08)',
                        color: isFirst ? 'var(--acento)' : 'var(--alerta)' }}>
                        {isFirst ? '✓ Original' : `Copia ${ti}`}
                      </span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:"'DM Mono',monospace" }}>{t.date}</div>
                        {t.detail && <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.detail}</div>}
                      </div>
                      <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                        {t.category || <span style={{ color:'var(--alerta)' }}>Sin categoría</span>}
                      </div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{t.account || '—'}</div>
                      {!isFirst && (
                        <button
                          disabled={isDeleting}
                          onClick={() => handleDeleteDup(t.id)}
                          style={{ padding:'5px 12px', borderRadius:7, fontSize:12, cursor:'pointer', whiteSpace:'nowrap',
                            border:'1px solid var(--alerta)', background:'rgba(214,59,39,0.07)',
                            color:'var(--alerta)', fontWeight:600, transition:'all .15s',
                            opacity: isDeleting ? 0.5 : 1 }}>
                          {isDeleting ? '...' : '🗑 Eliminar copia'}
                        </button>
                      )}
                      {isFirst && (
                        <span style={{ fontSize:11, color:'var(--text-muted)', fontStyle:'italic', padding:'5px 12px' }}>mantener</span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── VISTA PENDIENTES ── */}
      {pendingOnly && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12,
            background:'rgba(184,125,0,0.08)', border:'1px solid var(--aviso)',
            borderRadius:10, padding:'10px 14px', flexWrap:'wrap' }}>
            <span style={{ fontSize:14 }}>⚠️</span>
            <span style={{ fontSize:13, color:'var(--aviso)', fontWeight:600 }}>
              {pendingCount} movimientos sin categoría — {pendingGroups.length} grupos distintos
            </span>
            <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
              {autoResult && <span style={{ fontSize:12, color:'var(--acento)', fontWeight:500 }}>✓ {autoResult.applied} asignados · {autoResult.skipped} sin coincidencia</span>}
              <button onClick={handleAutoApply} disabled={autoApplying || pendingCount === 0}
                style={{ padding:'6px 14px', borderRadius:8, fontSize:12, cursor:'pointer', border:'none', background:'var(--acento)', color:'#fff', fontWeight:600, opacity: autoApplying ? 0.7 : 1 }}>
                {autoApplying ? '⏳ Categorizando...' : '⚡ Auto-categorizar todo'}
              </button>
              <button onClick={() => setPendingOnly(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13 }}>Ver todos</button>
            </div>
          </div>
          {pendingGroups.length === 0 ? (
            <div className="panel" style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>¡Todo clasificado!</div>
              <button className="ob-back-btn" style={{ padding:'9px 20px' }} onClick={() => setPendingOnly(false)}>Ver todos →</button>
            </div>
          ) : (
            <div className="mov-table-wrap">
              <table className="mov-table">
                <thead><tr><th>Descripción / Detalle</th><th style={{ textAlign:'center' }}>Filas</th><th>Categoría sugerida</th><th style={{ textAlign:'right' }}>Total</th><th style={{ width:120 }}>Acción</th></tr></thead>
                <tbody>
                  {pendingGroups.map(group => <GroupRow key={group.key} group={group} CatSelect={CatSelect} onApply={applyToGroup} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── VISTA LISTA / TABLA ── */}
      {!pendingOnly && !dupMode && (
        <>
          <div style={{ display:'flex', gap:16, marginBottom:14, alignItems:'center' }}>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--text-muted)' }}>{filtered.length} movimientos</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--acento)' }}>+{totalIncome.toLocaleString('es-ES',{minimumFractionDigits:2})} €</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--alerta)' }}>−{totalExpense.toLocaleString('es-ES',{minimumFractionDigits:2})} €</div>
            {transactions.length > 0 && (
              <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto', fontStyle:'italic' }}>
                💡 Importar <strong>añade</strong> movimientos nuevos — no borra los existentes
              </span>
            )}
          </div>

          <div className="mov-table-wrap">
            {filtered.length === 0 ? (
              <div className="panel" style={{ padding:40, textAlign:'center', color:'var(--text-muted)' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--text-primary)', marginBottom:6 }}>Sin movimientos</div>
                <div style={{ fontSize:13, marginBottom:16 }}>Añade uno manualmente o importa un extracto.</div>
                <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <button className="btn-secondary" onClick={() => setShowNewModal(true)}>+ Nuevo manual</button>
                  <button className="btn-primary" style={{ padding:'10px 24px', fontSize:14 }} onClick={() => navigate('/importar')}>Importar extracto →</button>
                </div>
              </div>
            ) : viewMode === 'tabla' ? (
              // ── TABLA DENSA ESTILO EXCEL ──
              <TablaView
                paginated={paginated} filtered={filtered} page={page} totalPages={totalPages}
                setPage={setPage} confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete}
                handleDelete={handleDelete} updateTxCategory={updateTxCategory} updateTransaction={updateTransaction}
                CatSelect={CatSelect} existingAccounts={existingAccounts} uniqueCats={uniqueCats}
                parentCats={parentCats} childrenOf={childrenOf} PAGE_SIZE={PAGE_SIZE}
              />
            ) : (
              // ── LISTA NORMAL ──
              <>
                <table className="mov-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Categoría</th>
                      <th>Tipo</th>
                      <th>Cuenta</th>
                      <th style={{ textAlign:'right' }}>Importe</th>
                      <th style={{ width:60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map(t => {
                      const meta     = getCatMeta(t.category)
                      const isIncome = t.amount > 0
                      const isPend   = confirmDelete === t.id
                      return (
                        <tr key={t.id}
                          style={{ background: isPend ? 'rgba(214,59,39,0.04)' : isIncome ? 'rgba(46,184,122,0.03)' : undefined }}
                          onClick={() => confirmDelete && confirmDelete !== t.id && setConfirmDelete(null)}>
                          <td><div className="mov-date-sm">{t.date}</div></td>
                          <td style={{ maxWidth:260 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div className="mov-emoji-sm" style={{ background: meta.bg, flexShrink:0 }}>{meta.emoji}</div>
                              <div style={{ overflow:'hidden' }}>
                                <div className="mov-name-sm" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.description}</div>
                                {t.detail && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.detail}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ minWidth:180 }}>
                            {meta.parent && (
                              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:3, display:'flex', alignItems:'center', gap:3 }}>
                                <span>{meta.parent.emoji}</span><span>{meta.parent.name}</span><span style={{ opacity:0.5 }}>›</span>
                              </div>
                            )}
                            <CatSelect value={t.category} onChange={cat => updateTxCategory(t.id, cat)} />
                          </td>
                          <td>
                            <span className="inline-badge" style={{
                              background: isIncome ? 'rgba(79,201,239,0.15)' : t.tipo === 'Fijo' ? 'rgba(46,184,122,0.12)' : 'rgba(184,125,0,0.10)',
                              color: isIncome ? '#0B7A9E' : t.tipo === 'Fijo' ? 'var(--acento)' : 'var(--aviso)',
                            }}>{t.tipo || (isIncome ? 'Ingreso' : 'Variable')}</span>
                          </td>
                          <td><span className="mov-date-sm">{t.account || '—'}</span></td>
                          <td><div className={`mov-amount-sm${isIncome ? ' income' : ''}`}>{isIncome ? '+' : ''}{t.amount.toLocaleString('es-ES',{minimumFractionDigits:2})} €</div></td>
                          <td style={{ textAlign:'center' }}>
                            <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                              {statusTab === 'previsto' && (
                                <button
                                  title="Posponer al mes siguiente"
                                  onClick={e => { e.stopPropagation(); setPosponer(t) }}
                                  style={{ background:'rgba(155,143,255,0.12)', border:'1px solid #9B8FFF50',
                                    borderRadius:6, color:'#7C6FE0', cursor:'pointer', padding:'4px 8px',
                                    fontSize:12, fontWeight:600, whiteSpace:'nowrap', transition:'all 0.15s' }}>
                                  ⏭
                                </button>
                              )}
                              <button title={isPend ? '¿Confirmar?' : 'Eliminar'}
                                onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                                onBlur={() => setTimeout(() => setConfirmDelete(c => c === t.id ? null : c), 200)}
                                style={{ background: isPend ? 'var(--alerta)' : 'none', border: isPend ? 'none' : '1px solid var(--border)', borderRadius:6, color: isPend ? '#fff' : 'var(--text-muted)', cursor:'pointer', padding:'4px 8px', fontSize:13, transition:'all 0.15s', whiteSpace:'nowrap' }}>
                                {isPend ? '¿Borrar?' : '🗑'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="mov-pagination">
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--text-muted)' }}>
                    {page * PAGE_SIZE + 1}–{Math.min((page+1)*PAGE_SIZE, filtered.length)} de {filtered.length}
                  </span>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="pag-btn" disabled={page===0} onClick={() => setPage(p=>p-1)}>‹ Anterior</button>
                    <button className="pag-btn" disabled={page>=totalPages-1} onClick={() => setPage(p=>p+1)}>Siguiente ›</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Vista tabla densa ─────────────────────────────────────────────────────────
function TablaView({ paginated, filtered, page, totalPages, setPage, confirmDelete, setConfirmDelete,
  handleDelete, updateTxCategory, updateTransaction, CatSelect, existingAccounts, uniqueCats,
  parentCats, childrenOf, PAGE_SIZE }) {

  const cellStyle = { fontSize:12, padding:'5px 8px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }
  const inputStyle = { padding:'2px 6px', borderRadius:5, fontSize:11, border:'1px solid var(--border)', background:'var(--bg-surface)', color:'var(--text-primary)', fontFamily:'inherit', width:'100%' }

  return (
    <>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead>
            <tr style={{ background:'var(--bg-surface2)', borderBottom:'2px solid var(--border)' }}>
              {['Fecha','Descripción','Detalle','Categoría','Cuenta','Estado','Tipo','Importe',''].map(h => (
                <th key={h} style={{ ...cellStyle, fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:700, letterSpacing:'0.06em', color:'var(--text-muted)', textAlign: h==='Importe' ? 'right' : 'left', padding:'8px 8px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((t, i) => {
              const isIncome = t.amount > 0
              const isPend   = confirmDelete === t.id
              return (
                <tr key={t.id} style={{
                  borderBottom:'1px solid var(--border)',
                  background: isPend ? 'rgba(214,59,39,0.04)' : i % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-surface2)',
                }}>
                  {/* Fecha */}
                  <td style={{ ...cellStyle, fontFamily:"'DM Mono',monospace", color:'var(--text-muted)', minWidth:90 }}>{t.date}</td>

                  {/* Descripción */}
                  <td style={{ ...cellStyle, maxWidth:180, fontWeight:500 }}>{t.description}</td>

                  {/* Detalle */}
                  <td style={{ ...cellStyle, maxWidth:130, color:'var(--text-muted)' }}>{t.detail || '—'}</td>

                  {/* Categoría */}
                  <td style={{ ...cellStyle, minWidth:150 }}>
                    <CatSelect value={t.category} onChange={cat => updateTxCategory(t.id, cat)} style={{ fontSize:11, minWidth:130 }} />
                  </td>

                  {/* Cuenta — editable inline */}
                  <td style={{ ...cellStyle, minWidth:110 }}>
                    <input list="accs" defaultValue={t.account || ''} style={inputStyle}
                      onBlur={e => { if (e.target.value !== t.account) updateTransaction(t.id, { account: e.target.value }) }} />
                    <datalist id="accs">{existingAccounts.map(a => <option key={a} value={a} />)}</datalist>
                  </td>

                  {/* Estado */}
                  <td style={{ ...cellStyle, minWidth:100 }}>
                    <select defaultValue={t.status || 'real'}
                      onChange={e => updateTransaction(t.id, { status: e.target.value })}
                      style={{ ...inputStyle, color: t.status === 'previsto' ? 'var(--lavanda)' : 'var(--acento)' }}>
                      <option value="real">✅ Real</option>
                      <option value="previsto">🗓 Previsto</option>
                    </select>
                  </td>

                  {/* Tipo */}
                  <td style={cellStyle}>
                    <span style={{ fontSize:10, fontWeight:600, padding:'2px 6px', borderRadius:4,
                      background: isIncome ? 'rgba(79,201,239,0.15)' : t.tipo==='Fijo' ? 'rgba(46,184,122,0.12)' : 'rgba(184,125,0,0.10)',
                      color: isIncome ? '#0B7A9E' : t.tipo==='Fijo' ? 'var(--acento)' : 'var(--aviso)',
                    }}>{t.tipo || (isIncome ? 'Ingreso' : 'Variable')}</span>
                  </td>

                  {/* Importe */}
                  <td style={{ ...cellStyle, textAlign:'right', fontFamily:"'DM Mono',monospace", fontWeight:600,
                    color: isIncome ? 'var(--acento)' : 'var(--text-primary)' }}>
                    {isIncome ? '+' : ''}{t.amount.toLocaleString('es-ES',{minimumFractionDigits:2})} €
                  </td>

                  {/* Eliminar */}
                  <td style={{ ...cellStyle, textAlign:'center' }}>
                    <button title={isPend ? '¿Confirmar?' : 'Eliminar'}
                      onClick={() => handleDelete(t.id)}
                      onBlur={() => setTimeout(() => setConfirmDelete(c => c===t.id ? null : c), 200)}
                      style={{ background: isPend ? 'var(--alerta)' : 'none', border: isPend ? 'none' : '1px solid var(--border)', borderRadius:5, color: isPend ? '#fff' : 'var(--text-muted)', cursor:'pointer', padding:'3px 7px', fontSize:11 }}>
                      {isPend ? '¿Borrar?' : '🗑'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mov-pagination">
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--text-muted)' }}>
          {page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE,filtered.length)} de {filtered.length}
        </span>
        <div style={{ display:'flex', gap:6 }}>
          <button className="pag-btn" disabled={page===0} onClick={() => setPage(p=>p-1)}>‹ Anterior</button>
          <button className="pag-btn" disabled={page>=totalPages-1} onClick={() => setPage(p=>p+1)}>Siguiente ›</button>
        </div>
      </div>
    </>
  )
}

// ── Fila de grupo en vista pendientes ─────────────────────────────────────────
function GroupRow({ group, CatSelect, onApply }) {
  const [localCat, setLocalCat] = useState(group.suggestedCat || '')
  const [editing, setEditing]   = useState(false)
  const [applied, setApplied]   = useState(false)

  const handleApply = () => {
    if (!localCat) return
    onApply(group.ids, localCat)
    setApplied(true); setEditing(false)
  }

  return (
    <tr style={{ background: applied ? 'rgba(46,184,122,0.04)' : undefined }}>
      <td style={{ maxWidth:280 }}>
        <div style={{ fontWeight:500, fontSize:13, color: applied ? 'var(--text-muted)' : 'var(--text-primary)' }}>{group.description}</div>
        {group.detail && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{group.detail}</div>}
      </td>
      <td style={{ textAlign:'center' }}>
        <span style={{ display:'inline-block', background:'rgba(184,125,0,0.12)', color:'var(--aviso)', borderRadius:10, padding:'2px 9px', fontSize:11, fontWeight:700 }}>{group.ids.length}</span>
      </td>
      <td>
        {applied ? (
          <span style={{ fontSize:12, color:'var(--acento)', fontWeight:500 }}>✓ {localCat}</span>
        ) : editing ? (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <CatSelect value={localCat} onChange={v => { setLocalCat(v); setEditing(false) }} />
            <button onClick={() => setEditing(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:16 }}>✕</button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px', borderRadius:20, cursor:'pointer', border:'none',
            background: localCat ? 'rgba(46,184,122,0.1)' : 'rgba(214,59,39,0.07)',
            color: localCat ? 'var(--acento)' : 'var(--alerta)', fontSize:12, fontWeight:600 }}>
            {localCat || '— Asignar —'}<span style={{ fontSize:10, opacity:0.6 }}>▾</span>
          </button>
        )}
      </td>
      <td style={{ textAlign:'right', fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:600, color: group.totalAmount > 0 ? 'var(--acento)' : 'var(--text-primary)' }}>
        {group.totalAmount > 0 ? '+' : ''}{group.totalAmount.toLocaleString('es-ES',{minimumFractionDigits:2})} €
      </td>
      <td>
        {applied ? (
          <span style={{ fontSize:11, color:'var(--acento)' }}>✓ Aplicado a {group.ids.length}</span>
        ) : (
          <button onClick={handleApply} disabled={!localCat}
            style={{ padding:'5px 12px', borderRadius:7, fontSize:12, cursor: localCat ? 'pointer' : 'not-allowed', border:'none',
              background: localCat ? 'var(--acento)' : 'var(--border)', color: localCat ? '#fff' : 'var(--text-muted)', fontWeight:600, whiteSpace:'nowrap' }}>
            Aplicar a {group.ids.length} →
          </button>
        )}
      </td>
    </tr>
  )
}
