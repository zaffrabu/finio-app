import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    title: 'Sube tu extracto bancario',
    description: 'Importa tu CSV o Excel del banco. Finio detecta automáticamente el formato BBVA, Santander, CaixaBank y más.',
    action: 'Subir extracto',
    route: '/subir',
    color: '#185FA5',
    bg: '#EFF6FF',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    ),
    title: 'Revisa y ajusta categorías',
    description: 'Finio categoriza automáticamente tus gastos. Puedes corregir cualquier categoría y crear las tuyas propias.',
    action: 'Ver categorías',
    route: '/categorias',
    color: '#0F6E56',
    bg: '#EAF3DE',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10"/>
        <path d="M12 6v6l4 2"/>
        <circle cx="18" cy="6" r="3" fill="currentColor" stroke="none"/>
      </svg>
    ),
    title: 'Habla con Finio Coach',
    description: 'Tu asesor financiero con IA analiza tus datos reales, genera planes de acción y te ayuda a ahorrar más.',
    action: 'Abrir Coach',
    route: '/coach',
    color: '#854F0B',
    bg: '#FAEEDA',
  },
]

export default function Onboarding({ onDismiss }) {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  function handleAction(route) {
    onDismiss()
    navigate(route)
  }

  const current = STEPS[step]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Card */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ backgroundColor: current.color }} />

        <div className="px-6 pt-6 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === step ? 20 : 8,
                    height: 8,
                    backgroundColor: i === step ? current.color : '#E2EEF1',
                  }}
                />
              ))}
            </div>
            <button
              onClick={onDismiss}
              className="text-xs text-muted hover:text-secondary transition-colors px-2 py-1"
            >
              Saltar
            </button>
          </div>

          {/* Step content */}
          <div className="flex flex-col items-center text-center px-2">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ backgroundColor: current.bg, color: current.color }}
            >
              {current.icon}
            </div>

            {/* Step indicator */}
            <p className="text-xs font-medium mb-2" style={{ color: current.color }}>
              Paso {step + 1} de {STEPS.length}
            </p>

            <h2 className="text-xl font-medium text-primary mb-3">{current.title}</h2>
            <p className="text-sm text-muted leading-relaxed max-w-sm">{current.description}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-2.5 text-sm rounded-xl border border-border text-secondary hover:bg-page transition-colors"
              >
                Anterior
              </button>
            )}
            <button
              onClick={() => handleAction(current.route)}
              className="flex-1 py-2.5 text-sm rounded-xl text-white font-medium transition-colors"
              style={{ backgroundColor: current.color }}
            >
              {current.action}
            </button>
            {step < STEPS.length - 1 && (
              <button
                onClick={() => setStep(s => s + 1)}
                className="flex-1 py-2.5 text-sm rounded-xl border border-border text-secondary hover:bg-page transition-colors"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
