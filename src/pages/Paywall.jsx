export default function Paywall({ user, onSignOut }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F2F9FB' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-3" style={{ backgroundColor: '#185FA5' }}>
            <span className="text-white font-bold text-xl" style={{ fontFamily: 'Georgia, serif' }}>F</span>
          </div>
          <h1 className="text-xl font-medium" style={{ color: '#042C53' }}>Finio</h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-border shadow-card px-8 py-8 text-center">
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EFF6FF' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>

          <h2 className="text-lg font-medium text-primary mb-2">Activa tu cuenta</h2>
          <p className="text-sm text-muted mb-6 leading-relaxed">
            Tu registro está listo. Para acceder a Finio, realiza el pago y te activamos en menos de 24 horas.
          </p>

          {/* Price */}
          <div className="rounded-xl px-6 py-5 mb-6" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2EEF1' }}>
            <p className="text-3xl font-medium text-primary tabular mb-1">9,99 €<span className="text-base font-normal text-muted">/mes</span></p>
            <p className="text-xs text-muted">Acceso completo · Sin permanencia</p>
            <div className="mt-4 space-y-2 text-left">
              {[
                'Dashboard y análisis de gastos',
                'Finio Coach con IA incluido',
                'Alertas y presupuestos automáticos',
                'Exportación de datos',
              ].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EAF3DE' }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span className="text-xs text-secondary">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <a
            href="mailto:zaffra.0803@gmail.com?subject=Activar%20cuenta%20Finio&body=Hola%2C%20quiero%20activar%20mi%20cuenta%20de%20Finio.%20Mi%20email%20es%3A%20"
            className="block w-full py-3 rounded-xl text-white font-medium text-sm transition-colors mb-3"
            style={{ backgroundColor: '#185FA5' }}
          >
            Contactar para activar
          </a>
          <p className="text-xs text-muted">
            Escríbenos a{' '}
            <span className="font-medium" style={{ color: '#185FA5' }}>zaffra.0803@gmail.com</span>
            {' '}con tu email y te activamos en menos de 24h
          </p>
        </div>

        {/* Signed in as */}
        <div className="mt-4 flex items-center justify-between px-1">
          <p className="text-xs text-muted">Conectado como <span className="font-medium">{user?.email}</span></p>
          <button onClick={onSignOut} className="text-xs text-muted hover:text-secondary transition-colors">
            Salir
          </button>
        </div>
      </div>
    </div>
  )
}
