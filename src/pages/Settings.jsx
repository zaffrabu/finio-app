import { useState } from 'react'

function Section({ title, children }) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 bg-page/30">
        <h2 className="text-sm font-medium text-primary">{title}</h2>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  )
}

function Row({ label, detail, action }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-primary">{label}</p>
        {detail && <p className="text-xs text-muted mt-0.5">{detail}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

function exportCSV(transactions) {
  const header = 'Fecha,Descripción,Importe,Categoría,Tipo,Cuenta'
  const rows = transactions
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(t => [
      t.date,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.tipo || '',
      `"${(t.account || '').replace(/"/g, '""')}"`,
    ].join(','))
  const csv = [header, ...rows].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `finio-transacciones-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function CategorySettings({ cats }) {
  const { categories, addCategory, updateCategory, deleteCategory } = cats
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)

  const parentOptions = categories.filter(c => !c.parent).map(c => c.name)

  const inputCls = "w-full text-sm border border-border rounded-md px-3 py-2 bg-white text-primary focus:outline-none focus:border-tri-400 focus:ring-1 focus:ring-tri-400/20 transition-colors"
  const labelCls = "block text-xs font-medium text-secondary mb-1.5"

  function CategoryForm({ initial, onSave, onCancel, title }) {
    const [name,     setName]     = useState(initial?.name     ?? '')
    const [budget,   setBudget]   = useState(initial?.budget   ?? '')
    const [tipo,     setTipo]     = useState(initial?.tipo     ?? 'Variable')
    const [color,    setColor]    = useState(initial?.color    ?? '#185FA5')
    const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(', '))
    const [parent,   setParent]   = useState(initial?.parent   ?? '')

    return (
      <div className="space-y-4 bg-page/50 p-4 rounded-lg border border-border/60">
        <p className="text-sm font-medium text-primary">{title}</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Nombre</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Subcategoría de</label>
            <select value={parent} onChange={e => setParent(e.target.value)} className={inputCls}>
              <option value="">— Ninguna —</option>
              {parentOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <label className={labelCls}>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className={inputCls}>
              {['Fijo', 'Variable', 'Ahorro', 'Deuda', 'Ingreso'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Presupuesto (€)</label>
            <input type="number" value={budget} onChange={e => setBudget(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Palabras clave (IA)</label>
          <input value={keywords} onChange={e => setKeywords(e.target.value)} className={inputCls} placeholder="Ej: mercadona, aldi, lidl" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="text-xs px-3 py-1.5 rounded border border-border">Cancelar</button>
          <button
            onClick={() => onSave({
              name, budget: parseFloat(budget) || null, tipo, color,
              keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
              parent: parent || null
            })}
            className="text-xs px-3 py-1.5 rounded text-white"
            style={{ backgroundColor: '#185FA5' }}
          >
            Guardar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted">Personaliza cómo Finio organiza tus finanzas</p>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-sm text-tri-600 font-medium px-3 py-1 bg-tri-50 rounded-md border border-tri-200">
            + Nueva categoría
          </button>
        )}
      </div>

      {adding && (
        <CategoryForm title="Nueva categoría" onSave={cat => { addCategory(cat); setAdding(false) }} onCancel={() => setAdding(false)} />
      )}

      <div className="divide-y divide-border/40 border border-border/60 rounded-lg overflow-hidden">
        {categories.map(cat => (
          <div key={cat.id || cat.name} className="bg-white">
            {editing?.name === cat.name ? (
              <div className="p-4">
                <CategoryForm
                  initial={cat}
                  title={`Editando ${cat.name}`}
                  onSave={data => { updateCategory(cat.name, data); setEditing(null) }}
                  onCancel={() => setEditing(null)}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 hover:bg-page transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      {cat.parent && <span className="text-2xs text-muted">{cat.parent} /</span>}
                      <p className="text-sm font-medium text-primary">{cat.name}</p>
                    </div>
                    <p className="text-2xs text-muted">
                      <span className={cat.tipo === 'Ingreso' ? 'text-income-text' : ''}>{cat.tipo}</span>
                      {cat.keywords?.length > 0 && ` · ${cat.keywords.length} keywords`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditing(cat)} className="text-xs text-secondary hover:text-primary px-2 py-1 rounded hover:bg-page">Editar</button>
                  <button onClick={() => deleteCategory(cat.name)} className="text-xs text-muted hover:text-red-500 px-2 py-1 rounded hover:bg-red-50">Eliminar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Settings({ user, onSignOut, transactions, cats }) {
  const [activeTab, setActiveTab] = useState('perfil')

  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const btnCls = "text-xs font-medium px-3 py-1.5 rounded-md border transition-colors"

  const tabs = [
    { id: 'perfil', label: 'Perfil' },
    { id: 'categorias', label: 'Categorías y Subcategorías' },
    { id: 'datos', label: 'Datos y Exportar' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-medium text-primary">Ajustes</h1>
        <p className="text-sm text-muted mt-0.5">Configura tu centro de mando financiero</p>
      </div>

      <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto no-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-[2px] whitespace-nowrap ${
              activeTab === t.id ? 'border-tri-600 text-primary font-medium' : 'border-transparent text-muted hover:text-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'perfil' && (
          <Section title="Tu cuenta">
            <div className="flex items-center gap-4 mb-4 pt-2">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium flex-shrink-0 shadow-sm"
                style={{ backgroundColor: '#042C53' }}
              >
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{user?.email}</p>
                {joinedDate && <p className="text-xs text-muted mt-0.5">Miembro desde {joinedDate}</p>}
              </div>
            </div>
            <Row label="Cerrar sesión" action={
              <button onClick={onSignOut} className={btnCls} style={{ backgroundColor: '#FAECE7', color: '#993C1D', borderColor: '#F8A88C' }}>
                Salir de Finio
              </button>
            } />
          </Section>
        )}

        {activeTab === 'categorias' && (
          <Section title="Gestión de Categorías e Ingresos">
            <CategorySettings cats={cats} />
          </Section>
        )}

        {activeTab === 'datos' && (
          <Section title="Seguridad y Control de Datos">
            <Row
              label="Copia de seguridad (CSV)"
              detail="Descarga todo tu historial de transacciones para Excel"
              action={
                <button onClick={() => exportCSV(transactions)} className={btnCls} style={{ backgroundColor: '#E6F1FB', color: '#185FA5', borderColor: '#bfdbfe' }}>
                  Exportar ahora
                </button>
              }
            />
            <Row label="Nube de Datos" detail="Tus datos están sincronizados de forma segura con Supabase." />
          </Section>
        )}
      </div>
    </div>
  )
}

