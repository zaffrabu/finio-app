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
        const local = localLoad()

        if (data.length === 0 && local.length === 0) {
          // Nothing anywhere
          setTransactions([])
        } else {
          // Merge: Supabase rows + any local rows not yet in Supabase (by id)
          const supabaseIds = new Set(data.map(t => t.id))
          const localOnly   = local.filter(t => t.id && !supabaseIds.has(t.id))
          const merged      = [...data, ...localOnly]
            .sort((a, b) => new Date(b.date) - new Date(a.date))

          setTransactions(merged)
          localSave(merged)

          // 🔄 Push local-only rows to Supabase if any
          if (localOnly.length > 0) {
            console.log(`[sync] auto-uploading ${localOnly.length} local-only rows`)
            setCloudSyncing(true)
            const withUser = localOnly.map(t => ({
              ...t,
              user_id: user.id,
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

  // Full resync: wipe Supabase for this user, then re-upload everything from current state
  const fullResync = useCallback(async (currentTxs) => {
    if (!user || !supabaseReady) return { synced: 0, error: 'No disponible' }
    setCloudSyncing(true)

    // 1. Delete everything from Supabase for this user
    const { error: delError } = await supabase
      .from('transactions').delete().eq('user_id', user.id)
    if (delError) {
      console.error('[fullResync] delete error:', delError.message)
      setCloudSyncing(false)
      return { synced: 0, error: delError.message }
    }

    // 2. Upload all current transactions
    const rows = (currentTxs || localLoad()).map(t => ({
      ...t,
      user_id: user.id,
      id: t.id || crypto.randomUUID(),
    }))
    if (rows.length === 0) { setCloudSyncing(false); return { synced: 0 } }

    await insertBatched(rows)

    // 3. Confirm count from Supabase
    const { data: remoteData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (remoteData && remoteData.length > 0) {
      setTransactions(remoteData)
      localSave(remoteData)
    }

    setCloudSyncing(false)
    setCloudSyncDone(true)
    return { synced: remoteData?.length ?? rows.length }
  }, [user])

  // Manual sync trigger (from Settings button)
  const syncToCloud = useCallback(async () => {
    if (!user || !supabaseReady) return { synced: 0, error: 'No disponible' }
    setCloudSyncing(true)
    const local = localLoad()
    if (local.length === 0) { setCloudSyncing(false); return { synced: 0 } }
    const withUser = local.map(t => ({ ...t, user_id: user.id, id: t.id || crypto.randomUUID() }))
    await insertBatched(withUser)

    // After upload, re-fetch from Supabase to get the real count
    // Only replace local state if Supabase now has at least as many rows (upload succeeded fully)
    const { data: remoteData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    if (remoteData && remoteData.length >= withUser.length) {
      setTransactions(remoteData)
      localSave(remoteData)
    }
    // If Supabase has fewer rows than local, keep local state intact

    setCloudSyncing(false)
    setCloudSyncDone(true)
    return { synced: remoteData?.length ?? withUser.length }
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
    deleteTransaction, deleteAllTransactions, syncToCloud, fullResync,
  }
}
