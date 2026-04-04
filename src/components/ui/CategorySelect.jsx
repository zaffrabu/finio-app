import { CATEGORIES } from '../../data/sampleData'

// Accepts either:
//   categories       – array of strings (flat list, backward compat)
//   categoryObjects  – array of {name, parent} objects (enables optgroup grouping)
export default function CategorySelect({ value, onChange, categories, categoryObjects }) {
  const cls = "text-sm border border-border rounded px-2 py-1 bg-white text-primary focus:outline-none focus:border-tri-400 focus:ring-1 focus:ring-tri-400/20 transition-colors"

  if (categoryObjects && categoryObjects.length > 0) {
    // Build optgroups: top-level categories first, then subcategories grouped by parent
    const parents  = new Set(categoryObjects.map(c => c.parent).filter(Boolean))
    const ungrouped = categoryObjects.filter(c => !c.parent && !parents.has(c.name))
    const parentCats = categoryObjects.filter(c => !c.parent && parents.has(c.name))

    return (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className={cls}>
        <option value="">Sin categoría</option>
        {ungrouped.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
        {parentCats.map(p => {
          const subs = categoryObjects.filter(c => c.parent === p.name)
          return (
            <optgroup key={p.name} label={p.name}>
              {subs.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </optgroup>
          )
        })}
      </select>
    )
  }

  const cats = categories || CATEGORIES
  return (
    <select value={value || ''} onChange={e => onChange(e.target.value)} className={cls}>
      <option value="">Sin categoría</option>
      {cats.map(cat => <option key={cat} value={cat}>{cat}</option>)}
    </select>
  )
}
