import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

async function fetchProfile(userId) {
  if (!userId) return null
  // Use RPC to bypass RLS — returns [{role, subscription_status}] for current user
  const { data } = await supabase.rpc('finio_get_my_profile')
  return data?.[0] || null
}

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Safety: never stay loading more than 6 seconds
    const timeout = setTimeout(() => setLoading(false), 6000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      try {
        const p = await fetchProfile(u?.id)
        setProfile(p)
      } catch {
        setProfile(null)
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null
      setUser(u)
      try {
        const p = await fetchProfile(u?.id)
        setProfile(p)
      } catch {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email) {
    const redirectTo = window.location.origin + (import.meta.env.BASE_URL || '/')
    return supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo } })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return {
    user,
    loading,
    role: profile?.role ?? null,
    subscriptionStatus: profile?.subscription_status ?? null,
    signInWithEmail,
    signOut,
  }
}
