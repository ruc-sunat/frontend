import { createBrowserClient } from '@supabase/ssr'

type BrowserClient = ReturnType<typeof createBrowserClient>
const g = globalThis as typeof globalThis & { _supabase?: BrowserClient }

export const createClient = () => {
  if (!g._supabase) {
    g._supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return g._supabase
}
