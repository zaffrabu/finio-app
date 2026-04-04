import { useState } from 'react'

export default function Login({ signInWithEmail }) {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error: err } = await signInWithEmail(email.trim())
    setLoading(false)
    if (err) {
      setError(err.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#F2F9FB' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-3"
            style={{ backgroundColor: '#185FA5' }}
          >
            <span className="text-white font-bold text-xl leading-none" style={{ fontFamily: 'Georgia, serif' }}>F</span>
          </div>
          <h1 className="text-2xl font-medium tracking-tight" style={{ color: '#042C53' }}>Finio</h1>
          <p className="text-sm text-muted mt-1">Tu gestor de finanzas personales</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-card px-6 py-8">
          {!sent ? (
            <>
              <h2 className="text-base font-medium text-primary mb-1">Accede a tu cuenta</h2>
              <p className="text-sm text-muted mb-6">
                Te enviamos un enlace mágico a tu correo. Sin contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    autoFocus
                    className="w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-white text-primary focus:outline-none focus:border-tri-400 focus:ring-2 focus:ring-tri-400/20 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full py-2.5 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#185FA5' }}
                >
                  {loading ? 'Enviando...' : 'Continuar con email'}
                </button>
              </form>

              <p className="text-xs text-muted text-center mt-5">
                ¿Primera vez? El registro es automático al acceder.
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#EAF3DE' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 className="text-base font-medium text-primary mb-2">Revisa tu correo</h2>
              <p className="text-sm text-muted mb-1">
                Enviamos un enlace de acceso a:
              </p>
              <p className="text-sm font-medium" style={{ color: '#185FA5' }}>{email}</p>
              <p className="text-xs text-muted mt-4">
                Pulsa el enlace del correo para entrar a Finio.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-xs text-muted hover:text-secondary transition-colors"
              >
                Usar otro correo
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Finio · Finanzas personales inteligentes
        </p>
      </div>
    </div>
  )
}
