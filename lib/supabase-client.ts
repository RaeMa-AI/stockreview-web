"use client"

import { createBrowserClient } from "@supabase/ssr"

// Client-side Supabase client (for browser-side authenticated user actions)
// This client is initialized once and reused across the client-side.
let supabase: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
      )
    }

    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabase
}
