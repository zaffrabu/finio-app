import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

async function fetchProfile(userId) {
  if (!userId) return null
  const { data } = await supabase
    .from('finio_profiles')
    .select('role, subscription_status')
    .eq('id', userId)
    .single()
  return data || null
}

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      const p = await fetchProfile(u?.id)
      setProfile(p)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const u = session?.user ?? null
      setUser(u)
      const p = await fetchProfile(u?.id)
      setProfile(p)
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
