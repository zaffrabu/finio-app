/**
 * Busca en userCategories la mejor coincidencia para un texto dado.
 * Prioridad: exacta → texto contiene nombre → nombre contiene texto
 */
export function matchUserCategory(text, userCategories) {
  if (!text || !userCategories.length) return null
  const norm = s => s.toLowerCase().trim().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  const t = norm(text)
  const exact    = userCategories.find(c => norm(c.name) === t)
  if (exact) return exact
  const contains = userCategories.find(c => t.includes(norm(c.name)) && norm(c.name).length >= 3)
  if (contains) return contains
  const inside   = userCategories.find(c => norm(c.name).includes(t) && t.length >= 3)
  if (inside) return inside
  return null
}
