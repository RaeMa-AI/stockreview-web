
import { createServerClient as createSSRServerClient } from '@supabase/ssr'
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Server-side Supabase client (for authenticated user actions, uses anon key)
export const createServerClient = async () => {
  const cookieStore = await cookies()

  return createSSRServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
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
