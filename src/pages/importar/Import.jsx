import { useState, useRef, useCallback, useMemo } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { autoCategory } from '../../data/categorizationRules'
import { useData } from '../../contexts/DataContext'

const BANK_PROFILES = {
  auto:      { label: 'Detectar automáticamente', emoji: '🔍' },
  bbva:      { label: 'BBVA',       emoji: '🟦', dateCol: /fecha/i, descCol: /concepto|descripci[oó]n|movimiento/i, amountCol: /importe|cantidad/i },
  santander: { label: 'Santander',  emoji: '🔴', dateCol: /fecha/i, descCol: /concepto|descripci[oó]n/i, amountCol: /importe|cantidad/i },
  ing:       { label: 'ING',        emoji: '🟠', dateCol: /fecha/i, descCol: /descripci[oó]n|movimiento/i, amountCol: /importe|cantidad/i },
  caixabank: { label: 'CaixaBank',  emoji: '🟣', dateCol: /fecha/i, descCol: /concepto|descripci[oó]n/i, amountCol: /importe|cantidad/i },
  sabadell:  { label: 'Sabadell',   emoji: '🔵', dateCol: /fecha/i, descCol: /concepto|descripci[oó]n/i, amountCol: /importe|cantidad/i },
  revolut:   { label: 'Revolut',    emoji: '⚡', dateCol: /date|fecha/i, descCol: /description|descripci[oó]n/i, amountCol: /amount|importe/i },
  n26:       { label: 'N26',        emoji: '🏦', dateCol: /date|fecha/i, descCol: /payee|description/i, amountCol: /amount/i },
}

function parseAmount(val) {
  if (typeof val === 'number') return val
  if (!val) return NaN
  let s = String(val).trim().replace(/[€$\s]/g, '')
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if (s.includes(',') && !s.includes('.')) {
    s = s.replace(',', '.')
  }
  return parseFloat(s)
}

function parseDate(val) {
  if (!val) return null
  const s = String(val).trim()
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2,'0')}-${dmy[1].padStart(2,'0')}`
  const ymd = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/)
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2,'0')}-${ymd[3].padStart(2,'0')}`
  const d = new Date(s)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

function detectColumns(headers, bank) {
  const profile = bank !== 'auto' ? BANK_PROFILES[bank] : null
  const dateRe   = profile?.dateCol   || /fecha|date|f\.\s*valor|f\.\s*operaci/i
  const descRe   = profile?.descCol   || /concepto|descripci[oó]n|description|movimiento|detalle|payee/i
  const amountRe = profile?.amountCol || /importe|cantidad|amount|monto|cargo|abono/i
  const detailRe = /detalle|nota|etiqueta|tag|subcategor|referencia|concepto2/i
  const statusRe  = /previsto|estado|status|tipo.?(mov|trx|transac)/i

  let dateIdx = -1, descIdx = -1, amountIdx = -1, detailIdx = -1, statusIdx = -1
  headers.forEach((h, i) => {
    const hn = String(h).trim()
    if (dateIdx   < 0 && dateRe.test(hn))   dateIdx   = i
    if (descIdx   < 0 && descRe.test(hn))   descIdx   = i
    if (amountIdx < 0 && amountRe.test(hn)) amountIdx = i
    if (detailIdx < 0 && detailRe.test(hn)) detailIdx = i
    if (statusIdx < 0 && statusRe.test(hn)) statusIdx = i
  })
  return { dateIdx, descIdx, amountIdx, detailIdx, statusIdx }
}

import { matchUserCategory } from '../../utils/categoryMatcher'

function processRows(rows, headers, bank, userCategories) {
  const { dateIdx, descIdx, amountIdx, detailIdx, statusIdx } = detectColumns(headers, bank)

  if (dateIdx < 0 || descIdx < 0 || amountIdx < 0) {
    return { error: `No se pudieron detectar las columnas. Encontradas: fecha=${dateIdx >= 0}, descripción=${descIdx >= 0}, importe=${amountIdx >= 0}. Columnas: ${headers.join(', ')}` }
  }

  const tipoMap = Object.fromEntries(userCategories.map(c => [c.name, c.tipo]))

  const transactions = []
  for (const row of rows) {
    const vals        = Array.isArray(row) ? row : Object.values(row)
    const date        = parseDate(vals[dateIdx])
    const amount      = parseAmount(vals[amountIdx])
    const description = String(vals[descIdx] || '').trim()
    if (!date || isNaN(amount) || !description) continue

    const detail = detailIdx >= 0 ? String(vals[detailIdx] || '').trim() : ''
    let status = 'real'
    if (statusIdx >= 0) {
      const sv = String(vals[statusIdx] || '').trim()
      status = /previsto/i.test(sv) ? 'previsto' : 'real'
    }

    // ── Auto-match: detail primero, luego descripción, luego reglas hardcoded ──
    let categoryName = null
    let matchSource  = 'none'     // 'detail' | 'description' | 'rules' | 'none'

    if (userCategories.length > 0) {
      // 1. Buscar en detalle (columna subcategoría del Excel)
      const detailMatch = detail ? matchUserCategory(detail, userCategories) : null
      if (detailMatch) {
        categoryName = detailMatch.name
        matchSource  = 'detail'
      } else {
        // 2. Buscar en descripción completa
        const descMatch = matchUserCategory(description, userCategories)
        if (descMatch) {
          categoryName = descMatch.name
          matchSource  = 'description'
        }
      }
    }

    // 3. Fallback a reglas de categorización hardcoded
    if (!categoryName) {
      const autoCat = autoCategory(description, amount)
      if (autoCat?.category && autoCat.category !== 'Otros') {
        categoryName = autoCat.category
        matchSource  = 'rules'
      }
    }

    // 4. Sin categoría reconocida
    if (!categoryName) {
      categoryName = ''
      matchSource  = 'none'
    }

    const tipo = tipoMap[categoryName] ?? (amount > 0 ? 'Ingreso' : 'Variable')

    transactions.push({
      id: crypto.randomUUID(),
      date, description, amount,
      category: categoryName,
      tipo,
      account: bank !== 'auto' ? BANK_PROFILES[bank]?.label : 'Importado',
      detail, status, matchSource,
    })
  }

  return { transactions }
}

// Badge de tipo
function TipoBadge({ tipo }) {
  const styles = {
    'Ingreso':  { background: 'rgba(79,201,239,0.15)', color: '#0B7A9E' },
    'Fijo':     { background: 'rgba(46,184,122,0.12)', color: 'var(--acento)' },
    'Variable': { background: 'rgba(184,125,0,0.10)',  color: 'var(--aviso)' },
  }
  const s = styles[tipo] || styles['Variable']
  return <span className="inline-badge" style={s}>{tipo || 'Variable'}</span>
}

export default function Import() {
  const { categories, transactions: existingTransactions, addTransactions } = useData()
  const fileRef = useRef(null)

  // ── Modo: reales vs previsiones ───────────────────────────────────────────
  const [importMode, setImportMode]         = useState('reales')      // 'reales' | 'previsiones'
  const [forecastCategory, setForecastCategory] = useState('')         // categoría global para previsiones
  const [forecastMonth, setForecastMonth]   = useState('')             // filtro mes YYYY-MM (opcional)
  const [groupByClient, setGroupByClient]   = useState(false)          // agrupar por descripción

  const [bank, setBank]             = useState('auto')
  const [accountName, setAccountName] = useState('')
  const [phase, setPhase]           = useState('upload')
  const [fileName, setFileName]     = useState('')
  const [preview, setPreview]       = useState([])
  const [error, setError]           = useState('')
  const [saving, setSaving]         = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [dragOver, setDragOver]     = useState(false)
  const [hideDuplicates, setHideDuplicates] = useState(false)

  // Fingerprint de transacciones ya existentes en la BD
  const existingFingerprints = useMemo(() => {
    const s = new Set()
    for (const t of existingTransactions) {
      const key = `${t.date}|${Math.round((t.amount || 0) * 100)}|${String(t.description || '').toLowerCase().trim()}`
      s.add(key)
    }
    return s
  }, [existingTransactions])

  // ── Categorías del usuario, deduplicadas ──────────────────────────────────
  const uniqueCategories = useMemo(() => {
    const seen = new Set()
    return categories.filter(c => {
      const k = c.name.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k); return true
    })
  }, [categories])

  // Mapa nombre → tipo (para actualizar tipo al cambiar categoría)
  const tipoMap = useMemo(() =>
    Object.fromEntries(uniqueCategories.map(c => [c.name, c.tipo])),
    [uniqueCategories]
  )

  // Índice por id y por nombre
  const catById   = useMemo(() => Object.fromEntries(uniqueCategories.map(c => [c.id, c])), [uniqueCategories])
  const catByName = useMemo(() => Object.fromEntries(uniqueCategories.map(c => [c.name, c])), [uniqueCategories])

  // Categorías padre (sin parent_id) y sus hijos
  const parentCats = useMemo(() => uniqueCategories.filter(c => !c.parent_id), [uniqueCategories])
  const childrenOf = useCallback((parentId) =>
    uniqueCategories.filter(c => c.parent_id === parentId),
    [uniqueCategories]
  )

  // Dado un nombre de categoría, devuelve { parentCat, childCat }
  const splitCat = useCallback((name) => {
    const cat = catByName[name]
    if (!cat) return { parentCat: null, childCat: null }
    if (cat.parent_id) {
      return { parentCat: catById[cat.parent_id] || null, childCat: cat }
    }
    return { parentCat: cat, childCat: null }
  }, [catByName, catById])

  // ── Procesado de archivo ──────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return
    setError('')
    setFileName(file.name)
    const ext = file.name.split('.').pop().toLowerCase()

    const onRows = (rows, headers) => {
      const result = processRows(rows, headers, bank, uniqueCategories)
      if (result.error) { setError(result.error); return }
      if (!result.transactions.length) { setError('No se encontraron movimientos válidos.'); return }

      let txs = result.transactions

      if (importMode === 'previsiones') {
        // Filtrar por mes si se especificó
        if (forecastMonth) txs = txs.filter(t => t.date?.startsWith(forecastMonth))
        if (!txs.length) { setError(`No hay movimientos para el mes ${forecastMonth}.`); return }

        // Aplicar categoría global y forzar status=previsto, tipo=Ingreso
        txs = txs.map(t => ({
          ...t,
          category: forecastCategory || t.category,
          tipo: forecastCategory ? (categories.find(c => c.name === forecastCategory)?.tipo || 'Ingreso') : 'Ingreso',
          status: 'previsto',
          amount: Math.abs(t.amount),  // previsiones siempre positivas (ingresos)
        }))

        // Agrupar por descripción si se pide
        if (groupByClient) {
          const groups = {}
          txs.forEach(t => {
            const key = t.description.toLowerCase().trim()
            if (!groups[key]) groups[key] = { ...t, id: crypto.randomUUID(), amount: 0, date: t.date }
            groups[key].amount += t.amount
            // usar la última fecha del grupo
            if (t.date > groups[key].date) groups[key].date = t.date
          })
          txs = Object.values(groups)
        }

        // Sin deduplicación para previsiones (son planeadas, no importadas del banco)
        setPreview(txs.map(t => ({ ...t, isDuplicate: false })))
      } else {
        // Modo reales: marcar duplicados
        const withDup = txs.map(t => {
          const key = `${t.date}|${Math.round((t.amount || 0) * 100)}|${t.description.toLowerCase().trim()}`
          return { ...t, isDuplicate: existingFingerprints.has(key) }
        })
        setPreview(withDup)
      }

      setPhase('preview')
    }

    if (ext === 'csv' || ext === 'txt') {
      Papa.parse(file, {
        complete: (res) => {
          if (!res.data || res.data.length < 2) { setError('El archivo está vacío o no tiene datos válidos.'); return }
          onRows(res.data.slice(1).filter(r => r.some(c => c && String(c).trim())), res.data[0])
        },
        error: () => setError('Error al leer el archivo CSV.'),
      })
    } else if (['xlsx', 'xls'].includes(ext)) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const wb   = XLSX.read(e.target.result, { type: 'array', cellDates: true })
          const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' })
          if (!data || data.length < 2) { setError('El archivo está vacío.'); return }
          let headerIdx = 0
          for (let i = 0; i < Math.min(10, data.length); i++) {
            if (data[i].filter(c => c && String(c).trim()).length >= 3) { headerIdx = i; break }
          }
          const headers = data[headerIdx].map(h => String(h || ''))
          onRows(data.slice(headerIdx + 1).filter(r => r.some(c => c && String(c).toString().trim())), headers)
        } catch { setError('Error al leer el archivo Excel.') }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setError('Formato no soportado. Usa CSV o Excel (.xlsx/.xls).')
    }
  }, [bank, uniqueCategories])

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const finalName = accountName.trim() || (bank !== 'auto' ? BANK_PROFILES[bank]?.label : 'Importado')
      // Nunca guardar duplicados
      const toSave = preview.filter(t => !t.isDuplicate).map(t => ({ ...t, account: finalName }))
      await addTransactions(toSave)
      setSavedCount(toSave.length)
      setPhase('done')
    } catch (err) {
      setError('Error al guardar: ' + (err.message || 'desconocido'))
    }
    setSaving(false)
  }

  // Al cambiar categoría, actualiza también el tipo según la config del usuario
  const updateCategory = (id, categoryName) => {
    setPreview(prev => prev.map(t => {
      if (t.id !== id) return t
      const tipo = tipoMap[categoryName] ?? (t.amount > 0 ? 'Ingreso' : 'Variable')
      return { ...t, category: categoryName, tipo }
    }))
  }

  const updateTipo = (id, tipo) => {
    setPreview(prev => prev.map(t => t.id !== id ? t : { ...t, tipo }))
  }

  const updateStatus = (id, status) => {
    setPreview(prev => prev.map(t => t.id !== id ? t : { ...t, status }))
  }

  const removeRow = (id) => setPreview(prev => prev.filter(t => t.id !== id))

  const reset = () => { setPhase('upload'); setPreview([]); setFileName(''); setError(''); setSavedCount(0); setAccountName(''); setForecastMonth(''); setGroupByClient(false) }

  const duplicates     = preview.filter(t => t.isDuplicate)
  const newRows        = preview.filter(t => !t.isDuplicate)
  const visibleRows    = hideDuplicates ? newRows : preview
  const totalIngresos  = newRows.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalGastos    = newRows.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const categorized    = newRows.filter(t => t.category && t.category !== '').length
  const uncategorized  = newRows.length - categorized

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div>
        <div className="panel" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: 8 }}>
            {savedCount} movimientos importados
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
            Los movimientos se han guardado correctamente y ya aparecen en tu dashboard y en la vista de movimientos.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="ob-back-btn" onClick={reset}>Importar otro archivo</button>
            <button className="btn-primary" style={{ padding: '11px 24px', fontSize: 14 }} onClick={() => window.location.hash = '#/movimientos'}>
              Ver movimientos →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PREVIEW ───────────────────────────────────────────────────────────────
  if (phase === 'preview') {
    return (
      <div>
        <div className="kpi-row" style={{ marginBottom: 16 }}>
          <div className="kpi-card">
            <div className="kpi-label">Nuevos</div>
            <div className="kpi-value">{newRows.length}</div>
            <div className="kpi-delta">{fileName}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Ingresos</div>
            <div className="kpi-value" style={{ color: 'var(--acento)' }}>+{totalIngresos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            <div className="kpi-delta">{newRows.filter(t => t.amount > 0).length} operaciones</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Gastos</div>
            <div className="kpi-value" style={{ color: 'var(--alerta)' }}>−{totalGastos.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</div>
            <div className="kpi-delta">{newRows.filter(t => t.amount < 0).length} operaciones</div>
          </div>
          <div className="kpi-card" style={duplicates.length > 0 ? { borderColor: 'var(--aviso)', background: 'rgba(255,184,48,0.05)' } : undefined}>
            <div className="kpi-label">Duplicados</div>
            <div className="kpi-value" style={{ color: duplicates.length > 0 ? 'var(--aviso)' : 'var(--text-muted)' }}>{duplicates.length}</div>
            <div className="kpi-delta">{duplicates.length > 0 ? 'ya están importados' : 'sin duplicados ✓'}</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="panel-title">Vista previa</span>
              {duplicates.length > 0 && (
                <button
                  onClick={() => setHideDuplicates(h => !h)}
                  style={{
                    fontSize: 12, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    border: '1px solid var(--aviso)', background: hideDuplicates ? 'rgba(255,184,48,0.12)' : 'transparent',
                    color: 'var(--aviso)', fontWeight: 500,
                  }}
                >
                  {hideDuplicates ? `👁 Mostrar duplicados (${duplicates.length})` : `🙈 Ocultar duplicados (${duplicates.length})`}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="ob-back-btn" style={{ padding: '7px 14px', fontSize: 12 }} onClick={reset}>← Cancelar</button>
              <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 13, background: importMode === 'previsiones' ? '#4FC9EF' : undefined }}
                onClick={handleSave} disabled={saving || !newRows.length || (importMode === 'previsiones' && !forecastCategory)}>
                {saving ? 'Guardando...' : importMode === 'previsiones'
                  ? `🗓 Guardar ${newRows.length} previsiones →`
                  : `Importar ${newRows.length} movimientos →`}
              </button>
            </div>
          </div>
          <div className="panel-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="mov-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th>Categoría</th>
                  <th>Subcategoría</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Importe</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((t, i) => (
                  <tr key={t.id} style={t.isDuplicate ? { opacity: 0.45, background: 'rgba(255,184,48,0.05)' } : undefined}>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{t.date}</td>
                    <td style={{ maxWidth: 300 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t.isDuplicate && (
                          <span title="Ya existe en tus movimientos" style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(255,184,48,0.15)', color: 'var(--aviso)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            Duplicado
                          </span>
                        )}
                        <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', textDecoration: t.isDuplicate ? 'line-through' : 'none' }}>{t.description}</div>
                      </div>
                      {t.detail && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t.detail}</div>}
                    </td>

                    {/* ── Categoría + Subcategoría auto-asignada ── */}
                    {(() => {
                      const { parentCat, childCat } = splitCat(t.category)
                      const selectedParentId = parentCat?.id || ''
                      const kids = selectedParentId ? childrenOf(selectedParentId) : []

                      // Colores según origen del match
                      const matchColors = {
                        detail:      { border:'var(--acento)',  bg:'rgba(46,184,122,0.08)',  dot:'var(--acento)',  label:'⚡' },
                        description: { border:'var(--aviso)',   bg:'rgba(184,125,0,0.08)',   dot:'var(--aviso)',   label:'≈' },
                        rules:       { border:'var(--border)',  bg:'var(--bg-surface)',       dot:'var(--text-muted)', label:'~' },
                        none:        { border:'var(--alerta)',  bg:'rgba(214,59,39,0.06)',   dot:'var(--alerta)', label:'?' },
                      }
                      const mc = matchColors[t.matchSource] || matchColors.none

                      return (
                        <>
                          {/* Columna Categoría (padre) */}
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              {/* Indicador de confianza */}
                              <span title={{
                                detail:'Auto: coincidencia exacta en detalle',
                                description:'Auto: coincidencia en descripción',
                                rules:'Auto: regla genérica',
                                none:'Sin coincidencia — asigna manualmente',
                              }[t.matchSource]} style={{
                                width:18, height:18, borderRadius:'50%', flexShrink:0,
                                background: mc.bg, border:`1.5px solid ${mc.dot}`,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:9, fontWeight:700, color: mc.dot, cursor:'default',
                              }}>{mc.label}</span>
                              <select
                                value={selectedParentId}
                                onChange={e => {
                                  const parent = parentCats.find(p => p.id === e.target.value)
                                  updateCategory(t.id, parent ? parent.name : '')
                                }}
                                style={{
                                  padding:'3px 7px', borderRadius:6, fontSize:12,
                                  border:`1px solid ${mc.border}`,
                                  background: mc.bg,
                                  color: !selectedParentId ? 'var(--alerta)' : 'var(--text-primary)',
                                  fontFamily:'inherit', minWidth:130,
                                }}
                              >
                                <option value="">— Sin categoría —</option>
                                {parentCats.map(p => (
                                  <option key={p.id} value={p.id}>{p.emoji || ''} {p.name}</option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* Columna Subcategoría */}
                          <td>
                            {kids.length > 0 ? (
                              <select
                                value={childCat?.id || ''}
                                onChange={e => {
                                  const child = kids.find(k => k.id === e.target.value)
                                  updateCategory(t.id, child ? child.name : (parentCat?.name || ''))
                                }}
                                style={{
                                  padding:'3px 7px', borderRadius:6, fontSize:12,
                                  border:'1px solid var(--border)', background:'var(--bg-surface2)',
                                  color: childCat ? 'var(--text-primary)' : 'var(--text-muted)',
                                  fontFamily:'inherit', minWidth:120,
                                }}
                              >
                                <option value="">— General —</option>
                                {kids.map(k => (
                                  <option key={k.id} value={k.id}>{k.emoji || ''} {k.name}</option>
                                ))}
                              </select>
                            ) : (
                              <span style={{ fontSize:12, color:'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                        </>
                      )
                    })()}

                    {/* ── Tipo: editable, derivado automáticamente al cambiar categoría ── */}
                    <td>
                      <select
                        value={t.tipo || 'Variable'}
                        onChange={e => updateTipo(t.id, e.target.value)}
                        style={{
                          padding: '4px 8px', borderRadius: 6, fontSize: 12,
                          border: '1px solid var(--border)', background: 'var(--bg-surface)',
                          fontFamily: 'inherit',
                          color: t.tipo === 'Ingreso' ? '#0B7A9E' : t.tipo === 'Fijo' ? 'var(--acento)' : 'var(--aviso)',
                        }}
                      >
                        <option value="Variable">Gasto variable</option>
                        <option value="Fijo">Gasto fijo</option>
                        <option value="Ingreso">Ingreso</option>
                      </select>
                    </td>

                    <td>
                      <select value={t.status || 'real'} onChange={e => updateStatus(t.id, e.target.value)}
                        style={{ padding:'4px 8px', borderRadius:6, fontSize:12, border:'1px solid var(--border)', background:'var(--bg-surface)', fontFamily:'inherit',
                          color: t.status === 'previsto' ? 'var(--lavanda)' : 'var(--acento)' }}>
                        <option value="real">✅ Real</option>
                        <option value="previsto">🗓 Previsto</option>
                      </select>
                    </td>

                    <td style={{
                      textAlign: 'right', fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 600,
                      color: t.amount > 0 ? 'var(--acento)' : 'var(--text-primary)',
                    }}>
                      {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </td>
                    <td>
                      <button onClick={() => removeRow(t.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: 14,
                      }} title="Eliminar">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}
      </div>
    )
  }

  // ── UPLOAD ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="import-layout">

        {/* ── TOGGLE MODO ── */}
        <div style={{ display:'flex', gap:0, marginBottom:16, background:'var(--bg-surface2)', borderRadius:12, padding:4, width:'fit-content', border:'1px solid var(--border)' }}>
          {[
            { id:'reales',      label:'✅ Movimientos reales',        sub:'Extractos bancarios' },
            { id:'previsiones', label:'🗓 Previsiones de ingresos',   sub:'Reservas, facturas, cobros esperados' },
          ].map(m => (
            <button key={m.id} onClick={() => { setImportMode(m.id); setError('') }}
              style={{ padding:'10px 20px', borderRadius:9, border:'none', cursor:'pointer', textAlign:'left', transition:'all .15s',
                background: importMode === m.id ? 'var(--bg-surface)' : 'transparent',
                boxShadow: importMode === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}>
              <div style={{ fontSize:13, fontWeight:700, color: importMode === m.id ? 'var(--text-primary)' : 'var(--text-muted)' }}>{m.label}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{m.sub}</div>
            </button>
          ))}
        </div>

        {/* ── CONFIG PREVISIONES ── */}
        {importMode === 'previsiones' && (
          <div className="panel" style={{ marginBottom:16, border:'1.5px solid rgba(79,201,239,0.3)', background:'rgba(79,201,239,0.04)' }}>
            <div className="panel-header">
              <span className="panel-title">⚙️ Configuración de previsiones</span>
            </div>
            <div className="panel-body" style={{ display:'flex', flexDirection:'column', gap:16, padding:'16px 20px' }}>

              {/* Categoría global */}
              <div>
                <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:6 }}>
                  Categoría — se aplica a todas las filas importadas <span style={{ color:'var(--alerta)' }}>*</span>
                </label>
                <select value={forecastCategory} onChange={e => setForecastCategory(e.target.value)}
                  style={{ padding:'8px 12px', borderRadius:8, fontSize:13, border: forecastCategory ? '1px solid var(--acento)' : '1px solid var(--alerta)', background:'var(--bg-surface)', fontFamily:'inherit', color:'var(--text-primary)', minWidth:260 }}>
                  <option value="">— Selecciona una categoría —</option>
                  {parentCats.map(p => {
                    const kids = childrenOf(p.id)
                    return kids.length > 0 ? (
                      <optgroup key={p.id} label={`${p.emoji||''} ${p.name}`}>
                        <option value={p.name}>{p.emoji||''} {p.name}</option>
                        {kids.map(k => <option key={k.id} value={k.name}>↳ {k.emoji||''} {k.name}</option>)}
                      </optgroup>
                    ) : <option key={p.id} value={p.name}>{p.emoji||''} {p.name}</option>
                  })}
                </select>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:5 }}>
                  Ejemplo: "Zaffra &amp; Panther" para importar reservas de tu app de mascotas
                </div>
              </div>

              <div style={{ display:'flex', gap:24, flexWrap:'wrap', alignItems:'flex-start' }}>
                {/* Filtro por mes */}
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:6 }}>
                    Filtrar por mes <span style={{ fontWeight:400 }}>(opcional)</span>
                  </label>
                  <input type="month" value={forecastMonth} onChange={e => setForecastMonth(e.target.value)}
                    style={{ padding:'7px 10px', borderRadius:8, fontSize:13, border:'1px solid var(--border)', background:'var(--bg-surface)', fontFamily:'inherit', color:'var(--text-primary)' }} />
                  <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Solo importa registros de ese mes</div>
                </div>

                {/* Agrupar */}
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:6 }}>
                    Agrupar por cliente/descripción
                  </label>
                  <div style={{ display:'flex', gap:8 }}>
                    {[
                      { val:false, label:'📋 Granular', sub:'Un previsto por servicio' },
                      { val:true,  label:'👤 Por cliente', sub:'Suma total por cliente' },
                    ].map(opt => (
                      <button key={String(opt.val)} onClick={() => setGroupByClient(opt.val)}
                        style={{ padding:'8px 14px', borderRadius:8, cursor:'pointer', border: groupByClient === opt.val ? '1.5px solid var(--acento)' : '1px solid var(--border)',
                          background: groupByClient === opt.val ? 'rgba(46,184,122,0.08)' : 'var(--bg-surface2)', textAlign:'left' }}>
                        <div style={{ fontSize:12, fontWeight:600, color: groupByClient === opt.val ? 'var(--acento)' : 'var(--text-primary)' }}>{opt.label}</div>
                        <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2 }}>{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Métodos de pago esperados */}
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:'var(--text-muted)', display:'block', marginBottom:6 }}>
                    Métodos de cobro esperados
                  </label>
                  <div style={{ fontSize:12, color:'var(--text-muted)', lineHeight:1.7 }}>
                    💳 Bizum &nbsp;·&nbsp; 💵 Efectivo &nbsp;·&nbsp; 🏦 Transferencia
                    <br/>
                    <span style={{ fontSize:11 }}>Se concilian en Conciliaciones cuando llega el pago real</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="panel-header">
            <span className="panel-title">{importMode === 'previsiones' ? '📂 Sube tu archivo de reservas o servicios' : 'Selecciona tu banco'}</span>
          </div>
          <div className="panel-body" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '16px 18px' }}>
            {importMode === 'previsiones' && (
              <div style={{ width:'100%', fontSize:13, color:'var(--text-muted)', padding:'4px 0 8px' }}>
                💡 Sube cualquier Excel o CSV con columnas de fecha, descripción e importe. Finio lo convierte en previsiones.
              </div>
            )}
            {importMode === 'reales' && Object.entries(BANK_PROFILES).map(([key, b]) => (
              <button
                key={key}
                onClick={() => {
                  setBank(key)
                  if (key !== 'auto') setAccountName(b.label)
                  else setAccountName('')
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 16px', borderRadius: 10,
                  background: bank === key ? 'rgba(46,184,122,0.08)' : 'var(--bg-surface2)',
                  border: bank === key ? '1.5px solid var(--acento)' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 18 }}>{b.emoji}</span>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 500, color: bank === key ? 'var(--acento)' : 'var(--text-primary)' }}>
                  {b.label}
                </span>
              </button>
            ))}
          </div>
          {/* Nombre de cuenta — solo en modo reales */}
          {importMode === 'reales' && <div style={{ padding: '0 18px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>🏦 Nombre de cuenta:</label>
            <input
              type="text"
              placeholder="Ej: BBVA personal, Revolut, Cuenta conjunta..."
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              style={{
                flex: 1, minWidth: 200, maxWidth: 340, padding: '7px 12px', borderRadius: 8, fontSize: 13,
                border: accountName ? '1px solid var(--acento)' : '1px solid var(--border)',
                background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit',
              }}
            />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Todos los movimientos de este archivo quedarán etiquetados con esta cuenta
            </span>
          </div>}
        </div>

        <div
          className={`import-drop-zone${dragOver ? ' drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          <div className="import-drop-inner">
            <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
            <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, letterSpacing: '-0.5px' }}>
              {importMode === 'previsiones' ? 'Arrastra tu archivo de reservas aquí' : 'Arrastra tu extracto bancario aquí'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5, maxWidth: 400 }}>
              Acepta archivos CSV y Excel (.xlsx) de los principales bancos españoles.
            </div>
            <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }} onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
              Seleccionar archivo
            </button>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 16, letterSpacing: '0.05em' }}>
              Máximo 5 MB · Datos procesados en local · No se envían a ningún servidor
            </div>
          </div>
        </div>

        {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panel-header"><span className="panel-title">Cómo funciona</span></div>
          <div className="panel-body" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
              {[
                { step: '1', icon: '📂', title: 'Sube tu archivo',      desc: 'Arrastra o selecciona el extracto de tu banco' },
                { step: '2', icon: '🔍', title: 'Revisión automática',  desc: 'finio detecta columnas, categoriza y encuentra duplicados' },
                { step: '3', icon: '✏️', title: 'Ajustes manuales',     desc: 'Revisa los movimientos ambiguos y confirma categorías' },
                { step: '4', icon: '✅', title: 'Importar',             desc: 'Los movimientos se añaden a tu historial' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--acento)', letterSpacing: '0.1em', marginBottom: 4 }}>PASO {s.step}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
