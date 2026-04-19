import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// If credentials are missing (old cached build), expose a flag so UI can warn the user
export const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY)

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_KEY || 'placeholder',
  {
    auth: {
      persistSession: true,          // Keep session across browser restarts
      storageKey: 'finio-auth',      // Explicit key so PWA & browser share same storage
      storage: localStorage,         // Use localStorage (not sessionStorage) — survives PWA close
      autoRefreshToken: true,        // Refresh tokens automatically
      detectSessionInUrl: true,      // Handle OAuth redirects (magic links etc.)
    },
  }
)
