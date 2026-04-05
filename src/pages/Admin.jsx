import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fmt(n) {
  return n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function StatusBadge({ status }) {
  const s = {
    active:    { bg: '#EAF3DE', color: '#0F6E56', label: 'Activo' },
    pending:   { bg: '#FAEEDA', color: '#854F0B', label: 'Pendiente' },
    cancelled: { bg: '#FAECE7', color: '#993C1D', label: 'Cancelado' },
  }[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function RoleBadge({ role }) {
  const sa = role === 'superadmin'
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
      backgroundColor: sa ? '#EFF6FF' : '#F3F4F6',
      color: sa ? '#185FA5' : '#6B7280',
    }}>
      {sa ? 'Superadmin' : 'Admin'}
    </span>
  )
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────
function TabDashboard({ users }) {
  const active    = users.filter(u => u.subscription_status === 'active').length
  const pending   = users.filter(u => u.subscription_status === 'pending').length
  const cancelled = users.filter(u => u.subscription_status === 'cancelled').length
  const mrr       = active * 9.99
  const arr       = mrr * 12
  const churn     = users.length > 0 ? ((cancelled / users.length) * 100).toFixed(1) : '0'
  const conversion = users.length > 0 ? ((active / users.length) * 100).toFixed(0) : '0'

  const stats = [
    { label: 'MRR',              value: fmt(mrr),     sub: 'Ingresos mensuales recurrentes',  color: '#0F6E56', bg: '#EAF3DE' },
    { label: 'ARR estimado',     value: fmt(arr),     sub: 'Proyección anual',                color: '#185FA5', bg: '#EFF6FF' },
    { label: 'Usuarios activos', value: active,       sub: `de ${users.length} registrados`, color: '#0F6E56', bg: '#EAF3DE' },
    { label: 'Pendientes',       value: pending,      sub: 'Sin activar aún',                 color: '#854F0B', bg: '#FAEEDA' },
    { label: 'Tasa conversión',  value: `${conversion}%`, sub: 'Registrados → activos',       color: '#185FA5', bg: '#EFF6FF' },
    { label: 'Churn rate',       value: `${churn}%`,  sub: 'Cancelaciones sobre total',       color: '#993C1D', bg: '#FAECE7' },
  ]

  // Últimos 6 registros
  const recent = [...users]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
            <p className="text-xs text-muted font-medium mb-2">{s.label}</p>
            <p className="text-xl font-medium tabular tracking-tight mb-1" style={{ color: s.color }}>{s.value}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: s.bg, color: s.color }}>{s.sub}</span>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <p className="text-sm font-medium text-primary">Últimos registros</p>
        </div>
        <div className="divide-y divide-border/40">
          {recent.length === 0 && (
            <p className="px-5 py-8 text-sm text-muted text-center">Sin usuarios aún</p>
          )}
          {recent.map(u => (
            <div key={u.id} className="px-5 py-3 flex items-center gap-3">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#185FA5' }}>
                {u.email?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary truncate">{u.email}</p>
                <p className="text-xs text-muted">{new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <StatusBadge status={u.subscription_status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tenants tab ───────────────────────────────────────────────────────────────
function TabTenants({ users, onUpdate, updating }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = users.filter(u => {
    const matchSearch = u.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || u.subscription_status === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Buscar por email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm border border-border rounded-sm px-3 py-2 bg-white focus:outline-none focus:border-tri-300 transition-colors"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="text-sm border border-border rounded-sm px-3 py-2 bg-white text-secondary focus:outline-none"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="pending">Pendientes</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
          <p className="text-sm font-medium text-primary">{filtered.length} usuario{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        {filtered.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted text-center">Sin resultados</p>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map(u => (
              <div key={u.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#185FA5' }}>
                    {u.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{u.email}</p>
                    <p className="text-xs text-muted mt-0.5">Registrado el {new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RoleBadge role={u.role} />
                  <StatusBadge status={u.subscription_status} />
                </div>
                {u.role !== 'superadmin' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.subscription_status !== 'active' && (
                      <button onClick={() => onUpdate(u.id, 'active')} disabled={updating === u.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-md text-white disabled:opacity-50"
                        style={{ backgroundColor: '#0F6E56' }}>
                        {updating === u.id ? '...' : 'Activar'}
                      </button>
                    )}
                    {u.subscription_status === 'active' && (
                      <button onClick={() => onUpdate(u.id, 'cancelled')} disabled={updating === u.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-md border disabled:opacity-50"
                        style={{ backgroundColor: '#FAECE7', color: '#993C1D', borderColor: '#F8A88C' }}>
                        {updating === u.id ? '...' : 'Cancelar'}
                      </button>
                    )}
                    {u.subscription_status === 'cancelled' && (
                      <button onClick={() => onUpdate(u.id, 'active')} disabled={updating === u.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-md border border-border text-secondary disabled:opacity-50">
                        {updating === u.id ? '...' : 'Reactivar'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Billing tab ───────────────────────────────────────────────────────────────
function TabBilling({ users }) {
  const PRICE = 9.99
  const active    = users.filter(u => u.subscription_status === 'active' && u.role !== 'superadmin')
  const cancelled = users.filter(u => u.subscription_status === 'cancelled')
  const mrr       = active.length * PRICE

  // Simulated monthly breakdown (last 4 months)
  const now = new Date()
  const months = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1)
    return d.toLocaleString('es-ES', { month: 'short', year: '2-digit' })
  })

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted font-medium mb-2">MRR actual</p>
          <p className="text-2xl font-medium tabular" style={{ color: '#0F6E56' }}>{fmt(mrr)}</p>
          <p className="text-xs text-muted mt-1">{active.length} suscripciones × {fmt(PRICE)}</p>
        </div>
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted font-medium mb-2">ARR proyectado</p>
          <p className="text-2xl font-medium tabular" style={{ color: '#185FA5' }}>{fmt(mrr * 12)}</p>
          <p className="text-xs text-muted mt-1">Si se mantiene el ritmo actual</p>
        </div>
        <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
          <p className="text-xs text-muted font-medium mb-2">Ingresos perdidos</p>
          <p className="text-2xl font-medium tabular" style={{ color: '#993C1D' }}>{fmt(cancelled.length * PRICE)}</p>
          <p className="text-xs text-muted mt-1">{cancelled.length} cancelaciones</p>
        </div>
      </div>

      {/* Active subscriptions */}
      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <p className="text-sm font-medium text-primary">Suscripciones activas</p>
        </div>
        {active.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted text-center">Sin suscripciones activas aún</p>
        ) : (
          <div className="divide-y divide-border/40">
            {active.map((u, i) => (
              <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#185FA5' }}>
                  {u.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{u.email}</p>
                  <p className="text-xs text-muted">Activo desde {new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p>
                </div>
                <p className="text-sm font-medium tabular" style={{ color: '#0F6E56' }}>{fmt(PRICE)}/mes</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <div className="rounded-lg px-4 py-3 text-xs" style={{ backgroundColor: '#EFF6FF', color: '#185FA5' }}>
        Integración con Stripe próximamente — por ahora la facturación es manual. Activa o cancela usuarios desde la pestaña Tenants.
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const TABS = ['Dashboard', 'Tenants', 'Billing']

export default function Admin() {
  const [tab, setTab]         = useState('Dashboard')
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [error, setError]     = useState(null)

  async function loadUsers() {
    setLoading(true)
    const { data, error } = await supabase.rpc('finio_get_all_profiles')
    if (error) setError(error.message)
    else setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  async function handleUpdate(id, status) {
    setUpdating(id)
    const { error } = await supabase.rpc('finio_update_user', { target_id: id, new_status: status })
    if (error) setError(error.message)
    else await loadUsers()
    setUpdating(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl px-6 py-5" style={{ backgroundColor: '#042C53' }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: '#185FA5' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h1 className="text-lg font-medium text-white">Panel de Administración</h1>
        </div>
        <p className="text-sm" style={{ color: '#93C5FD' }}>Gestión de usuarios, suscripciones y facturación de Finio</p>

        {/* Quick stats in header */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Total usuarios',    value: users.length },
              { label: 'Activos',           value: users.filter(u => u.subscription_status === 'active').length },
              { label: 'Pendientes',        value: users.filter(u => u.subscription_status === 'pending').length },
              { label: 'MRR',              value: fmt(users.filter(u => u.subscription_status === 'active' && u.role !== 'superadmin').length * 9.99) },
            ].map(s => (
              <div key={s.label} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                <p className="text-xs mb-0.5" style={{ color: '#93C5FD' }}>{s.label}</p>
                <p className="text-base font-medium text-white tabular">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#FAECE7', color: '#993C1D' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border gap-1">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            style={tab === t
              ? { borderColor: '#185FA5', color: '#185FA5' }
              : { borderColor: 'transparent', color: '#9CA3AF' }}
          >
            {t}
          </button>
        ))}
        <button onClick={loadUsers} className="ml-auto text-xs text-muted hover:text-secondary transition-colors px-2 pb-2">
          Actualizar
        </button>
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="py-16 text-center text-sm text-muted">Cargando...</div>
      ) : (
        <>
          {tab === 'Dashboard' && <TabDashboard users={users} />}
          {tab === 'Tenants'   && <TabTenants users={users} onUpdate={handleUpdate} updating={updating} />}
          {tab === 'Billing'   && <TabBilling users={users} />}
        </>
      )}
    </div>
  )
}
