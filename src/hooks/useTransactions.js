import { useState, useEffect } from 'react'
import { sampleTransactions } from '../data/sampleData'
import { supabase } from '../lib/supabase'

const STORAGE_KEY = 'finio_transactions'

function localLoad() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function localSave(txs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(txs)) } catch {}
}

export function useTransactions(user) {
  const [transactions, setTransactions] = useState(() => user ? localLoad() : sampleTransactions)
  const [syncing, setSyncing]           = useState(true)

  useEffect(() => {
    async function load() {
      if (!user) {
        // Not logged in — show sample data
        setTransactions(sampleTransactions)
        setSyncing(false)
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (!error && data) {
        const merged = data.length > 0 ? data : localLoad()
        setTransactions(merged)
        if (data.length > 0) localSave(data)
      } else {
        setTransactions(localLoad())
      }
      setSyncing(false)
    }
    load()
  }, [user?.id])

  async function addTransactions(newItems) {
    const withIds = newItems.map(item => ({
      ...item,
      id: item.id || crypto.randomUUID(),
      user_id: user?.id || null,
    }))

    setTransactions(prev => {
      const next = [...withIds, ...prev]
      localSave(next)
      localStorage.setItem('finio_last_import', new Date().toISOString())
      return next
    })

    if (user) {
      const { error } = await supabase.from('transactions').insert(withIds)
      if (error) console.error('Supabase insert error:', error.message)
    }
  }

  async function updateCategory(id, category) {
    setTransactions(prev => {
      const next = prev.map(t => t.id === id ? { ...t, category } : t)
      localSave(next)
      return next
    })
    if (user) {
      const { error } = await supabase
        .from('transactions')
        .update({ category })
        .eq('id', id).eq('user_id', user.id)
      if (error) console.error('Supabase update error:', error.message)
    }
  }

  async function updateTransaction(id, changes) {
    setTransactions(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...changes } : t)
      localSave(next)
      return next
    })
    if (user) {
      const { error } = await supabase
        .from('transactions')
        .update(changes)
        .eq('id', id).eq('user_id', user.id)
      if (error) console.error('Supabase update error:', error.message)
    }
  }

  async function deleteTransaction(id) {
    setTransactions(prev => {
      const next = prev.filter(t => t.id !== id)
      localSave(next)
      return next
    })
    if (user) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id).eq('user_id', user.id)
      if (error) console.error('Supabase delete error:', error.message)
    }
  }

  async function deleteAllTransactions() {
    setTransactions([])
    localSave([])
    if (user) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
      if (error) console.error('Supabase delete all error:', error.message)
    }
  }

  return { transactions, addTransactions, updateCategory, updateTransaction, deleteTransaction, deleteAllTransactions, syncing }
}
