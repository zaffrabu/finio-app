import { useState, useMemo } from 'react'
import { useData } from '../../contexts/DataContext'

function fmt(n) { return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

export default function Alertas() {
  const { categories, spendingByCategory, daysRemaining, monthTransactions, loading } = useData()
  const [activeTab, setActiveTab] = useState('todas')
  const [dismissed, setDismissed] = useState(new Set())

  // Generate alerts from real data
  const alerts = useMemo(() => {
    const list = []

    categories.forEach(c => {
      const spent = spendingByCategory[c.name] || 0
      const budget = c.budget || 0
      if (budget <= 0) return
      const pct = Math.round((spent / budget) * 100)
      const rest = budget - spent

      if (pct >= 100) {
        list.push({
          id: `over-${c.name}`,
          type: 'criticas',
          icon: '🚨',
          iconBg: 'rgba(214,59,39,0.1)',
          badge: '🔴 Crítica · Presupuesto',
          badgeBg: 'rgba(214,59,39,0.12)',
          badgeColor: 'var(--alerta)',
          title: `${c.name} superó el límite mensual`,
          body: `Has gastado ${fmt(spent)} € en ${c.name.toLowerCase()} este mes y tu límite es ${fmt(budget)} €. Exceso de ${fmt(Math.abs(rest))} € y quedan ${daysRemaining} días.`,
          progress: { label: c.name, width: '100%', color: 'var(--alerta)', val: `${fmt(spent)}€` },
        })
      } else if (pct >= 80) {
        list.push({
          id: `warn-${c.name}`,
          type: 'avisos',
          icon: '⚠️',
          iconBg: 'rgba(184,125,0,0.1)',
          badge: '🟡 Aviso · Presupuesto',
          badgeBg: 'rgba(184,125,0,0.12)',
          badgeColor: 'var(--aviso)',
          title: `${c.name} al ${pct}% — quedan ${daysRemaining} días`,
          body: `Solo ${fmt(rest)} € hasta el límite de ${fmt(budget)} €. Al ritmo actual podrías superarlo antes de fin de mes.`,
          progress: { label: c.name, width: `${pct}%`, color: 'var(--aviso)', val: `${fmt(spent)}€` },
        })
      } else if (pct >= 60) {
        list.push({
          id: `info-${c.name}`,
          type: 'tips',
          icon: '💡',
          iconBg: 'rgba(46,184,122,0.1)',
          badge: '💡 Tip',
          badgeBg: 'rgba(46,184,122,0.12)',
          badgeColor: 'var(--acento)',
          title: `${c.name} lleva el ${pct}% del presupuesto`,
          body: `Aún tienes ${fmt(rest)} € disponibles en ${c.name.toLowerCase()} para los próximos ${daysRemaining} días.`,
          progress: { label: c.name, width: `${pct}%`, color: 'var(--acento)', val: `${fmt(spent)}€` },
        })
      }
    })

    if (monthTransactions.length === 0) {
      list.push({
        id: 'no-data',
        type: 'tips',
        icon: '📂',
        iconBg: 'var(--bg-surface2)',
        badge: 'ℹ️ Info',
        badgeBg: 'var(--bg-surface2)',
        badgeColor: 'var(--text-muted)',
        title: 'Sin movimientos este mes',
        body: 'Importa un extracto bancario para que finio pueda generar alertas personalizadas.',
      })
    }

    return list
  }, [categories, spendingByCategory, daysRemaining, monthTransactions])

  const visibleAlerts = alerts.filter(a => {
    if (dismissed.has(a.id)) return false
    if (activeTab === 'todas') return true
    return a.type === activeTab
  })

  const critCount = alerts.filter(a => a.type === 'criticas').length
  const warnCount = alerts.filter(a => a.type === 'avisos').length
  const tipCount = alerts.filter(a => a.type === 'tips').length

  const tabs = [
    { key: 'todas', label: 'Todas', count: alerts.length },
    { key: 'criticas', label: '🔴 Críticas', count: critCount },
    { key: 'avisos', label: '🟡 Avisos', count: warnCount },
    { key: 'tips', label: '💡 Tips', count: tipCount },
  ]

  if (loading) return <div className="auth-loading"><div className="auth-spinner"></div></div>

  return (
    <div>
      {/* KPIs */}
      <div className="kpi-row" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-label">Críticas activas</div>
          <div className="kpi-value" style={{ color: critCount > 0 ? 'var(--alerta)' : undefined }}>{critCount}</div>
          <div className="kpi-delta">{critCount > 0 ? 'Requiere atención' : 'Ninguna'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avisos activos</div>
          <div className="kpi-value" style={{ color: warnCount > 0 ? 'var(--aviso)' : undefined }}>{warnCount}</div>
          <div className="kpi-delta">{warnCount > 0 ? 'Categorías cercanas al límite' : 'Todo bajo control'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tips</div>
          <div className="kpi-value">{tipCount}</div>
          <div className="kpi-delta">Sugerencias de mejora</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total alertas</div>
          <div className="kpi-value">{alerts.length}</div>
          <div className="kpi-delta">Este mes</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="alert-tabs" style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`cat-view-btn${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label} {t.count > 0 && <span style={{ opacity: 0.6 }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visibleAlerts.length === 0 ? (
          <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Sin alertas</div>
            <div style={{ fontSize: 13 }}>No hay alertas en esta categoría. ¡Todo bajo control!</div>
          </div>
        ) : (
          visibleAlerts.map(a => (
            <div key={a.id} className="panel" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: a.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, flexShrink: 0,
                }}>{a.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 500,
                      letterSpacing: '0.08em', padding: '2px 8px', borderRadius: 5,
                      background: a.badgeBg, color: a.badgeColor,
                    }}>{a.badge}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{a.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: a.progress ? 12 : 0 }}>{a.body}</div>
                  {a.progress && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: 'var(--text-muted)', width: 80 }}>{a.progress.label}</span>
                      <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: a.progress.width, background: a.progress.color, borderRadius: 100 }}></div>
                      </div>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: a.progress.color }}>{a.progress.val}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setDismissed(prev => new Set([...prev, a.id]))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
                  title="Descartar"
                >✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
