import { useState, useMemo, useRef, useEffect } from 'react'
import { useData } from '../../contexts/DataContext'

function fmt(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

const EMOJI_GROUPS = [
  { label: '🏠 Hogar', emojis: ['🏠','🏡','🛋️','🪑','🛏️','🚿','🪣','🧹','🧺','🧼','💡','🔌','🪟','🚪','🏗️','🔧','🪛','🧰'] },
  { label: '🍔 Comida', emojis: ['🍔','🍕','🌮','🍣','🥗','🍜','🥘','🍱','🥩','🍗','🥐','🧃','☕','🍺','🍷','🥂','🍸','🧋','🍦','🛒','🛍️'] },
  { label: '🐾 Mascotas', emojis: ['🐶','🐱','🐰','🐹','🦜','🐠','🦮','🐕','🐈','🐾','🦴','🎾','🪮','💉','🩺'] },
  { label: '🚗 Transporte', emojis: ['🚗','🚕','🚌','🚇','🚲','🛵','✈️','🚢','🚂','🏍️','⛽','🅿️','🛣️','🚦','🚙','🛺','🚁'] },
  { label: '💆 Salud', emojis: ['💊','🏥','🩺','🩹','🧬','💉','🦷','👁️','🧘','🏋️','🤸','🚑','🌡️','🩻','💆','🛁'] },
  { label: '🎉 Ocio', emojis: ['🎉','🎭','🎬','🎵','🎸','🎮','🎲','🎯','🏆','⚽','🎾','🏊','🧗','🎪','🎨','🖼️','🎤','🎧','🎠','🎡'] },
  { label: '👗 Ropa', emojis: ['👗','👔','👠','👟','👜','💍','💄','🧴','💅','💇','🛍️','🧣','🧤','🧢','👒','🎒'] },
  { label: '📚 Educación', emojis: ['📚','🎓','✏️','📖','🖊️','🏫','🔬','🧪','💻','🖥️','📐','📏','🗂️','📝','🎒'] },
  { label: '💰 Finanzas', emojis: ['💰','💳','🏦','📈','📉','💸','🪙','💵','💶','🏧','📊','🧾','💹','🤑','🔐','🏛️'] },
  { label: '🐕 Servicios', emojis: ['📱','📺','🌐','☁️','🔒','📡','🖨️','📞','📠','🔔','📬','🏢','⚙️','🔑','🛡️'] },
  { label: '👨‍👩‍👧 Familia', emojis: ['👨‍👩‍👧','👶','🧒','👦','👧','👩','👨','🧓','👴','👵','💝','🎁','🎂','💐','🏠'] },
  { label: '✈️ Viajes', emojis: ['✈️','🧳','🏖️','🏔️','🗺️','🌍','🛂','🏨','🗼','🎡','📸','🌅','⛺','🚢','🎠'] },
  { label: '💼 Trabajo', emojis: ['💼','🖥️','📊','📋','🗂️','📎','🖊️','📧','📞','🏢','🤝','📌','🗓️','⏰','🔨'] },
  { label: '🐕‍🦺 Otros', emojis: ['📦','⭐','🌟','✅','❓','🔖','🏷️','🎀','🎗️','💫','🌈','🌙','☀️','⚡','🔥','💧','🌿','🍀'] },
]
const EMOJIS = EMOJI_GROUPS.flatMap(g => g.emojis)
const COLORS = ['#FF6B5B','#72E4A5','#2EB87A','#FFB830','#4FC9EF','#9B8FFF','#D4F5E2','#8A8A8A','#FF9500','#FF2D55','#5856D6','#34AADC','#4CD964','#FF3B30','#007AFF']

/* ── PACKS DE CATEGORÍAS ─────────────────────────────────────────── */
const PACKS = [
  {
    id: 'basico',
    name: 'Pack Básico',
    emoji: '⭐',
    color: '#2EB87A',
    desc: 'Las categorías esenciales para empezar a controlar tus gastos del día a día.',
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
    id: 'completo',
    name: 'Pack Completo',
    emoji: '🗂️',
    color: '#5856D6',
    desc: 'Categorización detallada para un control fino de todos tus gastos.',
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
      { name: 'Cuidado personal', emoji: '💆', color: '#FF2D55', budget: 50, tipo: 'Variable' },
      { name: 'Streaming', emoji: '📺', color: '#9B8FFF', budget: 50, tipo: 'Fijo' },
      { name: 'Software y apps', emoji: '📱', color: '#5856D6', budget: 30, tipo: 'Fijo' },
      { name: 'Alquiler / hipoteca', emoji: '🏠', color: '#8A8A8A', budget: 850, tipo: 'Fijo' },
      { name: 'Suministros', emoji: '💡', color: '#FFB830', budget: 100, tipo: 'Fijo' },
      { name: 'Seguros', emoji: '🛡️', color: '#007AFF', budget: 60, tipo: 'Fijo' },
      { name: 'Mascotas', emoji: '🐶', color: '#FF9500', budget: 80, tipo: 'Variable' },
      { name: 'Regalos', emoji: '🎁', color: '#FF2D55', budget: 50, tipo: 'Variable' },
      { name: 'Otros', emoji: '📦', color: '#8A8A8A', budget: null, tipo: 'Variable' },
    ],
  },
  {
    id: 'autonomo',
    name: 'Pack Autónomo / Freelance',
    emoji: '💼',
    color: '#FF9500',
    desc: 'Pensado para trabajadores por cuenta propia: separa gastos personales y profesionales.',
    categories: [
      { name: 'Herramientas y software', emoji: '🛠️', color: '#5856D6', budget: 80, tipo: 'Fijo' },
      { name: 'Marketing y publicidad', emoji: '📣', color: '#FF9500', budget: 100, tipo: 'Variable' },
      { name: 'Formación y cursos', emoji: '🎓', color: '#4FC9EF', budget: 60, tipo: 'Variable' },
      { name: 'Material de oficina', emoji: '🖊️', color: '#8A8A8A', budget: 30, tipo: 'Variable' },
      { name: 'Gestoría y asesoría', emoji: '📋', color: '#34AADC', budget: 80, tipo: 'Fijo' },
      { name: 'Equipamiento tech', emoji: '💻', color: '#007AFF', budget: 200, tipo: 'Variable' },
      { name: 'Networking y eventos', emoji: '🤝', color: '#4CD964', budget: 50, tipo: 'Variable' },
      { name: 'Comidas de trabajo', emoji: '🍽️', color: '#FF6B5B', budget: 100, tipo: 'Variable' },
      { name: 'Transporte profesional', emoji: '🚗', color: '#2EB87A', budget: 80, tipo: 'Variable' },
      { name: 'Alquiler oficina / coworking', emoji: '🏢', color: '#8A8A8A', budget: 200, tipo: 'Fijo' },
      { name: 'Supermercado', emoji: '🛒', color: '#72E4A5', budget: 300, tipo: 'Variable' },
      { name: 'Ocio personal', emoji: '🎉', color: '#FFB830', budget: 80, tipo: 'Variable' },
      { name: 'Salud', emoji: '💊', color: '#4FC9EF', budget: 60, tipo: 'Variable' },
      { name: 'Hogar', emoji: '🏠', color: '#8A8A8A', budget: 850, tipo: 'Fijo' },
    ],
  },
  {
    id: 'familiar',
    name: 'Pack Familiar',
    emoji: '👨‍👩‍👧',
    color: '#FF2D55',
    desc: 'Diseñado para hogares con hijos: cubre escuela, actividades y gastos compartidos.',
    categories: [
      { name: 'Supermercado', emoji: '🛒', color: '#72E4A5', budget: 500, tipo: 'Variable' },
      { name: 'Restaurantes y comida', emoji: '🍔', color: '#FF6B5B', budget: 150, tipo: 'Variable' },
      { name: 'Colegio y material', emoji: '📚', color: '#4FC9EF', budget: 100, tipo: 'Variable' },
      { name: 'Actividades extraescolares', emoji: '🎨', color: '#FF9500', budget: 120, tipo: 'Fijo' },
      { name: 'Ropa y calzado familia', emoji: '👗', color: '#FF2D55', budget: 100, tipo: 'Variable' },
      { name: 'Salud y farmacia', emoji: '💊', color: '#4FC9EF', budget: 100, tipo: 'Variable' },
      { name: 'Juguetes y ocio infantil', emoji: '🧸', color: '#FFB830', budget: 60, tipo: 'Variable' },
      { name: 'Ocio familiar', emoji: '🎉', color: '#4CD964', budget: 120, tipo: 'Variable' },
      { name: 'Transporte', emoji: '🚗', color: '#2EB87A', budget: 100, tipo: 'Variable' },
      { name: 'Alquiler / hipoteca', emoji: '🏠', color: '#8A8A8A', budget: 1000, tipo: 'Fijo' },
      { name: 'Suministros', emoji: '💡', color: '#FFB830', budget: 150, tipo: 'Fijo' },
      { name: 'Suscripciones', emoji: '📺', color: '#9B8FFF', budget: 60, tipo: 'Fijo' },
      { name: 'Seguros familia', emoji: '🛡️', color: '#007AFF', budget: 100, tipo: 'Fijo' },
      { name: 'Ahorro / fondo emergencia', emoji: '🏦', color: '#2EB87A', budget: 200, tipo: 'Variable' },
      { name: 'Mascotas', emoji: '🐶', color: '#FF9500', budget: 60, tipo: 'Variable' },
      { name: 'Otros', emoji: '📦', color: '#8A8A8A', budget: null, tipo: 'Variable' },
    ],
  },
]

function ImportModal({ existingNames, onImport, onClose }) {
  const [selected, setSelected] = useState(null)
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState(false)
  const [csvError, setCsvError] = useState('')
  const fileRef = useRef()

  const pack = PACKS.find(p => p.id === selected)
  const alreadyExists = pack ? pack.categories.filter(c => existingNames.includes(c.name.toLowerCase())) : []
  const toImport = pack ? pack.categories.filter(c => !existingNames.includes(c.name.toLowerCase())) : []

  const handleImportPack = async () => {
    if (!toImport.length) return
    setImporting(true)
    await onImport(toImport)
    setImporting(false)
    onClose()
  }

  const handleCSV = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setCsvError('')
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const lines = ev.target.result.split('\n').filter(l => l.trim())
        // Expected format: nombre,emoji,color,presupuesto,tipo
        const cats = lines.slice(1).map(line => {
          const [name, emoji, color, budget, tipo] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''))
          if (!name) return null
          return {
            name,
            emoji: emoji || '📦',
            color: color || '#8A8A8A',
            budget: budget ? +budget : null,
            tipo: tipo || 'Variable',
          }
        }).filter(Boolean).filter(c => !existingNames.includes(c.name.toLowerCase()))

        if (!cats.length) { setCsvError('No se encontraron categorías nuevas en el CSV.'); return }
        setImporting(true)
        await onImport(cats)
        setImporting(false)
        onClose()
      } catch {
        setCsvError('Error al leer el archivo. Comprueba el formato.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="cat-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cat-modal" style={{ maxWidth: 640 }}>
        <div className="cat-modal-header">
          <div className="cat-modal-title">📥 Importar categorías</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="cat-modal-body">
          {!preview ? (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Elige un pack predefinido o sube un CSV con tus propias categorías. Las que ya tienes no se duplicarán.
              </div>

              {/* Packs grid */}
              <div className="import-packs-grid">
                {PACKS.map(p => {
                  const existing = p.categories.filter(c => existingNames.includes(c.name.toLowerCase())).length
                  const news = p.categories.length - existing
                  const isSelected = selected === p.id
                  return (
                    <div
                      key={p.id}
                      className={`import-pack-card${isSelected ? ' selected' : ''}`}
                      style={isSelected ? { borderColor: p.color, background: `${p.color}08` } : undefined}
                      onClick={() => setSelected(isSelected ? null : p.id)}
                    >
                      <div className="import-pack-top">
                        <div className="import-pack-emoji" style={{ background: `${p.color}15` }}>{p.emoji}</div>
                        <div className="import-pack-check" style={isSelected ? { background: p.color } : undefined}>
                          {isSelected && '✓'}
                        </div>
                      </div>
                      <div className="import-pack-name">{p.name}</div>
                      <div className="import-pack-desc">{p.desc}</div>
                      <div className="import-pack-meta">
                        <span style={{ color: p.color }}>{p.categories.length} categorías</span>
                        {existing > 0 && <span style={{ color: 'var(--text-muted)' }}> · {existing} ya existen</span>}
                        {news > 0 && existing > 0 && <span style={{ color: 'var(--acento)' }}> · {news} nuevas</span>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Selected pack preview */}
              {pack && (
                <div className="import-preview-list">
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                    Categorías del pack
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {pack.categories.map((c, i) => {
                      const exists = existingNames.includes(c.name.toLowerCase())
                      return (
                        <span key={i} className="import-cat-tag" style={{
                          background: exists ? 'var(--bg-surface2)' : `${c.color}18`,
                          border: `1px solid ${exists ? 'var(--border)' : c.color}40`,
                          color: exists ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: exists ? 'line-through' : 'none',
                        }}>
                          {c.emoji} {c.name} {c.budget ? `· ${fmt(c.budget)}€` : ''}
                        </span>
                      )
                    })}
                  </div>
                  {alreadyExists.length > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                      Las categorías tachadas ya existen y se omitirán.
                    </div>
                  )}
                </div>
              )}

              {/* CSV divider */}
              <div className="import-divider">
                <div className="import-divider-line" />
                <span className="import-divider-text">o importa tu propio listado</span>
                <div className="import-divider-line" />
              </div>

              {/* CSV upload */}
              <div className="import-csv-zone" onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
                <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Sube un CSV con tus categorías
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Formato: <code style={{ fontFamily: "'DM Mono',monospace", background: 'var(--bg-surface2)', padding: '1px 5px', borderRadius: 4 }}>nombre, emoji, color, presupuesto, tipo</code>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Ejemplo: <code style={{ fontFamily: "'DM Mono',monospace" }}>Gimnasio, 🏋️, #4CD964, 40, Fijo</code>
                </div>
                {csvError && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--alerta)' }}>{csvError}</div>}
              </div>
            </>
          ) : null}
        </div>

        <div className="cat-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <div style={{ flex: 1 }} />
          {pack && (
            <button className="btn-primary" onClick={handleImportPack} disabled={importing || toImport.length === 0}>
              {importing ? 'Importando...' : toImport.length === 0 ? 'Ya tienes todas estas categorías' : `Importar ${toImport.length} categorías →`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function EditModal({ cat, categories, onSave, onDelete, onClose }) {
  const [name, setName] = useState(cat?.name || '')
  const [emoji, setEmoji] = useState(cat?.emoji || '📦')
  const [color, setColor] = useState(cat?.color || '#8A8A8A')
  const [emojiSearch, setEmojiSearch] = useState('')
  const [budget, setBudget] = useState(cat?.budget || '')
  const [tipo, setTipo] = useState(cat?.tipo || 'Variable')
  const [parentId, setParentId] = useState(cat?.parent_id || '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isNew = !cat?.id

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    await onSave({
      name: name.trim(),
      emoji,
      color,
      budget: budget ? +budget : null,
      tipo,
      parent_id: parentId || null,
    })
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

  // Exclude self and children from parent options
  const parentOptions = categories.filter(c => c.id !== cat?.id && c.parent_id !== cat?.id)

  return (
    <div className="cat-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cat-modal">
        <div className="cat-modal-header">
          <div className="cat-modal-title">{isNew ? 'Nueva categoría' : 'Editar categoría'}</div>
          <button className="cat-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="cat-modal-body">
          {/* Emoji picker */}
          <div className="cat-field">
            <label className="cat-field-label">Icono</label>
            {/* Selected + search */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0, border: `2px solid ${color}40` }}>
                {emoji}
              </div>
              <input
                type="text"
                placeholder="Buscar emoji... (comida, casa, perro...)"
                value={emojiSearch}
                onChange={e => setEmojiSearch(e.target.value)}
                style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: 12 }}
              />
            </div>
            {/* Groups */}
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, padding: '6px 4px' }}>
              {(emojiSearch
                ? [{ label: '🔍 Resultados', emojis: EMOJIS.filter(e => {
                    const q = emojiSearch.toLowerCase()
                    return EMOJI_GROUPS.find(g => g.emojis.includes(e))?.label.toLowerCase().includes(q) || e.includes(emojiSearch)
                  })}]
                : EMOJI_GROUPS
              ).map(group => group.emojis.length === 0 ? null : (
                <div key={group.label} style={{ marginBottom: 6 }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '2px 8px 4px' }}>
                    {group.label}
                  </div>
                  <div className="cat-emoji-grid">
                    {group.emojis.map(e => (
                      <button key={e} className={`cat-emoji-btn${emoji === e ? ' selected' : ''}`} onClick={() => setEmoji(e)}>{e}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="cat-field">
            <label className="cat-field-label">Nombre <span style={{ color: 'var(--acento)' }}>*</span></label>
            <input
              className="cat-field-input"
              type="text"
              placeholder="Ej: Comida, Transporte..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Color */}
          <div className="cat-field">
            <label className="cat-field-label">Color</label>
            <div className="cat-color-row">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`cat-color-btn${color === c ? ' selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          {/* Tipo */}
          <div className="cat-field">
            <label className="cat-field-label">Tipo</label>
            <div className="chip-selector">
              <button className={`chip${tipo === 'Variable' ? ' selected' : ''}`} onClick={() => setTipo('Variable')}>Variable</button>
              <button className={`chip${tipo === 'Fijo' ? ' selected' : ''}`} onClick={() => setTipo('Fijo')}>Fijo</button>
            </div>
          </div>

          {/* Budget */}
          <div className="cat-field">
            <label className="cat-field-label">Presupuesto mensual</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="cat-field-input"
                type="number"
                placeholder="Sin límite"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                style={{ width: 140 }}
              />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>€ / mes</span>
            </div>
          </div>

          {/* Parent category */}
          <div className="cat-field">
            <label className="cat-field-label">Categoría padre <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>(opcional — convierte esta en subcategoría)</span></label>
            <select
              className="cat-field-select"
              value={parentId}
              onChange={e => setParentId(e.target.value)}
            >
              <option value="">Sin categoría padre (principal)</option>
              {parentOptions.filter(c => !c.parent_id).map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="cat-modal-footer">
          {!isNew && (
            <button
              className="cat-delete-btn"
              onClick={handleDelete}
              style={confirmDelete ? { background: 'var(--alerta)', color: '#fff' } : undefined}
            >
              {confirmDelete ? '¿Seguro? Pulsa de nuevo' : '🗑 Eliminar'}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Guardando...' : isNew ? 'Crear categoría' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Categorias() {
  const { categories, spendingByCategory, loading, addCategory, updateCategory, deleteCategory } = useData()
  const [view, setView] = useState('grid')
  const [editingCat, setEditingCat] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)   // id pendiente de confirmar
  const [deletingId, setDeletingId] = useState(null)

  // Cancelar confirmación si el usuario hace clic en otro sitio
  useEffect(() => {
    if (!confirmDeleteId) return
    const handler = () => setConfirmDeleteId(null)
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [confirmDeleteId])

  // Deduplicate by name (keep first occurrence = oldest)
  const uniqueCategories = useMemo(() => {
    const seen = new Set()
    return categories.filter(c => {
      const key = c.name.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [categories])

  // Separate parents and children
  const parentCats = useMemo(() => uniqueCategories.filter(c => !c.parent_id), [uniqueCategories])
  const childCats = useMemo(() => uniqueCategories.filter(c => !!c.parent_id), [uniqueCategories])

  const categoryRows = useMemo(() => {
    return uniqueCategories.map(c => {
      const spent = spendingByCategory[c.name] || 0
      const budget = c.budget || 0
      const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : (spent > 0 ? 100 : 0)
      const rest = budget - spent
      const fillColor = pct >= 100 ? 'var(--alerta)' : pct >= 80 ? 'var(--aviso)' : c.color || 'var(--acento)'
      const parentName = c.parent_id ? uniqueCategories.find(p => p.id === c.parent_id)?.name : null
      return { ...c, spent, pct, rest, fillColor, fillW: `${Math.min(100, pct)}%`, parentName }
    })
  }, [uniqueCategories, spendingByCategory])

  const totalBudget = categoryRows.filter(c => !c.parent_id).reduce((s, c) => s + (c.budget || 0), 0)
  const totalSpent = categoryRows.reduce((s, c) => s + c.spent, 0)
  const overBudget = categoryRows.filter(c => c.budget > 0 && c.pct >= 100).length
  const uncategorized = spendingByCategory['Otros'] || 0

  const handleOpenNew = () => { setEditingCat({}); setShowModal(true) }
  const handleOpenEdit = (cat) => { setEditingCat(cat); setShowModal(true) }
  const handleClose = () => { setShowModal(false); setEditingCat(null) }

  const handleSave = async (data) => {
    if (!editingCat?.id) {
      await addCategory(data)
    } else {
      await updateCategory(editingCat.id, data)
    }
  }

  const handleDelete = async (id) => {
    // Borrar primero los hijos (evita FK violation en Supabase)
    const children = uniqueCategories.filter(c => c.parent_id === id)
    for (const child of children) {
      await deleteCategory(child.id)
    }
    await deleteCategory(id)
  }

  // Botón 🗑 inline: primer clic pide confirmación, segundo clic borra
  const handleDeleteInline = async (e, id) => {
    e.stopPropagation()
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      return
    }
    setDeletingId(id)
    setConfirmDeleteId(null)
    await handleDelete(id)
    setDeletingId(null)
    // Si el modal estaba abierto para esta cat, cerrarlo
    if (editingCat?.id === id) handleClose()
  }

  const handleImport = async (cats) => {
    for (const c of cats) {
      await addCategory(c)
    }
  }

  const existingNames = useMemo(() => uniqueCategories.map(c => c.name.toLowerCase()), [uniqueCategories])

  if (loading) return <div className="auth-loading"><div className="auth-spinner"></div></div>

  return (
    <div>
      {/* Summary */}
      <div className="cat-summary-row">
        <div className="cat-summary-card">
          <div className="cat-summary-label">Categorías activas</div>
          <div className="cat-summary-value">{parentCats.length}</div>
          <div className="cat-summary-sub">{childCats.length > 0 ? `+ ${childCats.length} subcategorías` : 'sin subcategorías'}</div>
        </div>
        <div className="cat-summary-card">
          <div className="cat-summary-label">Presupuesto total</div>
          <div className="cat-summary-value">{fmt(totalBudget)} €</div>
          <div className="cat-summary-sub">mensual configurado</div>
        </div>
        <div className="cat-summary-card">
          <div className="cat-summary-label">Categorías en límite</div>
          <div className="cat-summary-value" style={overBudget > 0 ? { color: 'var(--alerta)' } : undefined}>{overBudget}</div>
          <div className="cat-summary-sub">{overBudget > 0 ? categoryRows.filter(c => c.pct >= 100).map(c => c.name).join(' · ') : 'Todas bajo control'}</div>
        </div>
        <div className="cat-summary-card">
          <div className="cat-summary-label">Gasto sin categoría</div>
          <div className="cat-summary-value" style={uncategorized > 0 ? { color: 'var(--aviso)' } : undefined}>{fmt(uncategorized)} €</div>
          <div className="cat-summary-sub">{uncategorized > 0 ? 'Revisa y categoriza' : 'Todo categorizado ✓'}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="cat-view-controls">
        <button className={`cat-view-btn${view === 'grid' ? ' active' : ''}`} onClick={() => setView('grid')}>⊞ Cuadrícula</button>
        <button className={`cat-view-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}>☰ Lista</button>
        <div style={{ flex: 1 }} />
        <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => setShowImport(true)}>📥 Importar pack</button>
        <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={handleOpenNew}>+ Nueva categoría</button>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div>
          {/* Parent categories */}
          <div className="cat-grid-view">
            {categoryRows.filter(c => !c.parent_id).map((c) => {
              const subs = categoryRows.filter(s => s.parent_id === c.id)
              return (
                <div key={c.id} className="cat-card" onClick={() => handleOpenEdit(c)}>
                  <div className="cat-card-top">
                    <div className="cat-card-icon" style={{ background: `${c.color || '#8A8A8A'}20` }}>{c.emoji}</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="cat-card-menu" title="Editar" onClick={e => { e.stopPropagation(); handleOpenEdit(c) }}>✏️</button>
                      <button
                        className="cat-card-menu"
                        title="Eliminar"
                        onClick={e => handleDeleteInline(e, c.id)}
                        disabled={deletingId === c.id}
                        style={{
                          background: confirmDeleteId === c.id ? 'var(--alerta)' : undefined,
                          color: confirmDeleteId === c.id ? '#fff' : 'var(--alerta)',
                          fontSize: confirmDeleteId === c.id ? 9 : 13,
                          minWidth: confirmDeleteId === c.id ? 52 : undefined,
                        }}
                      >
                        {deletingId === c.id ? '…' : confirmDeleteId === c.id ? '¿Seguro?' : '🗑'}
                      </button>
                    </div>
                  </div>
                  <div className="cat-card-body">
                    <div className="cat-card-name">{c.name}</div>
                    <div className="cat-card-type">{c.tipo || 'Variable'}{subs.length > 0 && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--text-muted)' }}>· {subs.length} sub</span>}</div>
                    <div className="cat-card-stats">
                      <div className="cat-card-spent" style={c.pct >= 100 ? { color: 'var(--alerta)' } : c.pct >= 80 ? { color: 'var(--aviso)' } : undefined}>{fmt(c.spent)} €</div>
                      <div className="cat-card-budget">límite<br/><span className="cat-card-budget-val">{c.budget > 0 ? `${fmt(c.budget)} €` : 'sin límite'}</span></div>
                    </div>
                    <div className="cat-card-bar">
                      <div className="cat-card-fill" style={{ width: c.fillW, background: c.fillColor }}></div>
                    </div>
                    <div className="cat-card-meta">
                      <span className="cat-card-ops">{c.pct > 0 ? `${c.pct}%` : '—'}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Subcategories */}
          {childCats.length > 0 && (
            <>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '16px 0 8px' }}>
                Subcategorías
              </div>
              <div className="cat-grid-view">
                {categoryRows.filter(c => !!c.parent_id).map((c) => (
                  <div key={c.id} className="cat-card sub" onClick={() => handleOpenEdit(c)} style={{ opacity: 0.85 }}>
                    <div className="cat-card-top">
                      <div className="cat-card-icon" style={{ background: `${c.color || '#8A8A8A'}20`, fontSize: 16 }}>{c.emoji}</div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--text-muted)' }}>↳ {c.parentName}</span>
                        <button
                          className="cat-card-menu"
                          title="Eliminar"
                          onClick={e => handleDeleteInline(e, c.id)}
                          disabled={deletingId === c.id}
                          style={{
                            background: confirmDeleteId === c.id ? 'var(--alerta)' : undefined,
                            color: confirmDeleteId === c.id ? '#fff' : 'var(--alerta)',
                            fontSize: confirmDeleteId === c.id ? 9 : 12,
                            minWidth: confirmDeleteId === c.id ? 52 : undefined,
                            padding: '2px 6px',
                          }}
                        >
                          {deletingId === c.id ? '…' : confirmDeleteId === c.id ? '¿Seguro?' : '🗑'}
                        </button>
                      </div>
                    </div>
                    <div className="cat-card-body">
                      <div className="cat-card-name" style={{ fontSize: 14 }}>{c.name}</div>
                      <div className="cat-card-stats">
                        <div className="cat-card-spent">{fmt(c.spent)} €</div>
                        <div className="cat-card-budget">límite<br/><span className="cat-card-budget-val">{c.budget > 0 ? `${fmt(c.budget)} €` : '—'}</span></div>
                      </div>
                      <div className="cat-card-bar">
                        <div className="cat-card-fill" style={{ width: c.fillW, background: c.fillColor }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="cat-list-view">
          <div className="panel">
            <table className="cat-full-table">
              <thead>
                <tr>
                  <th>Categoría</th><th>Tipo</th><th>Padre</th>
                  <th>Presupuesto</th><th>Gastado</th><th>Resto</th><th>Progreso</th><th></th>
                </tr>
              </thead>
              <tbody>
                {categoryRows.map((c) => (
                  <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => handleOpenEdit(c)}>
                    <td>
                      <div className="cat-name-full">
                        <div className="cat-icon-sm" style={{ background: `${c.color || '#8A8A8A'}20` }}>{c.emoji}</div>
                        <div className="cat-info-full">
                          <div className="cat-label-full">{c.parentName && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>↳ </span>}{c.name}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="inline-badge" style={{
                      background: c.tipo === 'Fijo' ? 'rgba(46,184,122,0.1)' : 'rgba(184,125,0,0.1)',
                      color: c.tipo === 'Fijo' ? 'var(--acento)' : 'var(--aviso)',
                    }}>{c.tipo || 'Variable'}</span></td>
                    <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: 'var(--text-muted)' }}>{c.parentName || '—'}</td>
                    <td>{c.budget > 0 ? `${fmt(c.budget)} €` : '—'}</td>
                    <td style={c.pct >= 100 ? { color: 'var(--alerta)', fontWeight: 600 } : undefined}>{fmt(c.spent)} €</td>
                    <td style={c.rest < 0 ? { color: 'var(--alerta)' } : undefined}>{c.budget > 0 ? `${fmt(c.rest)} €` : '—'}</td>
                    <td className="bar-cell"><div className="bar-mini"><div className="bar-mini-fill" style={{ width: c.fillW, background: c.fillColor }}></div></div></td>
                    <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button className="cat-edit-btn" onClick={e => { e.stopPropagation(); handleOpenEdit(c) }}>✏️ Editar</button>
                      <button
                        className="cat-edit-btn"
                        onClick={e => handleDeleteInline(e, c.id)}
                        disabled={deletingId === c.id}
                        style={{
                          background: confirmDeleteId === c.id ? 'var(--alerta)' : undefined,
                          color: confirmDeleteId === c.id ? '#fff' : 'var(--alerta)',
                          borderColor: 'var(--alerta)',
                          minWidth: confirmDeleteId === c.id ? 90 : 32,
                          fontSize: confirmDeleteId === c.id ? 11 : 14,
                        }}
                      >
                        {deletingId === c.id ? '…' : confirmDeleteId === c.id ? '¿Seguro?' : '🗑'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {uniqueCategories.length === 0 && (
        <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', marginTop: 16 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏷️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Sin categorías</div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>Crea tu primera categoría en Ajustes → Categorías.</div>
          <button className="btn-primary" onClick={handleOpenNew}>+ Nueva categoría</button>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          existingNames={existingNames}
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Edit / Create Modal */}
      {showModal && (
        <EditModal
          cat={editingCat}
          categories={uniqueCategories}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
