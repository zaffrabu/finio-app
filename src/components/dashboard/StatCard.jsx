// accent puede ser una clase Tailwind o un color hex (#xxxxxx)
export default function StatCard({ label, value, sub, accent }) {
  const isHex = accent && accent.startsWith('#')
  return (
    <div className="bg-card rounded-lg border border-border shadow-card px-5 py-4">
      <p className="text-xs text-muted font-medium mb-2">{label}</p>
      <p
        className={`text-2xl font-medium tabular tracking-tight ${!isHex ? (accent ?? 'text-primary') : ''}`}
        style={isHex ? { color: accent } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  )
}
