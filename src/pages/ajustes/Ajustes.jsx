import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../../contexts/DataContext'
import { useAuthContext } from '../../contexts/AuthContext'

function fmt(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

function HighlightText({ text, query }) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(79,201,239,0.25)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function TipoBadge({ tipo, style = {} }) {
  const base = {
    'Fijo':    { background: 'rgba(46,184,122,0.12)',  color: 'var(--acento)' },
    'Ingreso': { background: 'rgba(79,201,239,0.15)',  color: '#0B7A9E' },
    'Variable':{ background: 'rgba(184,125,0,0.10)',   color: 'var(--aviso)' },
  }
  const s = base[tipo] || base['Variable']
  return <span className="inline-badge" style={{ ...s, ...style }}>{tipo || 'Variable'}</span>
}

const navItems = [
  { key: 'perfil', icon: '👤', label: 'Perfil' },
  { key: 'categorias', icon: '🏷️', label: 'Categorías' },
  { key: 'presupuestos', icon: '🎯', label: 'Presupuestos' },
  { key: 'notificaciones', icon: '🔔', label: 'Notificaciones' },
  { key: 'apariencia', icon: '🎨', label: 'Apariencia' },
  { key: 'datos', icon: '📦', label: 'Datos' },
  { key: 'cuenta', icon: '🔐', label: 'Cuenta' },
]

const EMOJIS = ['🍔','🛒','🚇','🎉','💊','📺','🏠','📦','✈️','🏋️','🐶','👗','📚','💆','🚗','💡','🌐','🎵','🍕','☕','🎮','💅','🏥','⛽','🎓','🏦','🛍️','🍷','🎭','📱','🐾','🎨','🎸','🧴','🏡','🧹']
const COLORS = ['#FF6B5B','#72E4A5','#2EB87A','#FFB830','#4FC9EF','#9B8FFF','#8A8A8A','#FF9500','#FF2D55','#5856D6','#34AADC','#4CD964','#FF3B30','#007AFF','#D4F5E2']

const PACKS = [
  {
    id: 'basico', name: 'Pack Básico', emoji: '⭐', color: '#2EB87A',
    desc: 'Las categorías esenciales para empezar.',
    categories: [
      { name: 'Comida', emoji: '🍔', color: '#FF6B5B', budget: 160, tipo: 'Variable' },
      { name: 'Supermercado', emoji: '🛒', color: '#72E4A5', budget: 300, tipo: 'Variable' },
      { name: 'Transporte', emoji: '🚇', color: '#2EB87A', budget: 80, tipo: 'Variable' },
      { name: 'Ocio', emoji: '🎉', color: '#FFB830', budget: 100, tipo: 'Variable' },
      { name: 'Salud', emoji: '💊', color: '#4FC9EF', budget: 60, tipo: 'Variable' },
      { name: 'Suscripciones', emoji: '📺', color: '#9B8FFF', budget: 80, tipo: 'Fijo' },
      { name: 'Hogar', emoji: '🏠', color: '#8A8A8A', budget: 850, tipo: 'Fijo' },
      { name: 'Otros', emoji: '📦', color: '#8A8A8A', budget: null, tipo: 'Variable' },
    ],
  },
  {
    id: 'completo', name: 'Pack Completo', emoji: '🗂️', color: '#5856D6',
    desc: 'Categorización detallada para un control fino.',
    categories: [
      { name: 'Restaurantes', emoji: '🍽️', color: '#FF6B5B', budget: 120, tipo: 'Variable' },
      { name: 'Supermercado', emoji: '🛒', color: '#72E4A5', budget: 300, tipo: 'Variable' },
      { name: 'Café y snacks', emoji: '☕', color: '#FFB830', budget: 40, tipo: 'Variable' },
      { name: 'Transporte público', emoji: '🚇', color: '#2EB87A', budget: 60, tipo: 'Variable' },
      { name: 'Gasolina', emoji: '⛽', color: '#FF9500', budget: 80, tipo: 'Variable' },
      { name: 'Ocio y cultura', emoji: '🎉', color: '#FFB830', budget: 80, tipo: 'Variable' },
      { name: 'Viajes', emoji: '✈️', color: '#34AADC', budget: 200, tipo: 'Variable' },
      { name: 'Ropa y calzado', emoji: '👗', color: '#FF2D55', budget: 80, tipo: 'Variable' },
      { name: 'Salud y farmacia', emoji: '💊', color: '#4FC9EF', budget: 60, tipo: 'Variable' },
      { name: 'Gimnasio', emoji: '🏋️', color: '#4CD964', budget: 40, tipo: 'Fijo' },
      { name: 'Streaming', emoji: '📺', color: '#9B8FFF', budget: 50, tipo: 'Fijo' },
      { name: 'Alquiler / hipoteca', emoji: '🏠', color: '#8A8A8A', budget: 850, tipo: 'Fijo' },
      { name: 'Suministros', emoji: '💡', color: '#FFB830', budget: 100, tipo: 'Fijo' },
      { name: 'Mascotas', emoji: '🐶', color: '#FF9500', budget: 80, tipo: 'Variable' },
      { name: 'Otros', emoji: '📦', color: '#8A8A8A', budget: null, tipo: 'Variable' },
    ],
  },
  {
    id: 'autonomo', name: 'Pack Autónomo', emoji: '💼', color: '#FF9500',
    desc: 'Para freelancers y autónomos: separa negocio y personal.',
    categories: [
      { name: 'Herramientas y software', emoji: '🛠️', color: '#5856D6', budget: 80, tipo: 'Fijo' },
      { name: 'Formación y cursos', emoji: '🎓', color: '#4FC9EF', budget: 60, tipo: 'Variable' },
      { name: 'Gestoría', emoji: '📋', color: '#34AADC', budget: 80, tipo: 'Fijo' },
      { name: 'Equipamiento tech', emoji: '💻', color: '#007AFF', budget: 200, tipo: 'Variable' },
      { name: 'Comidas de trabajo', emoji: '🍽️', color: '#FF6B5B', budget: 100, tipo: 'Variable' },
      { name: 'Coworking', emoji: '🏢', color: '#8A8A8A', budget: 200, tipo: 'Fijo' },
      { name: 'Supermercado', emoji: '🛒', color: '#72E4A5', budget: 300, tipo: 'Variable' },
      { name: 'Hogar', emoji: '🏠', color: '#8A8A8A', budget: 850, tipo: 'Fijo' },
    ],
  },
]

function CatEditModal({ cat, categories, childCategories = [], onSave, onDelete, onClose }) {
  const [name, setName] = useState(cat?.name || '')
  const [emoji, setEmoji] = useState(cat?.emoji || '📦')
  const [color, setColor] = useState(cat?.color || '#8A8A8A')
  const [budget, setBudget] = useState(cat?.budget ?? '')
  const [tipo, setTipo] = useState(cat?.tipo || 'Variable')
  const [parentId, setParentId] = useState(cat?.parent_id || '')
  const [propagate, setPropagate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isNew = !cat?.id
  const parentOptions = categories.filter(c => c.id !== cat?.id && !c.parent_id)
  const hasChildren = childCategories.length > 0

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    const childIds = (propagate && hasChildren) ? childCategories.map(c => c.id) : []
    await onSave({ name: name.trim(), emoji, color, budget: budget !== '' ? +budget : null, tipo, parent_id: parentId || null }, childIds)
    setSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setSaving(true)
    await onDelete(cat.id)
    setSaving(false)
    onClose()
  }

  return (
    <div className="cat-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cat-modal" style={{ maxWidth: 500 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">{isNew ? 'Nueva categoría' : `Editar · ${cat.emoji} ${cat.name}`}</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cat-modal-body">
          <div className="cat-field">
            <label className="cat-field-label">Icono</label>
            <div className="cat-emoji-grid">{EMOJIS.map(e => <button key={e} className={`cat-emoji-btn${emoji === e ? ' selected' : ''}`} onClick={() => setEmoji(e)}>{e}</button>)}</div>
          </div>
          <div className="cat-field">
            <label className="cat-field-label">Nombre <span style={{ color: 'var(--acento)' }}>*</span></label>
            <input className="cat-field-input" type="text" placeholder="Ej: Mascotas, Viajes..." value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="cat-field">
            <label className="cat-field-label">Color</label>
            <div className="cat-color-row">{COLORS.map(c => <button key={c} className={`cat-color-btn${color === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />)}</div>
          </div>
          <div className="cat-field">
            <label className="cat-field-label">Tipo</label>
            <div className="chip-selector">
              <button className={`chip${tipo === 'Variable' ? ' selected' : ''}`} onClick={() => setTipo('Variable')}>💸 Gasto variable</button>
              <button className={`chip${tipo === 'Fijo' ? ' selected' : ''}`} onClick={() => setTipo('Fijo')}>📌 Gasto fijo</button>
              <button className={`chip${tipo === 'Ingreso' ? ' selected' : ''}`} style={tipo === 'Ingreso' ? { background: 'rgba(79,201,239,0.15)', borderColor: '#4FC9EF', color: '#0B7A9E' } : undefined} onClick={() => setTipo('Ingreso')}>💰 Ingreso</button>
            </div>
          </div>
          {/* Toggle propagar tipo a hijos — siempre visible si tiene subcategorías */}
          {!isNew && hasChildren && (
            <div className="cat-propagate-row" onClick={() => setPropagate(p => !p)}>
              <div className={`cat-propagate-check${propagate ? ' on' : ''}`}>{propagate && '✓'}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  Aplicar tipo a las {childCategories.length} subcategorías
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {childCategories.map(c => c.name).join(', ')}
                </div>
              </div>
            </div>
          )}

          {tipo !== 'Ingreso' && (
            <div className="cat-field">
              <label className="cat-field-label">Presupuesto mensual</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input className="cat-field-input" type="number" placeholder="Sin límite" value={budget} onChange={e => setBudget(e.target.value)} style={{ width: 130 }} />
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>€ / mes</span>
              </div>
            </div>
          )}
          <div className="cat-field">
            <label className="cat-field-label">Categoría padre <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(convierte esta en subcategoría)</span></label>
            <select className="cat-field-select" value={parentId} onChange={e => setParentId(e.target.value)}>
              <option value="">Sin categoría padre (principal)</option>
              {parentOptions.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="cat-modal-footer">
          {!isNew && (
            <button className="cat-delete-btn" onClick={handleDelete} style={confirmDelete ? { background: 'var(--alerta)', color: '#fff' } : undefined}>
              {confirmDelete ? '¿Seguro? Pulsa de nuevo' : '🗑 Eliminar'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={!name.trim() || saving}>{saving ? 'Guardando...' : isNew ? 'Crear' : 'Guardar'}</button>
        </div>
      </div>
    </div>
  )
}

function CatImportModal({ existingNames, onImport, onClose }) {
  const [selected, setSelected] = useState(null)
  const [importing, setImporting] = useState(false)
  const [csvError, setCsvError] = useState('')
  const fileRef = useRef()
  const pack = PACKS.find(p => p.id === selected)
  const toImport = pack ? pack.categories.filter(c => !existingNames.includes(c.name.toLowerCase())) : []
  const alreadyIn = pack ? pack.categories.length - toImport.length : 0

  const handleImportPack = async () => {
    setImporting(true)
    await onImport(toImport)
    setImporting(false)
    onClose()
  }

  const handleCSV = (e) => {
    const file = e.target.files[0]; if (!file) return
    setCsvError('')
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const lines = ev.target.result.split('\n').filter(l => l.trim())
        const cats = lines.slice(1).map(line => {
          const [name, emoji, color, budget, tipo] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
          if (!name) return null
          return { name, emoji: emoji || '📦', color: color || '#8A8A8A', budget: budget ? +budget : null, tipo: tipo || 'Variable' }
        }).filter(Boolean).filter(c => !existingNames.includes(c.name.toLowerCase()))
        if (!cats.length) { setCsvError('No se encontraron categorías nuevas en el CSV.'); return }
        setImporting(true)
        await onImport(cats)
        setImporting(false)
        onClose()
      } catch { setCsvError('Error al leer el archivo. Comprueba el formato.') }
    }
    reader.readAsText(file)
  }

  return (
    <div className="cat-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cat-modal" style={{ maxWidth: 600 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">📥 Importar categorías</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cat-modal-body">
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Elige un pack o sube tu propio CSV. Las categorías que ya tienes no se duplicarán.</div>
          <div className="import-packs-grid">
            {PACKS.map(p => {
              const news = p.categories.filter(c => !existingNames.includes(c.name.toLowerCase())).length
              const isSelected = selected === p.id
              return (
                <div key={p.id} className={`import-pack-card${isSelected ? ' selected' : ''}`} style={isSelected ? { borderColor: p.color, background: `${p.color}08` } : undefined} onClick={() => setSelected(isSelected ? null : p.id)}>
                  <div className="import-pack-top">
                    <div className="import-pack-emoji" style={{ background: `${p.color}15` }}>{p.emoji}</div>
                    <div className="import-pack-check" style={isSelected ? { background: p.color } : undefined}>{isSelected && '✓'}</div>
                  </div>
                  <div className="import-pack-name">{p.name}</div>
                  <div className="import-pack-desc">{p.desc}</div>
                  <div className="import-pack-meta">
                    <span style={{ color: p.color }}>{p.categories.length} categorías</span>
                    {p.categories.length - news > 0 && <span style={{ color: 'var(--text-muted)' }}> · {p.categories.length - news} ya existen</span>}
                    {news > 0 && p.categories.length - news > 0 && <span style={{ color: 'var(--acento)' }}> · {news} nuevas</span>}
                  </div>
                </div>
              )
            })}
          </div>
          {pack && (
            <div className="import-preview-list">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Categorías incluidas</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {pack.categories.map((c, i) => {
                  const exists = existingNames.includes(c.name.toLowerCase())
                  return <span key={i} className="import-cat-tag" style={{ background: exists ? 'var(--bg-surface2)' : `${c.color}18`, border: `1px solid ${exists ? 'var(--border)' : c.color}40`, color: exists ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: exists ? 'line-through' : 'none' }}>{c.emoji} {c.name}</span>
                })}
              </div>
            </div>
          )}
          <div className="import-divider"><div className="import-divider-line" /><span className="import-divider-text">o importa tu propio CSV</span><div className="import-divider-line" /></div>
          <div className="import-csv-zone" onClick={() => fileRef.current?.click()}>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
            <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Sube un CSV con tus categorías</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Formato: <code style={{ fontFamily: "'DM Mono',monospace" }}>nombre, emoji, color, presupuesto, tipo</code></div>
            {csvError && <div style={{ marginTop: 8, fontSize: 12, color: 'var(--alerta)' }}>{csvError}</div>}
          </div>
        </div>
        <div className="cat-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <div style={{ flex: 1 }} />
          {pack && <button className="btn-primary" onClick={handleImportPack} disabled={importing || toImport.length === 0}>{importing ? 'Importando...' : toImport.length === 0 ? 'Ya tienes todas' : `Importar ${toImport.length} →`}</button>}
        </div>
      </div>
    </div>
  )
}

function BulkSubModal({ parent, existingNames, onImport, onClose }) {
  const [text, setText] = useState('')
  const [emoji, setEmoji] = useState('📦')
  const [color, setColor] = useState('#8A8A8A')
  const [tipo, setTipo] = useState('Variable')
  const [importing, setImporting] = useState(false)

  // Parsea el texto: separa por comas o saltos de línea, filtra vacíos y duplicados
  const parsed = text
    .split(/[\n,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  const toCreate = parsed.filter(name => !existingNames.includes(name.toLowerCase()))
  const alreadyExist = parsed.filter(name => existingNames.includes(name.toLowerCase()))

  const handleImport = async () => {
    if (!toCreate.length) return
    setImporting(true)
    await onImport(toCreate.map(name => ({ name, emoji, color, tipo, parent_id: parent.id })))
    setImporting(false)
    onClose()
  }

  return (
    <div className="cat-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cat-modal" style={{ maxWidth: 520 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">
            Añadir subcategorías a <span style={{ color: 'var(--acento)' }}>{parent.emoji} {parent.name}</span>
          </div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="cat-modal-body">
          <div className="cat-field">
            <label className="cat-field-label">Nombres <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(separados por coma o por línea)</span></label>
            <textarea
              className="cat-field-input"
              rows={4}
              placeholder={"Jack, Thor, Zoe\nBerri\nFanny, Lady Kar"}
              value={text}
              onChange={e => setText(e.target.value)}
              style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
            />
          </div>

          {parsed.length > 0 && (
            <div className="bulk-preview">
              {toCreate.map((name, i) => (
                <span key={i} className="bulk-preview-tag" style={{ background: `${color}18`, border: `1px solid ${color}40` }}>
                  {emoji} {name}
                </span>
              ))}
              {alreadyExist.map((name, i) => (
                <span key={i} className="bulk-preview-tag" style={{ background: 'var(--bg-surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {name}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="cat-field" style={{ flex: 1, minWidth: 140 }}>
              <label className="cat-field-label">Icono base</label>
              <div className="cat-emoji-grid">{EMOJIS.map(e => <button key={e} className={`cat-emoji-btn${emoji === e ? ' selected' : ''}`} onClick={() => setEmoji(e)}>{e}</button>)}</div>
            </div>
            <div className="cat-field" style={{ flex: 1, minWidth: 140 }}>
              <label className="cat-field-label">Color base</label>
              <div className="cat-color-row">{COLORS.map(c => <button key={c} className={`cat-color-btn${color === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />)}</div>
              <div style={{ marginTop: 10 }}>
                <label className="cat-field-label">Tipo</label>
                <div className="chip-selector" style={{ marginTop: 6 }}>
                  <button className={`chip${tipo === 'Variable' ? ' selected' : ''}`} onClick={() => setTipo('Variable')}>💸 Variable</button>
                  <button className={`chip${tipo === 'Fijo' ? ' selected' : ''}`} onClick={() => setTipo('Fijo')}>📌 Fijo</button>
                  <button className={`chip${tipo === 'Ingreso' ? ' selected' : ''}`} style={tipo === 'Ingreso' ? { background: 'rgba(79,201,239,0.15)', borderColor: '#4FC9EF', color: '#0B7A9E' } : undefined} onClick={() => setTipo('Ingreso')}>💰 Ingreso</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="cat-modal-footer">
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {toCreate.length > 0 && <span>{toCreate.length} nueva{toCreate.length !== 1 ? 's' : ''}</span>}
            {alreadyExist.length > 0 && <span style={{ marginLeft: 8 }}>· {alreadyExist.length} ya existen</span>}
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn-primary"
            onClick={handleImport}
            disabled={importing || toCreate.length === 0}
          >
            {importing ? 'Creando...' : toCreate.length === 0 ? 'Sin nombres nuevos' : `Crear ${toCreate.length} subcategoría${toCreate.length !== 1 ? 's' : ''} →`}
          </button>
        </div>
      </div>
    </div>
  )
}

function ToggleSwitch({ initial = false }) {
  const [on, setOn] = useState(initial)
  return <button className={`toggle-switch${on ? ' on' : ''}`} onClick={() => setOn(!on)}></button>
}

function SettingsRow({ icon, label, sub, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-icon">{icon}</div>
      <div className="settings-row-info">
        <div className="settings-row-label">{label}</div>
        {sub && <div className="settings-row-sub">{sub}</div>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  )
}

function SectionHeader({ icon, iconBg, title, desc }) {
  return (
    <div className="settings-section-header">
      <div className="settings-section-icon" style={{ background: iconBg }}>{icon}</div>
      <div className="settings-section-meta">
        <div className="settings-section-title">{title}</div>
        <div className="settings-section-desc">{desc}</div>
      </div>
    </div>
  )
}

export default function Ajustes() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthContext()
  const { settings, categories, spendingByCategory, transactions, income, saveSettings, addCategory, updateCategory, deleteCategory, loading } = useData()

  const [activePane, setActivePane] = useState('perfil')
  const [saveError, setSaveError] = useState('')

  // Profile form state
  const [profileIncome, setProfileIncome] = useState(null)
  const [profileIncomeType, setProfileIncomeType] = useState(null)
  const [profilePayDay, setProfilePayDay] = useState(null)
  const [profileFixed, setProfileFixed] = useState(null)
  const [saving, setSaving] = useState(false)

  const currentIncome = profileIncome !== null ? profileIncome : (settings?.income || 0)
  const currentIncomeType = profileIncomeType !== null ? profileIncomeType : (settings?.income_type || 'regular')
  const currentPayDay = profilePayDay !== null ? profilePayDay : (settings?.pay_day || '1')
  const currentFixed = profileFixed !== null ? profileFixed : (settings?.fixed_expenses || [])

  const profileDirty = profileIncome !== null || profileIncomeType !== null || profilePayDay !== null || profileFixed !== null

  // Budget edit state
  const [budgetEdits, setBudgetEdits] = useState({})

  // Categories state
  const [editingCat, setEditingCat] = useState(null)
  const [showCatModal, setShowCatModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [bulkSubParent, setBulkSubParent] = useState(null)

  // When duplicates exist, show ALL records so the user can delete the extras
  const uniqueCategories = useMemo(() => {
    const nameCount = {}
    categories.forEach(c => { nameCount[c.name.toLowerCase()] = (nameCount[c.name.toLowerCase()] || 0) + 1 })
    const hasDups = Object.values(nameCount).some(n => n > 1)
    if (hasDups) return categories   // show all so duplicates are visible and deletable
    const seen = new Set()
    return categories.filter(c => { const k = c.name.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
  }, [categories])

  const existingCatNames = useMemo(() => uniqueCategories.map(c => c.name.toLowerCase()), [uniqueCategories])

  // Detect duplicate category names (same name, different parent_id)
  const duplicateCats = useMemo(() => {
    const nameCount = {}
    categories.forEach(c => { nameCount[c.name] = (nameCount[c.name] || 0) + 1 })
    return categories.filter(c => nameCount[c.name] > 1)
  }, [categories])

  // Budget rows: only parent categories, spending = own + all subcategories
  const budgetRows = useMemo(() => {
    const parentCats = uniqueCategories.filter(c => !c.parent_id)
    return parentCats.map(c => {
      const children = uniqueCategories.filter(k => k.parent_id === c.id)
      const spent = [c, ...children].reduce((s, cat) => s + (spendingByCategory[cat.name] || 0), 0)
      const budget = c.budget || 0
      const dev = budget > 0 ? spent - budget : 0
      return {
        id: c.id,
        dot: c.color || '#8A8A8A',
        cat: `${c.emoji} ${c.name}`,
        name: c.name,
        tipo: c.tipo,
        type: c.tipo === 'Fijo' ? 'fijo' : c.tipo === 'Ingreso' ? 'ingreso' : 'variable',
        childCount: children.length,
        budget,
        real: spent,
        dev,
        realColor: budget > 0 && spent > budget ? 'var(--alerta)' : budget > 0 && spent >= budget * 0.8 ? 'var(--aviso)' : undefined,
        devColor: dev > 0 ? 'var(--alerta)' : dev < 0 ? 'var(--acento)' : undefined,
      }
    }).sort((a, b) => b.real - a.real)
  }, [uniqueCategories, spendingByCategory])

  const totalBudget = budgetRows.reduce((s, r) => s + r.budget, 0)
  const totalReal   = budgetRows.reduce((s, r) => s + r.real, 0)
  const totalDev    = totalReal - totalBudget

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [expandedCats, setExpandedCats] = useState(new Set())
  const toggleExpand = (id) => setExpandedCats(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const [catSearch, setCatSearch] = useState('')

  // Bulk select
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const toggleSelect = (id) => setSelectedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })
  const selectAll = () => {
    const allVisible = filteredCatTree.flatMap(({ cat, matchedChildren }) => {
      const children = matchedChildren ?? uniqueCategories.filter(c => c.parent_id === cat.id)
      return [cat.id, ...children.map(c => c.id)]
    })
    setSelectedIds(new Set(allVisible))
  }
  const clearSelect = () => { setSelectedIds(new Set()); setSelectMode(false) }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    // Delete children first to avoid FK violations
    const selected = categories.filter(c => selectedIds.has(c.id))
    const children = selected.filter(c => c.parent_id)
    const parents  = selected.filter(c => !c.parent_id)
    for (const c of children) await deleteCategory(c.id)
    for (const c of parents)  await deleteCategory(c.id)
    setSelectedIds(new Set())
    setSelectMode(false)
    setBulkDeleting(false)
  }

  // Filtered categories for search
  const filteredCatTree = useMemo(() => {
    const q = catSearch.toLowerCase().trim()
    const parents = uniqueCategories.filter(c => !c.parent_id)
    if (!q) return parents.map(p => ({ cat: p, matchedChildren: null }))
    return parents
      .map(p => {
        const children = uniqueCategories.filter(c => c.parent_id === p.id)
        const parentMatch = p.name.toLowerCase().includes(q) || (p.emoji || '').includes(q)
        const matchedChildren = children.filter(c => c.name.toLowerCase().includes(q) || (c.emoji || '').includes(q))
        if (!parentMatch && matchedChildren.length === 0) return null
        return { cat: p, matchedChildren: parentMatch ? null : matchedChildren }
      })
      .filter(Boolean)
  }, [uniqueCategories, catSearch])

  const handleSaveCat = async (data, childIds = []) => {
    if (!editingCat?.id) {
      await addCategory(data)
    } else {
      await updateCategory(editingCat.id, data)
      // Propagar tipo a subcategorías si el usuario lo pidió
      for (const id of childIds) {
        await updateCategory(id, { tipo: data.tipo })
      }
    }
  }
  const handleDeleteCat = async (id) => { await deleteCategory(id) }
  const handleImportCats = async (cats) => { for (const c of cats) await addCategory(c) }
  const handleDeleteAllCats = async () => {
    if (!confirmDeleteAll) { setConfirmDeleteAll(true); return }
    setDeletingAll(true)
    for (const c of uniqueCategories) await deleteCategory(c.id)
    setDeletingAll(false)
    setConfirmDeleteAll(false)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveError('')
    const { error } = await saveSettings({
      income: currentIncome,
      income_type: currentIncomeType,
      pay_day: currentPayDay,
      fixed_expenses: currentFixed,
    })
    setSaving(false)
    if (error) {
      setSaveError(`Error al guardar: ${error.message}`)
      return
    }
    setProfileIncome(null)
    setProfileIncomeType(null)
    setProfilePayDay(null)
    setProfileFixed(null)
  }

  const updateFixed = (i, field, val) => {
    const next = [...currentFixed]
    next[i] = { ...next[i], [field]: val }
    setProfileFixed(next)
  }

  const addFixed = () => {
    setProfileFixed([...currentFixed, { emoji: '📌', nombre: '', dia: '1', importe: 0 }])
  }

  const removeFixed = (i) => {
    setProfileFixed(currentFixed.filter((_, idx) => idx !== i))
  }

  const handleSaveBudgets = async () => {
    setSaving(true)
    for (const [id, newBudget] of Object.entries(budgetEdits)) {
      await updateCategory(id, { budget: newBudget })
    }
    setBudgetEdits({})
    setSaving(false)
  }

  const monthName = new Date().toLocaleString('es-ES', { month: 'short' })

  if (loading) return <div className="auth-loading"><div className="auth-spinner"></div></div>

  return (
    <div>
      <div className="settings-layout">
        <nav className="settings-nav">
          {navItems.map(n => (
            <button key={n.key} className={`settings-nav-item${activePane === n.key ? ' active' : ''}`} onClick={() => setActivePane(n.key)}>
              <span className="settings-nav-icon">{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {/* PERFIL */}
          {activePane === 'perfil' && (
            <div className="settings-pane" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="settings-section">
                <SectionHeader icon="👤" iconBg="rgba(46,184,122,0.1)" title="Tu perfil" desc="Datos básicos y configuración de ingresos" />
                <SettingsRow icon="✉️" label="Correo electrónico" sub="Cuenta vinculada a finio">
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email || '—'}</span>
                </SettingsRow>
                <SettingsRow icon="💶" label="Ingreso mensual neto" sub="Base para calcular tu margen disponible">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      className="settings-input"
                      type="number"
                      value={currentIncome}
                      onChange={e => setProfileIncome(+e.target.value)}
                      style={{ width: 110 }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>€</span>
                  </div>
                </SettingsRow>
                <SettingsRow icon="📊" label="Tipo de ingreso" sub="¿Tu salario es fijo o variable?">
                  <div className="chip-selector">
                    <button
                      className={`chip${currentIncomeType === 'regular' ? ' selected' : ''}`}
                      onClick={() => setProfileIncomeType('regular')}
                    >Nómina fija</button>
                    <button
                      className={`chip${currentIncomeType === 'variable' ? ' selected' : ''}`}
                      onClick={() => setProfileIncomeType('variable')}
                    >Variable / autónomo</button>
                  </div>
                </SettingsRow>
                <SettingsRow icon="📅" label="Día de cobro" sub="Cuándo recibes tu nómina normalmente">
                  <div className="chip-selector">
                    {[{ val: '1', label: 'Día 1' }, { val: '15', label: 'Día 15' }, { val: '28', label: 'Día 28' }, { val: 'otro', label: 'Otro' }].map(d => (
                      <button
                        key={d.val}
                        className={`chip${currentPayDay === d.val ? ' selected' : ''}`}
                        onClick={() => setProfilePayDay(d.val)}
                      >{d.label}</button>
                    ))}
                  </div>
                </SettingsRow>
              </div>

              <div className="settings-section">
                <SectionHeader icon="📌" iconBg="rgba(184,125,0,0.1)" title="Gastos fijos mensuales" desc="Alquiler, suscripciones, seguros... lo que sale cada mes sí o sí" />
                {currentFixed.map((f, i) => (
                  <div key={i} className="settings-row" style={{ gap: 10 }}>
                    <div className="settings-row-icon">{f.emoji || '📌'}</div>
                    <div className="settings-row-info" style={{ flex: 1 }}>
                      <input
                        className="settings-input"
                        type="text"
                        placeholder="Nombre del gasto"
                        value={f.nombre || ''}
                        onChange={e => updateFixed(i, 'nombre', e.target.value)}
                        style={{ width: '100%', marginBottom: 4 }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        className="settings-input"
                        type="number"
                        placeholder="Importe"
                        value={f.importe || ''}
                        onChange={e => updateFixed(i, 'importe', +e.target.value)}
                        style={{ width: 90 }}
                      />
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>€</span>
                      <button
                        onClick={() => removeFixed(i)}
                        style={{ background: 'none', border: 'none', color: 'var(--alerta)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
                        title="Eliminar"
                      >✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ padding: '8px 18px' }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 13 }}
                    onClick={addFixed}
                  >+ Añadir gasto fijo</button>
                </div>
              </div>

              {(profileDirty || saveError) && (
                <div className="save-bar">
                  {saveError
                    ? <span className="save-bar-hint" style={{ color: 'var(--alerta)' }}>⚠️ {saveError}</span>
                    : <span className="save-bar-hint">Tienes cambios sin guardar.</span>
                  }
                  <div className="save-bar-btns">
                    <button className="btn-secondary" onClick={() => {
                      setProfileIncome(null); setProfileIncomeType(null)
                      setProfilePayDay(null); setProfileFixed(null); setSaveError('')
                    }}>Cancelar</button>
                    <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                      {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CATEGORÍAS */}
          {activePane === 'categorias' && (
            <div className="settings-pane" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="settings-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px 16px' }}>
                  <SectionHeader icon="🏷️" iconBg="rgba(155,143,255,0.12)" title="Categorías" desc="Gestiona tus categorías de gasto e ingreso" />
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!selectMode ? (
                      <>
                        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => { setShowImportModal(true) }}>📥 Importar pack</button>
                        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setSelectMode(true)}>☑️ Seleccionar</button>
                        <button className="btn-primary"   style={{ fontSize: 13 }} onClick={() => { setEditingCat(null); setShowCatModal(true) }}>+ Nueva</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={selectAll}>Seleccionar todo</button>
                        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={clearSelect}>Cancelar</button>
                      </>
                    )}
                  </div>
                </div>

                {/* Barra de acción bulk (sticky) */}
                {selectMode && selectedIds.size > 0 && (
                  <div style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    margin: '0 0 12px', padding: '10px 18px',
                    background: 'var(--bg-surface)', borderBottom: '2px solid var(--alerta)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {selectedIds.size} seleccionada{selectedIds.size !== 1 ? 's' : ''}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: 'var(--alerta)', color: '#fff', fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: bulkDeleting ? 0.6 : 1 }}
                    >
                      {bulkDeleting ? 'Eliminando...' : `🗑 Eliminar ${selectedIds.size}`}
                    </button>
                  </div>
                )}
                {/* Búsqueda rápida */}
                <div style={{ padding: '0 18px 12px' }}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.4, pointerEvents: 'none' }}>🔍</span>
                    <input
                      type="text"
                      placeholder={`Buscar entre ${uniqueCategories.length} categorías...`}
                      value={catSearch}
                      onChange={e => {
                        setCatSearch(e.target.value)
                        // Auto-expandir padres con hijos que coincidan
                        if (e.target.value) {
                          const q = e.target.value.toLowerCase()
                          const toOpen = uniqueCategories.filter(c => c.parent_id && c.name.toLowerCase().includes(q)).map(c => c.parent_id)
                          setExpandedCats(prev => new Set([...prev, ...toOpen]))
                        }
                      }}
                      style={{
                        width: '100%', padding: '8px 10px 8px 32px', borderRadius: 9,
                        border: '1px solid var(--border)', background: 'var(--bg-surface2)',
                        color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 13,
                        boxSizing: 'border-box',
                      }}
                    />
                    {catSearch && (
                      <button onClick={() => setCatSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: 0.5, padding: 2 }}>✕</button>
                    )}
                  </div>
                  {catSearch && (
                    <div style={{ marginTop: 6, fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)' }}>
                      {filteredCatTree.length === 0 ? 'Sin resultados' : `${filteredCatTree.length} categoría${filteredCatTree.length !== 1 ? 's' : ''} encontrada${filteredCatTree.length !== 1 ? 's' : ''}`}
                    </div>
                  )}
                </div>
                {/* Aviso de categorías duplicadas */}
                {duplicateCats.length > 0 && (
                  <div style={{ margin: '0 18px 12px', padding: '10px 14px', borderRadius: 10, background: 'rgba(184,125,0,0.08)', border: '1px solid rgba(184,125,0,0.2)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18 }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--aviso)', marginBottom: 4 }}>
                        Nombres duplicados detectados
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {[...new Set(duplicateCats.map(c => c.name))].join(', ')} — aparecen bajo más de un padre. Esto causa datos duplicados en Vista Anual. Borra el duplicado con ✏️ Editar → 🗑 Eliminar.
                      </div>
                    </div>
                    <button onClick={() => setCatSearch([...new Set(duplicateCats.map(c => c.name))][0] || '')}
                      style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid rgba(184,125,0,0.3)', background: 'transparent', color: 'var(--aviso)', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Ver →
                    </button>
                  </div>
                )}

                {uniqueCategories.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Sin categorías. Crea una o importa un pack para empezar.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {filteredCatTree.map(({ cat, matchedChildren }) => {
                      const children = matchedChildren ?? uniqueCategories.filter(c => c.parent_id === cat.id)
                      const isOpen = expandedCats.has(cat.id) || (catSearch && children.length > 0)
                      return (
                        <div key={cat.id}>
                          {/* ── Fila padre ── */}
                          <div className="settings-row cat-parent-row" style={{ cursor: 'default', background: selectedIds.has(cat.id) ? 'rgba(214,59,39,0.04)' : undefined }}>
                            {/* Checkbox selección */}
                            {selectMode && (
                              <input type="checkbox" checked={selectedIds.has(cat.id)} onChange={() => toggleSelect(cat.id)}
                                style={{ marginRight: 4, width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--alerta)', flexShrink: 0 }} />
                            )}
                            {/* Chevron / expand */}
                            <button
                              className="cat-chevron-btn"
                              onClick={() => toggleExpand(cat.id)}
                              style={{ opacity: children.length === 0 ? 0.2 : 1, cursor: children.length === 0 ? 'default' : 'pointer' }}
                              title={children.length > 0 ? (isOpen ? 'Contraer' : 'Expandir') : undefined}
                            >
                              <span style={{ display: 'inline-block', transition: 'transform .18s', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', fontSize: 11 }}>▶</span>
                            </button>
                            <div className="settings-row-icon" style={{ background: `${cat.color || '#8A8A8A'}18`, borderRadius: 10, fontSize: 18 }}>{cat.emoji || '📦'}</div>
                            <div className="settings-row-info">
                              <div className="settings-row-label">
                              {catSearch && cat.name.toLowerCase().includes(catSearch.toLowerCase())
                                ? <HighlightText text={cat.name} query={catSearch} />
                                : cat.name}
                            </div>
                              <div className="settings-row-sub">
                                <TipoBadge tipo={cat.tipo} style={{ marginRight: 6 }} />
                                {cat.budget ? `${cat.budget} € / mes` : 'Sin límite'}
                                {children.length > 0 && (
                                  <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
                                    · {children.length} subcategoría{children.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="settings-row-control" style={{ gap: 6 }}>
                              <button
                                className="cat-sub-btn"
                                title="Añadir subcategorías en lote"
                                onClick={() => { setBulkSubParent(cat); setExpandedCats(prev => new Set([...prev, cat.id])) }}
                              >📥 Importar subs</button>
                              <button
                                className="cat-sub-btn"
                                title="Añadir una subcategoría"
                                onClick={() => { setEditingCat({ parent_id: cat.id }); setShowCatModal(true); setExpandedCats(prev => new Set([...prev, cat.id])) }}
                              >+ Sub</button>
                              <button className="cat-edit-btn" onClick={() => { setEditingCat(cat); setShowCatModal(true) }}>✏️ Editar</button>
                            </div>
                          </div>

                          {/* ── Hijos (acordeón) ── */}
                          {isOpen && (
                            <div className="cat-children-wrap">
                              {children.map((child, idx) => (
                                <div key={child.id} className="cat-child-row" style={{ '--tree-color': cat.color || '#8A8A8A', background: selectedIds.has(child.id) ? 'rgba(214,59,39,0.04)' : undefined }}>
                                  {/* Checkbox hijo */}
                                  {selectMode && (
                                    <input type="checkbox" checked={selectedIds.has(child.id)} onChange={() => toggleSelect(child.id)}
                                      style={{ marginRight: 4, marginLeft: 8, width: 14, height: 14, cursor: 'pointer', accentColor: 'var(--alerta)', flexShrink: 0 }} />
                                  )}
                                  {/* línea árbol */}
                                  <div className="cat-tree-line">
                                    <div className="cat-tree-vert" style={{ height: idx === children.length - 1 ? '50%' : '100%' }} />
                                    <div className="cat-tree-horiz" />
                                  </div>
                                  <div className="settings-row-icon" style={{ background: `${child.color || '#8A8A8A'}18`, borderRadius: 8, fontSize: 15, minWidth: 32, height: 32 }}>{child.emoji || '📦'}</div>
                                  <div className="settings-row-info">
                                    <div className="settings-row-label" style={{ fontSize: 13 }}>
                                    {catSearch && child.name.toLowerCase().includes(catSearch.toLowerCase())
                                      ? <HighlightText text={child.name} query={catSearch} />
                                      : child.name}
                                  </div>
                                    <div className="settings-row-sub" style={{ fontSize: 11 }}>
                                      <TipoBadge tipo={child.tipo} style={{ marginRight: 6, fontSize: 10 }} />
                                      {child.budget ? `${child.budget} € / mes` : 'Sin límite'}
                                    </div>
                                  </div>
                                  <div className="settings-row-control">
                                    <button className="cat-edit-btn" style={{ fontSize: 12 }} onClick={() => { setEditingCat(child); setShowCatModal(true) }}>✏️ Editar</button>
                                  </div>
                                </div>
                              ))}
                              {/* botón inline para añadir otra sub */}
                              <div className="cat-child-add-row">
                                <div className="cat-tree-line"><div className="cat-tree-vert" style={{ height: 0 }} /><div className="cat-tree-horiz" /></div>
                                <button
                                  className="cat-add-sub-inline"
                                  onClick={() => { setEditingCat({ parent_id: cat.id }); setShowCatModal(true); setExpandedCats(prev => new Set([...prev, cat.id])) }}
                                >+ Añadir subcategoría</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {/* Huérfanas (padre eliminado) */}
                    {uniqueCategories.filter(c => c.parent_id && !uniqueCategories.find(p => p.id === c.parent_id)).map(cat => (
                      <div key={cat.id} className="settings-row" style={{ cursor: 'default' }}>
                        <div style={{ width: 20 }} />
                        <div className="settings-row-icon" style={{ background: `${cat.color || '#8A8A8A'}18`, borderRadius: 10, fontSize: 18 }}>{cat.emoji || '📦'}</div>
                        <div className="settings-row-info">
                          <div className="settings-row-label">{cat.name} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>(sin padre)</span></div>
                          <div className="settings-row-sub">
                            <span className="inline-badge" style={{ background: cat.tipo === 'Fijo' ? 'rgba(46,184,122,0.1)' : 'rgba(184,125,0,0.1)', color: cat.tipo === 'Fijo' ? 'var(--acento)' : 'var(--aviso)', marginRight: 6 }}>{cat.tipo || 'Variable'}</span>
                            {cat.budget ? `${cat.budget} € / mes` : 'Sin límite'}
                          </div>
                        </div>
                        <div className="settings-row-control">
                          <button className="cat-edit-btn" onClick={() => { setEditingCat(cat); setShowCatModal(true) }}>✏️ Editar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {uniqueCategories.length > 0 && (
                <div className="danger-zone">
                  <div className="danger-zone-header">
                    <span className="danger-zone-title">Zona de peligro</span>
                  </div>
                  <div className="danger-row">
                    <div className="danger-row-info">
                      <div className="danger-row-label">Eliminar todas las categorías</div>
                      <div className="danger-row-sub">
                        Borra las {uniqueCategories.length} categorías configuradas. No se puede deshacer.
                      </div>
                    </div>
                    <button
                      className="danger-btn"
                      style={confirmDeleteAll ? { background: 'var(--alerta)', color: '#fff', minWidth: 160 } : { minWidth: 160 }}
                      onClick={handleDeleteAllCats}
                      disabled={deletingAll}
                      onBlur={() => setConfirmDeleteAll(false)}
                    >
                      {deletingAll ? 'Eliminando...' : confirmDeleteAll ? '¿Seguro? Pulsa de nuevo' : '🗑 Eliminar todo'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRESUPUESTOS */}
          {activePane === 'presupuestos' && (() => {
            const spendingRows  = budgetRows.filter(r => r.tipo !== 'Ingreso')
            const ingresoRows   = budgetRows.filter(r => r.tipo === 'Ingreso')
            const fixedRows     = spendingRows.filter(r => r.tipo === 'Fijo')
            const variableRows  = spendingRows.filter(r => r.tipo !== 'Fijo')

            const BudgetRow = ({ r }) => {
              const editedBudget = budgetEdits[r.id] !== undefined ? budgetEdits[r.id] : r.budget
              const pct = editedBudget > 0 ? Math.min((r.real / editedBudget) * 100, 100) : 0
              const isOver = editedBudget > 0 && r.real > editedBudget
              const isWarn = editedBudget > 0 && r.real >= editedBudget * 0.8 && !isOver
              const barColor = isOver ? 'var(--alerta)' : isWarn ? 'var(--aviso)' : r.dot
              const statusBg = isOver ? 'rgba(255,59,48,0.08)' : isWarn ? 'rgba(255,184,48,0.08)' : 'transparent'

              return (
                <div className="brow" style={{ background: statusBg }}>
                  <div className="brow-top">
                    <div className="brow-left">
                      <div className="brow-dot" style={{ background: r.dot }} />
                      <div className="brow-name-wrap">
                        <span className="brow-name">{r.cat}</span>
                        {r.childCount > 0 && <span className="brow-sub-count">+{r.childCount} subcategorías</span>}
                      </div>
                    </div>
                    <div className="brow-right">
                      {r.tipo !== 'Ingreso' && (
                        <>
                          <div className="brow-real-wrap">
                            <span className="brow-real" style={{ color: isOver ? 'var(--alerta)' : isWarn ? 'var(--aviso)' : 'var(--text-primary)' }}>
                              {fmt(Math.round(r.real))} €
                            </span>
                            {editedBudget > 0 && (
                              <span className="brow-of">/ {fmt(editedBudget)} €</span>
                            )}
                          </div>
                          {isOver && <span className="brow-badge over">+{fmt(Math.round(r.real - editedBudget))} €</span>}
                          {isWarn && !isOver && <span className="brow-badge warn">{Math.round(pct)}%</span>}
                          {!isOver && !isWarn && editedBudget > 0 && <span className="brow-badge ok">{Math.round(pct)}%</span>}
                        </>
                      )}
                      {r.tipo === 'Ingreso' && (
                        <span className="brow-real" style={{ color: 'var(--text-muted)' }}>{fmt(Math.round(r.real))} €</span>
                      )}
                      <div className="brow-input-wrap">
                        {r.tipo !== 'Ingreso' ? (
                          <>
                            <input
                              className="brow-input"
                              type="number"
                              placeholder="∞"
                              value={budgetEdits[r.id] !== undefined ? budgetEdits[r.id] : (r.budget || '')}
                              onChange={e => setBudgetEdits(prev => ({ ...prev, [r.id]: +e.target.value }))}
                            />
                            <span className="brow-input-suffix">€/mes</span>
                          </>
                        ) : (
                          <span className="brow-input-none">sin límite</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {r.tipo !== 'Ingreso' && editedBudget > 0 && (
                    <div className="brow-bar-track">
                      <div className="brow-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  )}
                  {r.tipo !== 'Ingreso' && !editedBudget && (
                    <div className="brow-bar-track">
                      <div className="brow-bar-fill brow-bar-empty" style={{ width: `${r.real > 0 ? 30 : 0}%` }} />
                    </div>
                  )}
                </div>
              )
            }

            const GroupSection = ({ title, icon, rows, color }) => rows.length === 0 ? null : (
              <div className="budget-group">
                <div className="budget-group-header">
                  <span className="budget-group-icon" style={{ color }}>{icon}</span>
                  <span className="budget-group-title">{title}</span>
                  <span className="budget-group-count">{rows.length}</span>
                  <div className="budget-group-line" />
                </div>
                <div className="budget-group-rows">
                  {rows.map(r => <BudgetRow key={r.id} r={r} />)}
                </div>
              </div>
            )

            return (
              <div className="settings-pane" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Summary strip */}
                {budgetRows.length > 0 && (
                  <div className="budget-summary-strip">
                    <div className="bss-item">
                      <div className="bss-label">Presupuestado</div>
                      <div className="bss-value">{fmt(Math.round(totalBudget))} €</div>
                    </div>
                    <div className="bss-divider" />
                    <div className="bss-item">
                      <div className="bss-label">Gastado ({monthName})</div>
                      <div className="bss-value" style={{ color: totalDev > 0 ? 'var(--alerta)' : 'inherit' }}>{fmt(Math.round(totalReal))} €</div>
                    </div>
                    <div className="bss-divider" />
                    <div className="bss-item">
                      <div className="bss-label">Desviación</div>
                      <div className="bss-value" style={{ color: totalDev > 0 ? 'var(--alerta)' : 'var(--acento)' }}>
                        {totalDev > 0 ? '+' : ''}{fmt(Math.round(totalDev))} €
                      </div>
                    </div>
                    <div className="bss-divider" />
                    <div className="bss-item">
                      <div className="bss-label">Sin límite</div>
                      <div className="bss-value">{budgetRows.filter(r => !r.budget && r.tipo !== 'Ingreso').length} cat.</div>
                    </div>
                  </div>
                )}

                <div className="settings-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 12px' }}>
                    <SectionHeader icon="🎯" iconBg="rgba(46,184,122,0.1)" title="Presupuestos por categoría" desc="Límite mensual para alertas y seguimiento" />
                    {Object.keys(budgetEdits).length > 0 && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setBudgetEdits({})}>Cancelar</button>
                        <button className="btn-primary" style={{ fontSize: 13 }} onClick={handleSaveBudgets} disabled={saving}>
                          {saving ? 'Guardando...' : `Guardar ${Object.keys(budgetEdits).length} cambio${Object.keys(budgetEdits).length !== 1 ? 's' : ''}`}
                        </button>
                      </div>
                    )}
                  </div>

                  {budgetRows.length === 0 ? (
                    <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      Sin categorías configuradas. Crea una en <strong>Ajustes → Categorías</strong>.
                    </div>
                  ) : (
                    <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <GroupSection title="Gastos fijos" icon="📌" rows={fixedRows} color="var(--acento)" />
                      <GroupSection title="Gastos variables" icon="💸" rows={variableRows} color="var(--aviso)" />
                      <GroupSection title="Ingresos" icon="💰" rows={ingresoRows} color="#0B7A9E" />
                    </div>
                  )}
                </div>
              </div>
            )
          })()}

          {/* NOTIFICACIONES */}
          {activePane === 'notificaciones' && (
            <div className="settings-pane">
              <div className="settings-section">
                <SectionHeader icon="🔔" iconBg="rgba(90,79,200,0.1)" title="Notificaciones" desc="Qué te contamos y cuándo" />
                <SettingsRow icon="🚨" label="Alertas críticas de presupuesto" sub="Cuando superas el límite de una categoría">
                  <ToggleSwitch initial={true} />
                </SettingsRow>
                <SettingsRow icon="⚠️" label="Avisos preventivos" sub="Cuando llegas al 80% del presupuesto de una categoría">
                  <ToggleSwitch initial={true} />
                </SettingsRow>
                <SettingsRow icon="📅" label="Cobros recurrentes" sub="Aviso antes de cada cargo automático detectado">
                  <ToggleSwitch initial={true} />
                </SettingsRow>
                <SettingsRow icon="💡" label="Sugerencia semanal de ahorro" sub="Una acción concreta cada semana basada en tus datos">
                  <ToggleSwitch initial={true} />
                </SettingsRow>
                <SettingsRow icon="📊" label="Resumen mensual" sub="Al cerrar cada mes, un resumen de cómo ha ido">
                  <ToggleSwitch initial={true} />
                </SettingsRow>
              </div>
            </div>
          )}

          {/* APARIENCIA */}
          {activePane === 'apariencia' && (
            <div className="settings-pane">
              <div className="settings-section">
                <SectionHeader icon="🎨" iconBg="rgba(46,184,122,0.1)" title="Apariencia" desc="Tema y paleta de la interfaz" />
                <SettingsRow icon="🌓" label="Modo de color" sub="Claro, oscuro o automático según el sistema">
                  <div className="chip-selector">
                    <button className="chip" onClick={() => document.documentElement.setAttribute('data-theme','light')}>Claro</button>
                    <button className="chip" onClick={() => document.documentElement.setAttribute('data-theme','dark')}>Oscuro</button>
                    <button className="chip" onClick={() => {
                      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
                      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
                    }}>Sistema</button>
                  </div>
                </SettingsRow>
              </div>
            </div>
          )}

          {/* DATOS */}
          {activePane === 'datos' && (
            <div className="settings-pane">
              <div className="settings-section">
                <SectionHeader icon="📦" iconBg="rgba(26,127,160,0.1)" title="Tus datos" desc="Resumen de lo que finio tiene almacenado" />
                <SettingsRow icon="📊" label="Movimientos importados" sub="Total de transacciones en tu cuenta">
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: 'var(--text-secondary)' }}>{transactions.length}</span>
                </SettingsRow>
                <SettingsRow icon="📁" label="Categorías configuradas">
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: 'var(--text-secondary)' }}>{categories.length}</span>
                </SettingsRow>
                <SettingsRow icon="💶" label="Ingreso configurado">
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: 'var(--text-secondary)' }}>{fmt(income)} €</span>
                </SettingsRow>
              </div>
              <div className="settings-section">
                <SectionHeader icon="📥" iconBg="rgba(46,184,122,0.1)" title="Importar datos" desc="Importa un extracto bancario para añadir movimientos" />
                <SettingsRow icon="📁" label="Importar desde CSV / Excel" sub="Sube tu extracto bancario y finio lo procesa automáticamente">
                  <button className="btn-primary" onClick={() => navigate('/importar')}>Importar extracto</button>
                </SettingsRow>
              </div>
            </div>
          )}

          {/* CUENTA */}
          {activePane === 'cuenta' && (
            <div className="settings-pane">
              <div className="settings-section">
                <SectionHeader icon="🔐" iconBg="rgba(90,79,200,0.1)" title="Cuenta" desc="Información de tu cuenta y sesión" />
                <SettingsRow icon="✉️" label="Email de la cuenta" sub="Vinculado al inicio de sesión">
                  <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, color: 'var(--text-secondary)' }}>{user?.email || '—'}</span>
                </SettingsRow>
                <SettingsRow icon="🔑" label="Cerrar sesión" sub="Cierra la sesión actual en este dispositivo">
                  <button className="btn-secondary" onClick={signOut}>Cerrar sesión</button>
                </SettingsRow>
              </div>
              <div className="danger-zone">
                <div className="danger-zone-header">
                  <span className="danger-zone-title">Zona de peligro</span>
                </div>
                <div className="danger-row">
                  <div className="danger-row-info">
                    <div className="danger-row-label">Eliminar todos los movimientos</div>
                    <div className="danger-row-sub">Borra todo el historial importado. No se puede deshacer.</div>
                  </div>
                  <button className="danger-btn">Eliminar historial</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCatModal && (
        <CatEditModal
          cat={editingCat}
          categories={uniqueCategories}
          childCategories={editingCat?.id ? uniqueCategories.filter(c => c.parent_id === editingCat.id) : []}
          onSave={handleSaveCat}
          onDelete={handleDeleteCat}
          onClose={() => { setShowCatModal(false); setEditingCat(null) }}
        />
      )}
      {showImportModal && (
        <CatImportModal
          existingNames={existingCatNames}
          onImport={handleImportCats}
          onClose={() => setShowImportModal(false)}
        />
      )}
      {bulkSubParent && (
        <BulkSubModal
          parent={bulkSubParent}
          existingNames={existingCatNames}
          onImport={handleImportCats}
          onClose={() => setBulkSubParent(null)}
        />
      )}
    </div>
  )
}
