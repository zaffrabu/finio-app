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
  const isSuperadmin = role === 'superadmin'
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
      backgroundColor: isSuperadmin ? '#EFF6FF' : '#F3F4F6',
      color: isSuperadmin ? '#185FA5' : '#6B7280',
    }}>
      {isSuperadmin ? 'Superadmin' : 'Admin'}
    </span>
  )
}

export default function Admin() {
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

  async function updateUser(id, status, role) {
    setUpdating(id)
    const { error } = await supabase.rpc('finio_update_user', {
      target_id: id,
      new_status: status,
      new_role: role ?? null,
    })
    if (error) setError(error.message)
    else await loadUsers()
    setUpdating(null)
  }

  const total     = users.length
  const active    = users.filter(u => u.subscription_status === 'active').length
  const pending   = users.filter(u => u.subscription_status === 'pending').length
  const cancelled = users.filter(u => u.subscription_status === 'cancelled').length
  const mrr       = active * 9.99

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl px-6 py-5" style={{ backgroundColor: '#042C53' }}>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#185FA5' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h1 className="text-lg font-medium text-white">Panel de Administración</h1>
        </div>
        <p className="text-sm" style={{ color: '#93C5FD' }}>Gestión de usuarios y suscripciones de Finio</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Total usuarios', value: total },
            { label: 'Activos', value: active },
            { label: 'Pendientes', value: pending },
            { label: 'MRR estimado', value: fmt(mrr) },
          ].map(s => (
            <div key={s.label} className="rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
              <p className="text-xs mb-0.5" style={{ color: '#93C5FD' }}>{s.label}</p>
              <p className="text-base font-medium text-white tabular">{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#FAECE7', color: '#993C1D' }}>
          {error}
        </div>
      )}

      {/* User table */}
      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 flex items-center justify-between">
          <p className="text-sm font-medium text-primary">Usuarios registrados</p>
          <button onClick={loadUsers} className="text-xs text-muted hover:text-secondary transition-colors">
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-sm text-muted">Cargando...</div>
        ) : users.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted">No hay usuarios aún</div>
        ) : (
          <div className="divide-y divide-border/40">
            {users.map(u => (
              <div key={u.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Avatar + info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#185FA5' }}>
                    {u.email?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{u.email}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <RoleBadge role={u.role} />
                  <StatusBadge status={u.subscription_status} />
                </div>

                {/* Actions */}
                {u.role !== 'superadmin' && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {u.subscription_status !== 'active' && (
                      <button
                        onClick={() => updateUser(u.id, 'active')}
                        disabled={updating === u.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-md text-white transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#0F6E56' }}
                      >
                        {updating === u.id ? '...' : 'Activar'}
                      </button>
                    )}
                    {u.subscription_status === 'active' && (
                      <button
                        onClick={() => updateUser(u.id, 'cancelled')}
                        disabled={updating === u.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-md border transition-colors disabled:opacity-50"
                        style={{ backgroundColor: '#FAECE7', color: '#993C1D', borderColor: '#F8A88C' }}
                      >
                        {updating === u.id ? '...' : 'Cancelar'}
                      </button>
                    )}
                    {u.subscription_status === 'cancelled' && (
                      <button
                        onClick={() => updateUser(u.id, 'pending')}
                        disabled={updating === u.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-md border border-border text-secondary transition-colors disabled:opacity-50"
                      >
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

      {/* Stats summary */}
      {!loading && users.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Tasa de conversión', value: total > 0 ? `${((active / total) * 100).toFixed(0)}%` : '—', detail: `${active} de ${total} usuarios activos`, color: '#0F6E56' },
            { label: 'Pendientes de activar', value: pending, detail: pending === 0 ? 'Todos activados' : `${pending} usuario${pending > 1 ? 's' : ''} esperando`, color: '#854F0B' },
            { label: 'Ingresos mensuales', value: fmt(mrr), detail: `${active} suscripciones × 9,99 €`, color: '#185FA5' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
              <p className="text-xs text-muted font-medium mb-2">{s.label}</p>
              <p className="text-xl font-medium tabular tracking-tight mb-1" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-muted">{s.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
