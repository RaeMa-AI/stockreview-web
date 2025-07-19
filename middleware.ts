import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res }) // This is fine for Middleware

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // List of public paths that don't require authentication
  const publicPaths = ["/login", "/register", "/auth/callback"]

  // Check if the current path is a public path
  const isPublicPath = publicPaths.some((path) => req.nextUrl.pathname.startsWith(path))

  if (!session && !isPublicPath) {
    // Redirect to login if not authenticated and trying to access a protected path
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session && isPublicPath && req.nextUrl.pathname !== "/auth/callback") {
    // If authenticated and trying to access login/register, redirect to home
    return NextResponse.redirect(new URL("/", req.url))
  }

  return res
}

export const config = {
  matcher: ["/", "/login", "/register", "/stock/:path*", "/auth/callback"],
}
