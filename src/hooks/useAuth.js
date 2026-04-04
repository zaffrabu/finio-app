import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

async function fetchProfile(userId) {
  if (!userId) return null
  try {
    const { data, error } = await supabase.rpc('finio_get_my_profile')
    if (error) throw error
    return data?.[0] || null
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser]               = useState(null)
  const [profile, setProfile]         = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setAuthLoading(false)

      if (u) {
        const p = await fetchProfile(u.id)
        setProfile(p)
      }
      setProfileLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) {
        setProfileLoading(true)
        const p = await fetchProfile(u.id)
        setProfile(p)
        setProfileLoading(false)
      } else {
        setProfile(null)
        setProfileLoading(false)
      }
    })

    // Safety timeout — never stay loading more than 8s
    const timeout = setTimeout(() => {
      setAuthLoading(false)
      setProfileLoading(false)
    }, 8000)

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
    loading: authLoading || profileLoading,
    role: profile?.role ?? null,
    subscriptionStatus: profile?.subscription_status ?? null,
    profileFound: profile !== null,
    signInWithEmail,
    signOut,
  }
}
