import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'

export default function Login() {
  const { user, loading, signIn, signUp } = useAuthContext()
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner"></div>
      </div>
    )
  }

  if (user) return <Navigate to="/" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Introduce tu email y contraseña')
      return
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (mode === 'signup' && password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
        setSignupSuccess(true)
      }
    } catch (err) {
      const msg = err.message || 'Error desconocido'
      if (msg.includes('Invalid login')) setError('Email o contraseña incorrectos')
      else if (msg.includes('already registered')) setError('Este email ya tiene una cuenta')
      else setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (signupSuccess) {
    return (
      <div className="auth-overlay">
        <div className="auth-left">
          <div className="ob-left-logo">finio <div className="ob-left-logo-dot"></div></div>
          <div className="ob-left-preview" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <div className="ob-preview-balance" style={{ fontSize: 28 }}>Revisa tu email</div>
            <div className="ob-preview-phrase">
              Hemos enviado un enlace de confirmación a <strong>{email}</strong>. Haz clic en el enlace para activar tu cuenta.
            </div>
          </div>
          <div className="ob-left-tagline">
            finio no pide acceso a tu banco.<br/>
            <strong>Tú decides qué subir y cuándo.</strong>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-form-area">
            <div className="ob-step-eyebrow">Cuenta creada</div>
            <div className="ob-step-title">Confirma tu email</div>
            <div className="ob-step-sub">
              Hemos enviado un enlace a <strong>{email}</strong>. Después de confirmarlo, vuelve aquí para iniciar sesión.
            </div>
            <button
              className="ob-next-btn"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => { setSignupSuccess(false); setMode('login'); setPassword(''); setConfirmPassword('') }}
            >
              Ir a iniciar sesión →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-overlay">
      {/* Left decorative panel */}
      <div className="auth-left">
        <div className="ob-left-logo">finio <div className="ob-left-logo-dot"></div></div>
        <div className="ob-left-preview">
          <div className="ob-preview-label">Centro de control financiero</div>
          <div className="ob-preview-balance" style={{ fontSize: 36 }}>
            <span className="eur">€</span>Tu margen real
          </div>
          <div className="ob-preview-phrase">
            Conoce cuánto tienes <strong>realmente disponible</strong> cada mes. Sin acceso a tu banco, sin complicaciones.
          </div>
          <div className="ob-preview-bars">
            <div className="ob-prev-bar-row">
              <span className="ob-prev-bar-name">Dashboard</span>
              <div className="ob-prev-bar-track"><div className="ob-prev-bar-fill" style={{ width: '85%', background: '#2EB87A' }}></div></div>
            </div>
            <div className="ob-prev-bar-row">
              <span className="ob-prev-bar-name">Alertas</span>
              <div className="ob-prev-bar-track"><div className="ob-prev-bar-fill" style={{ width: '60%', background: '#FFB830' }}></div></div>
            </div>
            <div className="ob-prev-bar-row">
              <span className="ob-prev-bar-name">Proyección</span>
              <div className="ob-prev-bar-track"><div className="ob-prev-bar-fill" style={{ width: '45%', background: '#72E4A5' }}></div></div>
            </div>
          </div>
        </div>
        <div className="ob-left-tagline">
          finio no pide acceso a tu banco.<br/>
          <strong>Tú decides qué subir y cuándo.</strong>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-form-area">
          <div className="ob-step-eyebrow">{mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}</div>
          <div className="ob-step-title">
            {mode === 'login' ? 'Inicia sesión' : 'Regístrate'}
          </div>
          <div className="ob-step-sub">
            {mode === 'login'
              ? 'Accede a tu centro de control financiero.'
              : <>En menos de 2 minutos tendrás tu <strong>dashboard personalizado</strong>.</>
            }
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button className={`auth-tab${mode === 'login' ? ' active' : ''}`} onClick={() => { setMode('login'); setError('') }}>
              Iniciar sesión
            </button>
            <button className={`auth-tab${mode === 'signup' ? ' active' : ''}`} onClick={() => { setMode('signup'); setError('') }}>
              Crear cuenta
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="ob-field">
              <label className="ob-label">Email <span className="ob-label-req">*</span></label>
              <input
                className="ob-input"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="ob-field">
              <label className="ob-label">Contraseña <span className="ob-label-req">*</span></label>
              <input
                className="ob-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {mode === 'signup' && (
              <div className="ob-field">
                <label className="ob-label">Confirmar contraseña <span className="ob-label-req">*</span></label>
                <input
                  className="ob-input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="auth-error">{error}</div>
            )}

            <button
              className="ob-next-btn"
              type="submit"
              disabled={submitting}
              style={{ width: '100%', marginTop: 8 }}
            >
              {submitting
                ? 'Cargando...'
                : mode === 'login' ? 'Entrar →' : 'Crear cuenta →'
              }
            </button>
          </form>

          <div className="auth-footer-text">
            {mode === 'login' ? (
              <>¿No tienes cuenta? <button className="auth-link" onClick={() => { setMode('signup'); setError('') }}>Regístrate</button></>
            ) : (
              <>¿Ya tienes cuenta? <button className="auth-link" onClick={() => { setMode('login'); setError('') }}>Inicia sesión</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
