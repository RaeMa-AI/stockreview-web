import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Client-side Supabase client
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Add an explicit check for environment variables on the client side
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for the client-side.",
    )
  }

  return createClientComponentClient({
    supabaseUrl: supabaseUrl,
    supabaseKey: supabaseKey,
  })
}

// Server-side Supabase client
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Add an explicit check for environment variables
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
    )
  }

  return createServerComponentClient({
    cookies,
    supabaseUrl,
    supabaseKey,
  })
}
