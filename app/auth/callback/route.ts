import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

    if (sessionError) {
      console.error("Error exchanging code for session:", sessionError)
      // Handle error, maybe redirect to an error page
      return NextResponse.redirect(new URL("/login?error=auth_failed", request.url))
    }

    const user = sessionData.session?.user

    if (user) {
      // Check if user profile already exists
      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 means "No rows found"
        console.error("Error fetching user profile:", profileError)
        // Continue even if there's an error fetching profile, to not block login
      }

      if (!profile) {
        // If profile doesn't exist, create it
        const { error: insertError } = await supabase.from("user_profiles").insert({
          id: user.id,
          email: user.email,
          registered_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error("Error inserting user profile:", insertError)
          // Handle error, but don't block login if session is valid
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  // As requested, redirect to the login page after successful registration/activation
  return NextResponse.redirect(new URL("/login", request.url))
}
