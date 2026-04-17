import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const DEFAULT_CATEGORIES = [
  { name: 'Comida', emoji: '🍔', color: '#FF6B5B', budget: 160, tipo: 'Variable' },
  { name: 'Supermercado', emoji: '🛒', color: '#72E4A5', budget: 300, tipo: 'Variable' },
  { name: 'Transporte', emoji: '🚇', color: '#2EB87A', budget: 80, tipo: 'Variable' },
  { name: 'Ocio', emoji: '🎉', color: '#FFB830', budget: 100, tipo: 'Variable' },
  { name: 'Salud', emoji: '💊', color: '#4FC9EF', budget: 60, tipo: 'Variable' },
  { name: 'Suscripciones', emoji: '📺', color: '#9B8FFF', budget: 80, tipo: 'Fijo' },
  { name: 'Hogar', emoji: '🏠', color: '#D4F5E2', budget: 850, tipo: 'Fijo' },
  { name: 'Otros', emoji: '📦', color: '#8A8A8A', budget: null, tipo: 'Variable' },
]

export function useUserCategories(userId) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      const { data, error } = await supabase
        .from('user_categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at')

      if (!error && data && data.length > 0) {
        setCategories(data)
      } else {
        setCategories([])
      }
      setLoading(false)
    }
    load()
  }, [userId])

  const insertDefaults = useCallback(async (selectedNames = null) => {
    if (!userId) return

    // Fetch existing names to avoid duplicates
    const { data: existing } = await supabase
      .from('user_categories')
      .select('name')
      .eq('user_id', userId)

    const existingNames = new Set((existing || []).map(c => c.name.toLowerCase()))

    const toInsert = DEFAULT_CATEGORIES
      .filter(c => !selectedNames || selectedNames.includes(c.name))
      .filter(c => !existingNames.has(c.name.toLowerCase())) // skip already existing
      .map(c => ({ ...c, user_id: userId, custom: false, keywords: [] }))

    if (toInsert.length === 0) return { data: [], error: null }

    const { data, error } = await supabase
      .from('user_categories')
      .insert(toInsert)
      .select()

    if (!error && data) {
      setCategories(prev => [...prev, ...data])
    }
    return { data, error }
  }, [userId])

  const addCategory = useCallback(async ({ name, emoji, color, budget, tipo, parent_id }) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('user_categories')
      .insert({ user_id: userId, name, emoji, color, budget, tipo, parent_id: parent_id || null, custom: true, keywords: [] })
      .select()
      .single()

    if (!error && data) {
      setCategories(prev => [...prev, data])
    }
    return { data, error }
  }, [userId])

  const updateCategory = useCallback(async (id, changes) => {
    if (!userId) return
    const { data, error } = await supabase
      .from('user_categories')
      .update(changes)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (!error && data) {
      setCategories(prev => prev.map(c => c.id === id ? data : c))
    }
    return { data, error }
  }, [userId])

  const deleteCategory = useCallback(async (id) => {
    if (!userId) return
    const { error } = await supabase
      .from('user_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (!error) {
      setCategories(prev => prev.filter(c => c.id !== id))
    }
    return { error }
  }, [userId])

  const categoryNames = categories.map(c => c.name)
  const colorMap = Object.fromEntries(categories.map(c => [c.name, c.color]))

  return {
    categories,
    categoryNames,
    colorMap,
    loading,
    insertDefaults,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}
