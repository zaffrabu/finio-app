import { useState, useEffect, useCallback } from 'react'
import { sampleTransactions } from '../data/sampleData'
import { supabase, supabaseReady } from '../lib/supabase'

const STORAGE_KEY = 'finio_transactions'
const BATCH_SIZE  = 400   // Supabase insert batch limit

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

// Only include columns that exist in the Supabase transactions table
const SUPABASE_COLS = ['id', 'user_id', 'date', 'description', 'detail', 'amount', 'category', 'tipo', 'account', 'status']

function toSupabaseRow(t) {
  const row = {}
  for (const col of SUPABASE_COLS) {
    if (t[col] !== undefined) row[col] = t[col]
  }
  return row
}

async function insertBatched(rows) {
  let totalErrors = 0
  // Filter out rows missing required fields, then strip unknown columns
  const clean = rows
    .filter(r => r.date && r.amount !== undefined && r.amount !== null)
    .map(toSupabaseRow)

  for (let i = 0; i < clean.length; i += BATCH_SIZE) {
    const batch = clean.slice(i, i + BATCH_SIZE)
    // upsert handles duplicates gracefully (no error on conflict)
    const { error } = await supabase
      .from('transactions')
      .upsert(batch, { onConflict: 'id', ignoreDuplicates: true })

    if (error) {
      console.warn('[sync] batch upsert failed, retrying row-by-row:', error.message)
      // Fallback: insert one-by-one to skip just the bad rows
      for (const row of batch) {
        const { error: rowErr } = await supabase
          .from('transactions')
          .upsert([row], { onConflict: 'id', ignoreDuplicates: true })
        if (rowErr) {
          console.error('[sync] row error:', rowErr.message, rowErr.code, row.id)
          totalErrors++
        }
      }
    }
  }
  return totalErrors
}

export function useTransactions(user) {
  const [transactions, setTransactions]   = useState(() => user ? localLoad() : sampleTransactions)
  const [syncing, setSyncing]             = useState(true)
  const [cloudSyncing, setCloudSyncing]   = useState(false)  // uploading local → Supabase
  const [cloudSyncDone, setCloudSyncDone] = useState(false)

  useEffect(() => {
    async function load() {
      if (!user || !supabaseReady) {
        setTransactions(user ? localLoad() : sampleTransactions)
        setSyncing(false)
        return
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (!error && data) {
        if (data.length > 0) {
          // ✅ Supabase has data — use it as source of truth
          setTransactions(data)
          localSave(data)
        } else {
          // Supabase is empty — load from local cache
          const local = localLoad()
          setTransactions(local)

          // 🔄 Auto-sync: if local has data, push it to Supabase silently
          if (local.length > 0) {
            setCloudSyncing(true)
            const withUser = local.map(t => ({
              ...t,
              user_id: user.id,
              // ensure required fields are not null
              id: t.id || crypto.randomUUID(),
            }))
            await insertBatched(withUser)
            setCloudSyncing(false)
            setCloudSyncDone(true)
          }
        }
      } else {
        // Supabase error — fallback to local
        setTransactions(localLoad())
        console.error('[load] Supabase error:', error?.message)
      }

      setSyncing(false)
    }
    load()
  }, [user?.id])

  // Manual sync trigger (from Settings button)
  const syncToCloud = useCallback(async () => {
    if (!user || !supabaseReady) return { synced: 0, error: 'No disponible' }
    setCloudSyncing(true)
    const local = localLoad()
    if (local.length === 0) { setCloudSyncing(false); return { synced: 0 } }
    const withUser = local.map(t => ({ ...t, user_id: user.id, id: t.id || crypto.randomUUID() }))
    await insertBatched(withUser)

    // After upload, re-fetch from Supabase to get the real count & update state
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (!error && data) {
      setTransactions(data)
      localSave(data)
    }

    setCloudSyncing(false)
    setCloudSyncDone(true)
    return { synced: data?.length ?? withUser.length }
  }, [user])

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

    if (user && supabaseReady) {
      await insertBatched(withIds)
    }
  }

  async function updateCategory(id, category) {
    setTransactions(prev => {
      const next = prev.map(t => t.id === id ? { ...t, category } : t)
      localSave(next)
      return next
    })
    if (user && supabaseReady) {
      const { error } = await supabase
        .from('transactions').update({ category })
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
    if (user && supabaseReady) {
      const { error } = await supabase
        .from('transactions').update(changes)
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
    if (user && supabaseReady) {
      const { error } = await supabase
        .from('transactions').delete()
        .eq('id', id).eq('user_id', user.id)
      if (error) console.error('Supabase delete error:', error.message)
    }
  }

  async function deleteAllTransactions() {
    setTransactions([])
    localSave([])
    if (user && supabaseReady) {
      const { error } = await supabase
        .from('transactions').delete().eq('user_id', user.id)
      if (error) console.error('Supabase delete all error:', error.message)
    }
  }

  return {
    transactions, syncing, cloudSyncing, cloudSyncDone,
    addTransactions, updateCategory, updateTransaction,
    deleteTransaction, deleteAllTransactions, syncToCloud,
  }
}
