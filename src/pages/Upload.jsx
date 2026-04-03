import { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import AmountBadge from '../components/ui/AmountBadge'
import CategorySelect from '../components/ui/CategorySelect'

function detectColumn(headers, candidates) {
  for (const c of candidates) {
    const match = headers.find(h => String(h).toLowerCase().includes(c.toLowerCase()))
    if (match) return match
  }
  return headers[0]
}

function parseAmount(val) {
  if (val === null || val === undefined || val === '') return NaN
  if (typeof val === 'number') return val
  const clean = String(val).replace(/\s/g, '').replace(/[^\d.,-]/g, '')
  // Handle European format: 1.234,56 → 1234.56
  if (/\d{1,3}(\.\d{3})*(,\d+)?$/.test(clean)) {
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'))
  }
  return parseFloat(clean.replace(',', '.'))
}

function formatDate(val) {
  if (!val && val !== 0) return ''
  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  if (typeof val === 'number') {
    // Excel serial date
    const info = XLSX.SSF.parse_date_code(val)
    if (info) {
      return `${info.y}-${String(info.m).padStart(2, '0')}-${String(info.d).padStart(2, '0')}`
    }
  }
  // Already a string — normalise DD/MM/YYYY → YYYY-MM-DD
  const s = String(val).trim()
  const dmyMatch = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/)
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch
    const year = y.length === 2 ? `20${y}` : y
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return s
}

function processRows(data, headers, setRows, setImported, setError) {
  if (!headers.length) { setError('No se encontraron columnas en el archivo.'); return }

  const dateCol   = detectColumn(headers, ['fecha', 'date', 'f.valor', 'f.operac', 'value date'])
  const descCol   = detectColumn(headers, ['descripcion', 'concepto', 'description', 'movimiento', 'concept'])
  const amountCol = detectColumn(headers, ['importe', 'amount', 'cargo', 'abono', 'saldo'])

  const parsed = data.map(row => {
    const amount = parseAmount(row[amountCol])
    return {
      date:        formatDate(row[dateCol]),
      description: String(row[descCol] || '').trim(),
      amount,
      category:    '',
      tipo:        amount >= 0 ? 'Ingreso' : 'Variable',
      account:     'BBVA',
    }
  }).filter(r => !isNaN(r.amount) && r.amount !== 0)

  if (!parsed.length) { setError('No se encontraron transacciones válidas. Revisa el formato del archivo.'); return }
  setError(null)
  setRows(parsed)
  setImported(false)
}

export default function Upload({ addTransactions }) {
  const [dragging, setDragging] = useState(false)
  const [rows, setRows]         = useState([])
  const [imported, setImported] = useState(false)
  const [error, setError]       = useState(null)
  const inputRef = useRef()

  function handleFile(file) {
    if (!file) return
    setError(null)
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'csv' || ext === 'txt') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data, meta }) => {
          processRows(data, meta.fields || [], setRows, setImported, setError)
        },
        error: () => setError('No se pudo leer el CSV. Verifica que sea un archivo de texto válido.'),
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const data = XLSX.utils.sheet_to_json(ws, { defval: '' })
          const headers = data.length ? Object.keys(data[0]) : []
          processRows(data, headers, setRows, setImported, setError)
        } catch {
          setError('No se pudo leer el Excel. Asegúrate de que el archivo no esté protegido.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setError('Formato no soportado. Usa CSV o Excel (.xlsx).')
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function onCategoryChange(idx, cat) {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, category: cat } : r))
  }

  function confirmImport() {
    addTransactions(rows)
    setImported(true)
    setRows([])
  }

  const totalPositive = rows.filter(r => r.amount > 0).reduce((s, r) => s + r.amount, 0)
  const totalNegative = rows.filter(r => r.amount < 0).reduce((s, r) => s + r.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-medium text-primary">Subir extracto</h1>
        <p className="text-sm text-muted mt-0.5">
          Importa tu CSV o Excel a Finio — compatible con BBVA, Wise, Sabadell y otros
        </p>
      </div>

      {rows.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current.click()}
          className={`border-2 border-dashed rounded-lg px-8 py-20 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragging
              ? 'border-tri-400 bg-tri-50'
              : 'border-border bg-card hover:border-tri-300 hover:bg-tri-50/40'
          }`}
        >
          <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
            onChange={e => handleFile(e.target.files[0])} />
          <div className="w-14 h-14 rounded-xl bg-tri-50 border border-tri-100 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-tri-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-secondary">
            Arrastra tu archivo aquí o{' '}
            <span className="text-tri-600 font-medium">selecciona un archivo</span>
          </p>
          <p className="text-xs text-muted mt-1">
            CSV o Excel (.xlsx) · Finio detecta fecha, concepto e importe automáticamente
          </p>
        </div>
      )}

      {error && (
        <div className="bg-expense-bg border border-expense-border rounded-lg px-5 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-expense-text flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-expense-text">{error}</p>
        </div>
      )}

      {imported && (
        <div className="bg-income-bg border border-income-border rounded-lg px-5 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-income-text flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-income-text font-medium">
            Transacciones importadas correctamente a Finio.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-card rounded-lg border border-border shadow-card px-5 py-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-muted">Filas detectadas</p>
                <p className="text-lg font-medium text-primary">{rows.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Ingresos</p>
                <p className="text-lg font-medium text-income-text tabular">
                  +{totalPositive.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Gastos</p>
                <p className="text-lg font-medium text-expense-text tabular">
                  {totalNegative.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRows([])}
                className="text-sm text-muted hover:text-secondary px-3 py-2 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmImport}
                className="bg-tri-600 text-white text-sm font-medium px-4 py-2 rounded-sm hover:bg-tri-700 transition-colors"
              >
                Confirmar importación
              </button>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-tri-50/40">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Descripción</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Categoría</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {rows.map((r, i) => (
                  <tr key={i} className="hover:bg-tri-50/30">
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">{r.date}</td>
                    <td className="px-4 py-3 text-primary">{r.description}</td>
                    <td className="px-4 py-3">
                      <CategorySelect value={r.category} onChange={cat => onCategoryChange(i, cat)} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <AmountBadge amount={r.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
