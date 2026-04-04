import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

async function fetchProfile() {
  try {
    const { data, error } = await supabase.rpc('finio_get_my_profile')
    if (error) throw error
    return data?.[0] || null
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        const p = await fetchProfile()
        setProfile(p)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    const timeout = setTimeout(() => setLoading(false), 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return {
    user,
    loading,
    role: profile?.role ?? null,
    subscriptionStatus: profile?.subscription_status ?? null,
    profileFound: profile !== null,
    signIn,
    signUp,
    signOut,
  }
}
