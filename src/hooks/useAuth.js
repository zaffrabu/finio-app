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
    // Single listener handles both initial session and future changes
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

    // Safety timeout
    const timeout = setTimeout(() => setLoading(false), 8000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
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
    profileFound: profile !== null,
    signInWithEmail,
    signOut,
  }
}
