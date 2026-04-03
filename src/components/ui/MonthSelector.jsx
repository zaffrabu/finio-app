export default function MonthSelector({ value, onChange }) {
  const now = new Date()
  const isCurrentMonth =
    value.getFullYear() === now.getFullYear() && value.getMonth() === now.getMonth()

  const label = value.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
  const display = label.charAt(0).toUpperCase() + label.slice(1)

  function prev() {
    onChange(new Date(value.getFullYear(), value.getMonth() - 1, 1))
  }

  function next() {
    if (isCurrentMonth) return
    onChange(new Date(value.getFullYear(), value.getMonth() + 1, 1))
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={prev}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-border/50 transition-colors"
        style={{ color: '#9CA3AF' }}
        aria-label="Mes anterior"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span className="text-sm text-muted select-none px-1 min-w-[112px] text-center">{display}</span>
      <button
        onClick={next}
        disabled={isCurrentMonth}
        className="w-5 h-5 flex items-center justify-center rounded hover:bg-border/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: '#9CA3AF' }}
        aria-label="Mes siguiente"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
