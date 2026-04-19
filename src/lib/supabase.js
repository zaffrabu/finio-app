import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
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
