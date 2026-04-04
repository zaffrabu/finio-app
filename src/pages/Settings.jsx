function Section({ title, children }) {
  return (
    <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50">
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

export default function Settings({ user, onSignOut, transactions }) {
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const btnCls = "text-xs font-medium px-3 py-1.5 rounded-md border transition-colors"

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-medium text-primary">Ajustes</h1>
        <p className="text-sm text-muted mt-0.5">Gestiona tu cuenta y tus datos</p>
      </div>

      {/* Profile */}
      <Section title="Perfil">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-medium flex-shrink-0"
            style={{ backgroundColor: '#185FA5' }}
          >
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="text-sm font-medium text-primary">{user?.email}</p>
            {joinedDate && (
              <p className="text-xs text-muted mt-0.5">Miembro desde {joinedDate}</p>
            )}
          </div>
        </div>
        <Row
          label="Acceso"
          detail="Finio usa magic link — sin contraseña. Recibes un enlace en tu correo para entrar."
        />
      </Section>

      {/* Data */}
      <Section title="Tus datos">
        <Row
          label="Exportar transacciones"
          detail={`${transactions.length} transacciones en total`}
          action={
            <button
              onClick={() => exportCSV(transactions)}
              disabled={transactions.length === 0}
              className={btnCls}
              style={{ backgroundColor: '#E6F1FB', color: '#185FA5', borderColor: '#bfdbfe' }}
            >
              Descargar CSV
            </button>
          }
        />
        <Row
          label="Almacenamiento"
          detail="Las transacciones se guardan en Supabase asociadas a tu cuenta. Las categorías y preferencias se almacenan localmente."
        />
      </Section>

      {/* Preferences */}
      <Section title="Preferencias">
        <Row
          label="Moneda"
          detail="Euro (€) — más opciones próximamente"
          action={
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              EUR
            </span>
          }
        />
        <Row
          label="Idioma"
          detail="Español — más idiomas próximamente"
          action={
            <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
              ES
            </span>
          }
        />
      </Section>

      {/* Danger zone */}
      <Section title="Sesión">
        <Row
          label="Cerrar sesión"
          detail="Puedes volver en cualquier momento con tu correo"
          action={
            <button
              onClick={onSignOut}
              className={btnCls}
              style={{ backgroundColor: '#FAECE7', color: '#993C1D', borderColor: '#F8A88C' }}
            >
              Cerrar sesión
            </button>
          }
        />
      </Section>
    </div>
  )
}
