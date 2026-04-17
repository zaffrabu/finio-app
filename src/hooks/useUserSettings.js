import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useUserSettings(userId) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (data) setSettings(data)
      if (error) console.error('[useUserSettings] load error:', error.message)
      setLoading(false)
    }
    load()
  }, [userId])

  const saveSettings = useCallback(async (updates = {}) => {
    if (!userId) return { error: new Error('No userId') }

    const payload = {
      income:       updates.income       ?? settings?.income       ?? 0,
      income_type:  updates.income_type  ?? settings?.income_type  ?? 'regular',
      pay_day:      updates.pay_day      ?? settings?.pay_day      ?? '1',
      fixed_expenses: updates.fixed_expenses ?? settings?.fixed_expenses ?? [],
    }

    // Try UPDATE first; if no row exists, INSERT
    const { data: updated, error: updateErr } = await supabase
      .from('user_settings')
      .update(payload)
      .eq('user_id', userId)
      .select()
      .maybeSingle()

    if (!updateErr && updated) {
      setSettings(updated)
      return { data: updated, error: null }
    }

    // No row yet — insert
    const { data: inserted, error: insertErr } = await supabase
      .from('user_settings')
      .insert({ user_id: userId, ...payload })
      .select()
      .single()

    if (!insertErr && inserted) {
      setSettings(inserted)
      return { data: inserted, error: null }
    }

    const err = insertErr || updateErr
    console.error('[useUserSettings] save error:', err?.message, payload)
    return { data: null, error: err }
  }, [userId, settings])

  const updateIncome        = useCallback((income)         => saveSettings({ income }),         [saveSettings])
  const updateFixedExpenses = useCallback((fixed_expenses) => saveSettings({ fixed_expenses }), [saveSettings])

  return {
    settings,
    loading,
    saveSettings,
    updateIncome,
    updateFixedExpenses,
  }
}
