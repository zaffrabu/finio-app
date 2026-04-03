// Tipos en español + colores unificados según spec
const CONFIG = {
  Ingreso:  { label: 'Ingreso',  bg: '#EAF3DE', color: '#0F6E56' },
  Ahorro:   { label: 'Ahorro',   bg: '#FAEEDA', color: '#854F0B' },
  Fijo:     { label: 'Fijo',     bg: '#FAECE7', color: '#993C1D' },
  Variable: { label: 'Variable', bg: '#FAECE7', color: '#993C1D' },
  Deuda:    { label: 'Deuda',    bg: '#FAECE7', color: '#993C1D' },
  Neutro:   { label: 'Neutro',   bg: '#F3F4F6', color: '#6B7280' },
}

export default function TypeBadge({ tipo }) {
  if (!tipo) return null
  const cfg = CONFIG[tipo] ?? CONFIG.Variable
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  )
}
