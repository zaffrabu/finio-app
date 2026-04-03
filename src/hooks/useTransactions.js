import { useState, useEffect } from 'react'
import { sampleTransactions } from '../data/sampleData'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'finio_transactions'

function localLoad() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : sampleTransactions
  } catch {
    return sampleTransactions
  }
}

function localSave(txs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(txs)) } catch {}
}

export function useTransactions() {
  const [transactions, setTransactions] = useState(localLoad)
  const [syncing, setSyncing]           = useState(true)

  // On mount — load from Supabase; fall back to localStorage if empty or error
  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })

      if (!error && data && data.length > 0) {
        setTransactions(data)
        localSave(data)
      }
      setSyncing(false)
    }
    load()
  }, [])

  async function addTransactions(newItems) {
    const withIds = newItems.map(item => ({
      ...item,
      id: crypto.randomUUID(),
    }))

    // Optimistic update
    setTransactions(prev => {
      const next = [...withIds, ...prev]
      localSave(next)
      return next
    })

    const { error } = await supabase.from('transactions').insert(withIds)
    if (error) console.error('Supabase insert error:', error.message)
  }

  async function updateCategory(id, category) {
    setTransactions(prev => {
      const next = prev.map(t => (t.id === id ? { ...t, category } : t))
      localSave(next)
      return next
    })

    const { error } = await supabase
      .from('transactions')
      .update({ category })
      .eq('id', id)
    if (error) console.error('Supabase update error:', error.message)
  }

  return { transactions, addTransactions, updateCategory, syncing }
}
