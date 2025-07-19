import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Client-side Supabase client
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
