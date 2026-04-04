import { useState } from 'react'

export default function Login({ signIn, signUp }) {
  const [mode, setMode]         = useState('login') // 'login' | 'register'
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return

    if (mode === 'register' && password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        await signUp(email.trim(), password)
      }
    } catch (err) {
      setError(
        err.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : err.message === 'User already registered'
          ? 'Este email ya está registrado. Inicia sesión.'
          : err.message
      )
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "w-full text-sm border border-border rounded-lg px-3 py-2.5 bg-white text-primary focus:outline-none focus:border-tri-400 focus:ring-2 focus:ring-tri-400/20 transition-colors"

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F2F9FB' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm mb-3" style={{ backgroundColor: '#185FA5' }}>
            <span className="text-white font-bold text-xl leading-none" style={{ fontFamily: 'Georgia, serif' }}>F</span>
          </div>
          <h1 className="text-2xl font-medium tracking-tight" style={{ color: '#042C53' }}>Finio</h1>
          <p className="text-sm text-muted mt-1">Tu gestor de finanzas personales</p>
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-card px-6 py-8">
          {/* Mode tabs */}
          <div className="flex rounded-lg overflow-hidden border border-border mb-6">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className="flex-1 text-sm py-2 font-medium transition-colors"
                style={mode === m
                  ? { backgroundColor: '#185FA5', color: '#fff' }
                  : { backgroundColor: '#fff', color: '#9CA3AF' }}
              >
                {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                autoFocus
                className={inputCls}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary transition-colors"
                >
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Confirmar contraseña</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                  className={inputCls}
                />
              </div>
            )}

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: '#FAECE7', color: '#993C1D' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full py-2.5 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: '#185FA5' }}
            >
              {loading
                ? (mode === 'login' ? 'Entrando...' : 'Creando cuenta...')
                : (mode === 'login' ? 'Entrar' : 'Crear cuenta')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-6">Finio · Finanzas personales inteligentes</p>
      </div>
    </div>
  )
}
