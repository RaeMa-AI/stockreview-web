
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log("认证回调处理:", { code: !!code, next })

  if (code) {
    let supabaseResponse = NextResponse.redirect(`${origin}${next}`)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    console.log("代码交换结果:", { data: !!data, error })
    
    if (!error) {
      console.log("认证成功，重定向到:", `${origin}${next}`)
      return supabaseResponse
    } else {
      console.error("代码交换失败:", error)
    }
  }

  // return the user to an error page with instructions
  console.log("认证失败，重定向到错误页面")
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
