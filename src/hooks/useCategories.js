import { useState, useCallback } from 'react'
import { CATEGORIES as DEFAULT_CATS, BUDGETS as DEFAULT_BUDGETS } from '../data/sampleData'
import { CATEGORY_COLORS } from '../components/ui/CategoryDot'

const STORAGE_KEY = 'finio_categories'

// Palette for new user-created categories
const COLOR_PALETTE = [
  '#0ea5e9','#8b5cf6','#f59e0b','#10b981','#ef4444',
  '#ec4899','#14b8a6','#f97316','#6366f1','#84cc16',
]

function buildDefaults() {
  return DEFAULT_CATS.map(name => {
    const budget = DEFAULT_BUDGETS.find(b => b.category === name)
    return {
      name,
      color:    CATEGORY_COLORS[name] ?? '#9CA3AF',
      budget:   budget?.budget ?? null,
      tipo:     budget?.tipo   ?? 'Variable',
      keywords: [],
      parent:   null,
      custom:   false,
    }
  })
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return buildDefaults()
    const saved = JSON.parse(raw)
    // Merge: always include defaults + user additions
    const defaults = buildDefaults()
    const userCustom = saved.filter(c => c.custom)
    const merged = defaults.map(d => {
      const override = saved.find(s => s.name === d.name)
      return override ? { ...d, ...override, custom: false } : d
    })
    userCustom.forEach(c => {
      if (!merged.find(m => m.name === c.name)) merged.push(c)
    })
    return merged
  } catch {
    return buildDefaults()
  }
}

function save(cats) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cats)) } catch {}
}

export function useCategories() {
  const [categories, setCategories] = useState(load)

  const addCategory = useCallback(({ name, budget, tipo, color, keywords, parent }) => {
    setCategories(prev => {
      if (prev.find(c => c.name.toLowerCase() === name.toLowerCase())) return prev
      const usedColors = prev.map(c => c.color)
      const autoColor = color || COLOR_PALETTE.find(c => !usedColors.includes(c)) || '#9CA3AF'
      const next = [...prev, {
        name: name.trim(),
        color: autoColor,
        budget: budget ? parseFloat(budget) : null,
        tipo:   tipo || 'Variable',
        keywords: keywords || [],
        parent: parent || null,
        custom: true,
      }]
      save(next)
      return next
    })
  }, [])

  const updateCategory = useCallback((name, changes) => {
    setCategories(prev => {
      const next = prev.map(c => c.name === name ? { ...c, ...changes } : c)
      save(next)
      return next
    })
  }, [])

  const deleteCategory = useCallback((name) => {
    setCategories(prev => {
      const next = prev.filter(c => c.name !== name || !c.custom)
      save(next)
      return next
    })
  }, [])

  // Derived lists compatible with old sampleData shape
  const categoryNames = categories.map(c => c.name)
  const budgets = categories
    .filter(c => c.budget)
    .map(c => ({ category: c.name, budget: c.budget, tipo: c.tipo }))
  const colorMap = Object.fromEntries(categories.map(c => [c.name, c.color]))

  return { categories, categoryNames, budgets, colorMap, addCategory, updateCategory, deleteCategory }
}
