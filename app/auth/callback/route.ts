
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')

  console.log("=== 认证回调处理 ===", { 
    code: !!code, 
    next, 
    error,
    url: request.url 
  })

  // 如果有错误参数，直接重定向到登录页面
  if (error) {
    console.log("认证回调包含错误:", error)
    return NextResponse.redirect(`${origin}/login?error=${error}`)
  }

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

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      console.log("代码交换结果:", { 
        hasData: !!data, 
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        error: exchangeError 
      })
      
      if (!exchangeError && data?.session) {
        console.log("认证成功，重定向到:", `${origin}${next}`)
        return supabaseResponse
      } else {
        console.error("代码交换失败:", exchangeError)
        return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
      }
    } catch (err) {
      console.error("代码交换异常:", err)
      return NextResponse.redirect(`${origin}/login?error=exchange_error`)
    }
  }

  // 没有代码参数，重定向到登录页面
  console.log("没有授权代码，重定向到登录页面")
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}
