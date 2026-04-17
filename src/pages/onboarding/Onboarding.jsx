import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import { useUserSettings } from '../../hooks/useUserSettings'
import { useUserCategories } from '../../hooks/useUserCategories'

const TOTAL_STEPS = 6 // 0=welcome, 1=income, 2=fixed, 3=bank, 4=categories, 5=success

const defaultFixed = [
  { emoji: '🏠', name: 'Alquiler / hipoteca', sub: 'Mensual · fijo', placeholder: '750', value: '' },
  { emoji: '💡', name: 'Suministros (luz, agua, internet)', sub: 'Mensual · estimado', placeholder: '120', value: '' },
  { emoji: '📺', name: 'Suscripciones (Netflix, Spotify...)', sub: 'Mensual · recurrente', placeholder: '35', value: '' },
  { emoji: '🚗', name: 'Seguros (coche, salud...)', sub: 'Mensual · fijo', placeholder: '80', value: '' },
]

const defaultCategories = [
  { emoji: '🍔', name: 'Comida', selected: true },
  { emoji: '🛒', name: 'Supermercado', selected: true },
  { emoji: '🚇', name: 'Transporte', selected: true },
  { emoji: '🎉', name: 'Ocio', selected: true },
  { emoji: '💊', name: 'Salud', selected: false },
  { emoji: '👗', name: 'Ropa', selected: false },
  { emoji: '✈️', name: 'Viajes', selected: false },
  { emoji: '🏋️', name: 'Deporte', selected: false },
  { emoji: '📚', name: 'Formación', selected: false },
  { emoji: '🐶', name: 'Mascotas', selected: false },
  { emoji: '💆', name: 'Cuidado personal', selected: false },
  { emoji: '📦', name: 'Otros', selected: false },
]

const banks = [
  { emoji: '🟦', name: 'BBVA' },
  { emoji: '🔴', name: 'Santander' },
  { emoji: '🟠', name: 'ING' },
  { emoji: '🟣', name: 'CaixaBank' },
  { emoji: '🔵', name: 'Sabadell' },
  { emoji: '📄', name: 'Otro banco' },
]

const features = [
  { icon: '📊', title: 'Tu margen real, no teórico', desc: 'Basado en lo que realmente ganas y gastas, no en estimaciones genéricas.' },
  { icon: '🔔', title: 'Alertas antes de que ocurra el problema', desc: 'Saber el día anterior que el gym cobra. Ver que ocio lleva el 93% antes de superarlo.' },
  { icon: '📈', title: 'Proyecciones y simulador', desc: 'Qué pasa si bajas delivery a 2 veces esta semana. Cuánto cerrarás el mes.' },
  { icon: '🔒', title: 'Sin acceso a tu banco', desc: 'Nunca pedimos usuario ni contraseña. Tú descargas el extracto y decides cuándo subirlo.' },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { saveSettings } = useUserSettings(user?.id)
  const { insertDefaults } = useUserCategories(user?.id)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [ingreso, setIngreso] = useState('')
  const [ingresoType, setIngresoType] = useState('regular')
  const [payDay, setPayDay] = useState('1')
  const [fixed, setFixed] = useState(defaultFixed)
  const [selectedBank, setSelectedBank] = useState(0)
  const [categories, setCategories] = useState(defaultCategories)

  const ingresoNum = useMemo(() => {
    const n = parseFloat(ingreso.replace(/[^\d]/g, ''))
    return isNaN(n) ? 0 : n
  }, [ingreso])

  const totalFixed = useMemo(() => {
    return fixed.reduce((sum, f) => {
      const n = parseFloat((f.value || '').replace(/[^\d]/g, ''))
      return sum + (isNaN(n) ? 0 : n)
    }, 0)
  }, [fixed])

  const disponible = ingresoNum - totalFixed
  const selectedCats = categories.filter(c => c.selected)

  // Preview bars data
  const previewBars = [
    { name: 'Comida', color: '#D63B27', pct: ingresoNum ? Math.min(100, Math.round((160 / ingresoNum) * 100)) : 0, val: '160' },
    { name: 'Transporte', color: '#2EB87A', pct: ingresoNum ? Math.min(100, Math.round((80 / ingresoNum) * 100)) : 0, val: '80' },
    { name: 'Ocio', color: '#B87D00', pct: ingresoNum ? Math.min(100, Math.round((100 / ingresoNum) * 100)) : 0, val: '100' },
    { name: 'Supermercado', color: '#72E4A5', pct: ingresoNum ? Math.min(100, Math.round((300 / ingresoNum) * 100)) : 0, val: '300' },
  ]

  const progressPct = step === 0 ? 0 : Math.round((step / (TOTAL_STEPS - 1)) * 100)

  const updateFixed = (idx, val) => {
    const next = [...fixed]
    next[idx] = { ...next[idx], value: val }
    setFixed(next)
  }

  const addFixed = () => {
    setFixed([...fixed, { emoji: '📌', name: 'Nuevo gasto fijo', sub: 'Mensual', placeholder: '0', value: '' }])
  }

  const toggleCategory = (idx) => {
    const next = [...categories]
    next[idx] = { ...next[idx], selected: !next[idx].selected }
    setCategories(next)
  }

  const canNext = step === 1 ? ingresoNum > 0 : true

  const goNext = async () => {
    if (step === TOTAL_STEPS - 1) {
      // Save all data to Supabase
      setSaving(true)
      try {
        const fixedExpenses = fixed
          .filter(f => f.value && parseFloat(f.value.replace(/[^\d]/g, '')) > 0)
          .map(f => ({ name: f.name, importe: parseFloat(f.value.replace(/[^\d]/g, '')) }))

        await saveSettings({
          income: ingresoNum,
          income_type: ingresoType,
          pay_day: payDay,
          fixed_expenses: fixedExpenses,
          onboarding_completed: true,
        })

        const selectedNames = categories.filter(c => c.selected).map(c => c.name)
        if (selectedNames.length > 0) {
          await insertDefaults(selectedNames)
        }
      } catch (err) {
        console.error('Error saving onboarding:', err)
      }
      setSaving(false)
      navigate('/')
      return
    }
    setStep(s => s + 1)
  }

  const goBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const skipStep = () => {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1)
  }

  const nextLabel = () => {
    if (step === 0) return 'Empezar →'
    if (step === TOTAL_STEPS - 1) return saving ? 'Guardando...' : 'Ir al dashboard →'
    return 'Siguiente →'
  }

  const stepLabel = () => {
    if (step === 0) return 'Bienvenida'
    if (step === TOTAL_STEPS - 1) return 'Completado'
    return `Paso ${step} de ${TOTAL_STEPS - 2}`
  }

  return (
    <div className="ob-overlay">
      {/* Left decorative panel */}
      <div className="ob-left">
        <div className="ob-left-logo">
          finio <div className="ob-left-logo-dot"></div>
        </div>
        <div className="ob-left-preview">
          <div className="ob-preview-label">Tu margen real en abril</div>
          <div className="ob-preview-balance">
            <span className="eur">€</span>
            {disponible > 0 ? disponible.toLocaleString('es-ES') : '—'}
          </div>
          <div className="ob-preview-phrase">
            {ingresoNum > 0 ? (
              <>Ingresas <strong>{ingresoNum.toLocaleString('es-ES')} €</strong> y tus gastos fijos suman <strong>{totalFixed.toLocaleString('es-ES')} €</strong>. Te quedan <strong>{disponible.toLocaleString('es-ES')} €</strong> para gastos variables.</>
            ) : (
              <>Introduce tu ingreso mensual para ver<br/>cuánto margen tienes disponible.</>
            )}
          </div>
          <div className="ob-preview-bars">
            {previewBars.map((b, i) => (
              <div key={i} className="ob-prev-bar-row">
                <span className="ob-prev-bar-name">{b.name}</span>
                <div className="ob-prev-bar-track">
                  <div className="ob-prev-bar-fill" style={{ width: `${ingresoNum > 0 ? b.pct : 0}%`, background: b.color }}></div>
                </div>
                <span className="ob-prev-bar-val">{ingresoNum > 0 ? b.val : '—'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="ob-left-tagline">
          finio no pide acceso a tu banco.<br/>
          <strong>Tú decides qué subir y cuándo.</strong>
        </div>
      </div>

      {/* Right step panel */}
      <div className="ob-right">
        <div className="ob-progress-bar">
          <div className="ob-progress-fill" style={{ width: `${progressPct}%` }}></div>
        </div>

        <div className="ob-step-header">
          <div className="ob-step-indicator">{stepLabel()}</div>
          <div className="ob-step-dots">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`ob-step-dot${i < step ? ' done' : ''}${i === step ? ' current' : ''}`}></div>
            ))}
          </div>
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <button className="ob-skip-btn" onClick={skipStep}>Saltar →</button>
          )}
          {(step === 0 || step === TOTAL_STEPS - 1) && <div style={{ width: 60 }}></div>}
        </div>

        <div className="ob-step-content">
          <div key={step} className="ob-step-animate">

            {/* STEP 0: BIENVENIDA */}
            {step === 0 && (
              <div>
                <div className="ob-step-eyebrow">Bienvenida</div>
                <div className="ob-step-title">Hola. Conoce cuánto<br/>tienes realmente.</div>
                <div className="ob-step-sub">
                  finio es la diferencia entre lo que entra y lo que sale. <strong>En menos de 2 minutos</strong> sabrás exactamente cómo estás y qué puedes hacer con lo que tienes.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {features.map((f, i) => (
                    <div key={i} className="ob-feature-card">
                      <span className="ob-feature-icon">{f.icon}</span>
                      <div>
                        <div className="ob-feature-title">{f.title}</div>
                        <div className="ob-feature-desc">{f.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.12em', textAlign: 'center' }}>
                  Solo necesitamos 5 datos para empezar · El resto lo calcula finio solo
                </div>
              </div>
            )}

            {/* STEP 1: INGRESO */}
            {step === 1 && (
              <div>
                <div className="ob-step-eyebrow">Paso 1 — Obligatorio</div>
                <div className="ob-step-title">¿Cuánto ingresas al mes?</div>
                <div className="ob-step-sub">
                  Solo necesitamos el neto que llega a tu cuenta. Puede ser <strong>aproximado</strong> — no tiene que ser exacto.
                </div>

                <div className="ob-field">
                  <label className="ob-label">Ingreso mensual neto <span className="ob-label-req">*</span></label>
                  <input
                    className="ob-input-big"
                    type="text"
                    placeholder="2.100"
                    value={ingreso}
                    onChange={e => setIngreso(e.target.value)}
                  />
                  <div className="ob-hint">Nómina, freelance, pensión... lo que entra en tu cuenta cada mes.</div>
                </div>

                <div className="ob-field">
                  <label className="ob-label">¿Tus ingresos son regulares?</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button className={`ob-type-btn${ingresoType === 'regular' ? ' selected' : ''}`} onClick={() => setIngresoType('regular')}>
                      <span style={{ fontSize: 16 }}>📅</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Nómina fija</span>
                    </button>
                    <button className={`ob-type-btn${ingresoType === 'variable' ? ' selected' : ''}`} onClick={() => setIngresoType('variable')}>
                      <span style={{ fontSize: 16 }}>📊</span>
                      <span style={{ fontFamily: "'Poppins',sans-serif", fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Variable / autónomo</span>
                    </button>
                  </div>
                  <div className="ob-hint">
                    {ingresoType === 'regular' ? 'Usaremos este importe como base de cada mes.' : 'Calcularemos la media de los últimos meses para proyectar.'}
                  </div>
                </div>

                <div className="ob-field">
                  <label className="ob-label">¿Cuándo cobras normalmente?</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[{ val: '1', label: 'Día 1' }, { val: '15', label: 'Día 15' }, { val: '28', label: 'Día 28–31' }, { val: 'otro', label: 'Otro' }].map(d => (
                      <button key={d.val} className={`ob-day-btn${payDay === d.val ? ' selected' : ''}`} onClick={() => setPayDay(d.val)}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: GASTOS FIJOS */}
            {step === 2 && (
              <div>
                <div className="ob-step-eyebrow">Paso 2 — Opcional (recomendado)</div>
                <div className="ob-step-title">¿Cuáles son tus<br/>gastos fijos?</div>
                <div className="ob-step-sub">
                  Con esto finio ya puede decirte cuánto tienes <strong>realmente disponible</strong> antes de gastar en nada variable.
                </div>

                <div className="ob-fixed-list">
                  {fixed.map((f, i) => (
                    <div key={i} className="ob-fixed-row">
                      <span className="ob-fixed-emoji">{f.emoji}</span>
                      <div className="ob-fixed-info">
                        <div className="ob-fixed-name">{f.name}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)' }}>{f.sub}</div>
                      </div>
                      <input
                        className="ob-fixed-input"
                        type="text"
                        placeholder={`${f.placeholder} €`}
                        value={f.value}
                        onChange={e => updateFixed(i, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <button className="ob-fixed-add" onClick={addFixed}>
                  <span style={{ fontSize: 18 }}>＋</span> Añadir otro gasto fijo
                </button>

                <div style={{
                  marginTop: 20, padding: '14px 16px',
                  background: 'rgba(46,184,122,0.06)', border: '1px solid rgba(46,184,122,0.15)',
                  borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Te queda disponible para gastos variables
                    </div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      Antes de anotar ningún gasto
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 28, fontWeight: 800, color: 'var(--acento)', letterSpacing: '-1px' }}>
                    {ingresoNum > 0 ? `${disponible.toLocaleString('es-ES')} €` : '— €'}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: BANCO / EXTRACTO */}
            {step === 3 && (
              <div>
                <div className="ob-step-eyebrow">Paso 3 — Opcional (recomendado)</div>
                <div className="ob-step-title">Importa tu primer<br/>extracto bancario</div>
                <div className="ob-step-sub">
                  Con el extracto, finio categoriza tus gastos automáticamente y <strong>el dashboard se llena al instante</strong>. Sin esto, tendrás que añadir gastos a mano.
                </div>

                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                  Selecciona tu banco
                </div>
                <div className="ob-bank-grid">
                  {banks.map((b, i) => (
                    <div key={i} className={`ob-bank-card${selectedBank === i ? ' selected' : ''}`} onClick={() => setSelectedBank(i)}>
                      <div className="ob-bank-logo">{b.emoji}</div>
                      <div className="ob-bank-name">{b.name}</div>
                      <div className="ob-bank-check">✓</div>
                    </div>
                  ))}
                </div>

                <div className="ob-drop-zone-ob">
                  <div className="ob-drop-icon">📂</div>
                  <div className="ob-drop-title">Sube el extracto de {banks[selectedBank].name}</div>
                  <div className="ob-drop-sub">
                    Descárgalo desde tu banca online → Movimientos → Descargar.<br/>Selecciona el mes actual o el periodo que quieras.
                  </div>
                  <div className="ob-drop-formats">
                    <span className="ob-fmt">XLS</span>
                    <span className="ob-fmt">XLSX</span>
                    <span className="ob-fmt">CSV</span>
                    <span className="ob-fmt">PDF</span>
                  </div>
                </div>

                <div className="ob-privacy">
                  <span className="ob-privacy-icon">🔒</span>
                  <div className="ob-privacy-text">
                    <strong>Tu archivo nunca sale de tu ordenador.</strong> finio lo procesa localmente en tu navegador. No enviamos ningún dato a servidores externos ni pedimos credenciales bancarias.
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 4 }}>
                  <button
                    style={{ background: 'none', border: 'none', fontFamily: "'Poppins',sans-serif", fontSize: 13, color: 'var(--acento)', cursor: 'pointer', fontWeight: 500 }}
                    onClick={skipStep}
                  >
                    Prefiero añadir gastos manualmente →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: CATEGORÍAS */}
            {step === 4 && (
              <div>
                <div className="ob-step-eyebrow">Paso 4 — Opcional</div>
                <div className="ob-step-title">¿En qué sueles<br/>gastar más?</div>
                <div className="ob-step-sub">
                  Selecciona tus categorías principales para que finio configure los <strong>presupuestos recomendados</strong> automáticamente. Podrás editarlos después.
                </div>

                <div className="ob-cat-grid">
                  {categories.map((c, i) => (
                    <div key={i} className={`ob-cat-chip${c.selected ? ' selected' : ''}`} onClick={() => toggleCategory(i)}>
                      <span className="ob-cat-chip-emoji">{c.emoji}</span>
                      <span className="ob-cat-chip-name">{c.name}</span>
                    </div>
                  ))}
                </div>

                <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                  Seleccionadas: <strong style={{ color: 'var(--acento)' }}>{selectedCats.length}</strong> categorías
                </div>
              </div>
            )}

            {/* STEP 5: LISTO */}
            {step === 5 && (
              <div>
                <div className="ob-success-icon">🎉</div>
                <div className="ob-step-eyebrow">Todo listo</div>
                <div className="ob-step-title">Tu finio está<br/>configurado.</div>
                <div className="ob-step-sub" style={{ marginBottom: 24 }}>
                  Esto es lo que hemos preparado para ti:
                </div>

                <div className="ob-success-checklist">
                  <div className="ob-check-row">
                    <div className="ob-check-badge done">✓</div>
                    <div>
                      <div className="ob-check-text">Ingreso mensual configurado</div>
                      <div className="ob-check-sub">{ingresoNum > 0 ? `${ingresoNum.toLocaleString('es-ES')} € / mes` : 'No configurado'}</div>
                    </div>
                  </div>
                  <div className="ob-check-row">
                    <div className={`ob-check-badge ${totalFixed > 0 ? 'done' : 'skip'}`}>{totalFixed > 0 ? '✓' : '—'}</div>
                    <div>
                      <div className="ob-check-text">Gastos fijos registrados</div>
                      <div className="ob-check-sub">
                        {totalFixed > 0
                          ? fixed.filter(f => parseFloat((f.value || '').replace(/[^\d]/g, '')) > 0).map(f => f.name.split(' ')[0]).join(', ')
                          : 'Paso omitido'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="ob-check-row">
                    <div className="ob-check-badge skip">—</div>
                    <div>
                      <div className="ob-check-text">Extracto importado</div>
                      <div className="ob-check-sub">Podrás importarlo desde el dashboard</div>
                    </div>
                  </div>
                  <div className="ob-check-row">
                    <div className={`ob-check-badge ${selectedCats.length > 0 ? 'done' : 'skip'}`}>{selectedCats.length > 0 ? '✓' : '—'}</div>
                    <div>
                      <div className="ob-check-text">Categorías y presupuestos configurados</div>
                      <div className="ob-check-sub">
                        {selectedCats.length > 0
                          ? selectedCats.length <= 4
                            ? selectedCats.map(c => c.name).join(', ')
                            : `${selectedCats.slice(0, 3).map(c => c.name).join(', ')} y ${selectedCats.length - 3} más`
                          : 'Paso omitido'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg,#1A3D2A,#0D2418)',
                  borderRadius: 14, padding: '20px 22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(114,228,165,0.4)', marginBottom: 5 }}>
                      Tu margen disponible ahora
                    </div>
                    <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 40, fontWeight: 800, color: '#72E4A5', letterSpacing: '-2px', lineHeight: 1 }}>
                      {disponible > 0 ? `${disponible.toLocaleString('es-ES')} €` : '— €'}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 300, color: 'rgba(212,245,226,0.5)', maxWidth: 160, textAlign: 'right', lineHeight: 1.5 }}>
                    {ingresoNum > 0 ? (
                      <>Llevas el {Math.round((totalFixed / ingresoNum) * 100)}% del<br/>presupuesto en fijos.<br/><strong style={{ color: 'rgba(212,245,226,0.75)', fontWeight: 500 }}>Vas bien. 👍</strong></>
                    ) : (
                      <>Configura tu ingreso<br/>para ver tu margen.</>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="ob-footer">
          <button className="ob-back-btn" onClick={goBack} disabled={step === 0}>← Atrás</button>
          <button className="ob-next-btn" onClick={goNext} disabled={step === 1 && !canNext}>{nextLabel()}</button>
        </div>
      </div>
    </div>
  )
}
