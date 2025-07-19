import { createClient } from "@supabase/supabase-js"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs" // Corrected import path
import { cookies } from "next/headers"

// Server-side Supabase client (for authenticated user actions, uses anon key)
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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

// New: Server-side Supabase client with Service Role Key (for admin-like actions)
// This client bypasses Row Level Security (RLS) and should ONLY be used in secure server environments (e.g., Server Actions).
export const createAdminServerClient = (schema: "public" | "auth" = "public") => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for admin client.",
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    db: {
      schema: schema,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
