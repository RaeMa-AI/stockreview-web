"use client"

import { createBrowserClient } from "@supabase/ssr"

// Client-side Supabase client (for browser-side authenticated user actions)
// This client is initialized once and reused across the client-side.
let supabase: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("Supabase 配置检查:", { 
      url: supabaseUrl ? "已设置" : "未设置", 
      key: supabaseAnonKey ? "已设置" : "未设置" 
    })

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Supabase environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
      )
    }

    supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
    
    console.log("Supabase 客户端已创建")
  }
  return supabase
}
