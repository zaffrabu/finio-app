import { CATEGORIES } from '../../data/sampleData'

export default function CategorySelect({ value, onChange }) {
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="text-sm border border-border rounded px-2 py-1 bg-white text-primary focus:outline-none focus:border-tri-400 focus:ring-1 focus:ring-tri-400/20 transition-colors"
    >
      <option value="">Sin categoría</option>
      {CATEGORIES.map(cat => (
        <option key={cat} value={cat}>{cat}</option>
      ))}
    </select>
  )
}
