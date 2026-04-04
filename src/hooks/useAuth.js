import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for login/logout events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email) {
    const redirectTo = window.location.origin + (import.meta.env.BASE_URL || '/')
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  return { user, loading, signInWithEmail, signOut }
}
