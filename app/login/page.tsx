"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { checkUserConfirmationStatus } from "@/app/actions" // Import the server action

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showResend, setShowResend] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // 在组件加载时验证配置
  useEffect(() => {
    const verifyConfig = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        console.log("初始 Supabase 配置验证:", { 
          hasData: !!data, 
          hasSession: !!data?.session,
          error: error?.message 
        })
      } catch (err) {
        console.error("Supabase 配置验证失败:", err)
      }
    }
    verifyConfig()
  }, [])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("认证状态变化:", event, session?.user?.email)
      if (event === 'SIGNED_IN' && session?.user) {
        console.log("检测到登录状态变化，准备跳转")
        router.replace("/")
      }
    })

    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    setShowResend(false)

    // 验证输入
    if (!email || !password) {
      setError("请输入邮箱和密码")
      setLoading(false)
      return
    }

    console.log("=== 开始登录流程 ===")
    console.log("邮箱:", email)
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("当前 URL:", window.location.href)

    try {
      // 首先检查 Supabase 连接
      const { data: connectionTest, error: connectionError } = await supabase.auth.getSession()
      console.log("Supabase 连接测试:", { connectionTest, connectionError })

      if (connectionError) {
        console.error("Supabase 连接失败:", connectionError)
        setError("连接服务器失败，请检查网络连接")
        return
      }

      // 尝试登录
      console.log("发送登录请求...")
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      console.log("登录响应:", { 
        authData: authData ? {
          user: authData.user ? { id: authData.user.id, email: authData.user.email } : null,
          session: authData.session ? { access_token: !!authData.session.access_token } : null
        } : null, 
        signInError 
      })

      if (signInError) {
        console.error("=== 登录错误详情 ===")
        console.error("错误代码:", signInError.code)
        console.error("错误消息:", signInError.message)
        console.error("错误状态:", signInError.status)
        
        // 处理不同类型的错误
        if (signInError.message.includes("Email not confirmed") || 
            signInError.message.includes("email_not_confirmed") ||
            signInError.code === "email_not_confirmed") {
          setError("您的邮箱尚未确认。请检查您的收件箱以获取确认链接。")
          setShowResend(true)
        } else if (signInError.message.includes("Invalid login credentials") ||
                   signInError.code === "invalid_credentials") {
          setError("邮箱或密码错误，请检查后重试。")
        } else if (signInError.message.includes("too many requests") ||
                   signInError.code === "too_many_requests") {
          setError("请求过于频繁，请稍后再试。")
        } else {
          setError(`登录失败: ${signInError.message}`)
        }
        return
      }

      // 登录成功，直接跳转（依赖 useEffect 中的 onAuthStateChange 处理）
      if (authData?.user) {
        console.log("=== 登录成功，用户数据:", { 
          id: authData.user.id, 
          email: authData.user.email 
        })
        setMessage("登录成功！正在跳转...")
        
        // 直接跳转，不需要额外的会话验证
        setTimeout(() => {
          console.log("执行页面跳转")
          router.replace("/")
        }, 500)
      } else {
        console.error("=== 登录失败：无用户数据 ===")
        setError("登录过程中出现异常，请重试")
      }

    } catch (err: any) {
      console.error("=== 登录过程异常 ===", err)
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError("网络连接失败，请检查网络或稍后重试")
      } else {
        setError(`登录过程中发生错误: ${err.message || "未知错误"}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      // Check if email is already confirmed before resending
      const confirmedAt = await checkUserConfirmationStatus(email)
      if (confirmedAt) {
        setMessage("您的邮箱已确认。请尝试登录。")
        setShowResend(false)
        setLoading(false)
        return
      }

      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (resendError) {
        setError(resendError.message)
      } else {
        setMessage("确认邮件已重新发送。请检查您的收件箱。")
        setShowResend(false) // Hide resend button after successful resend
      }
    } catch (err: any) {
      setError(err.message || "重新发送确认邮件失败。")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">登录</CardTitle>
          <CardDescription>输入您的邮箱和密码以登录账户。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-500 text-sm">{message}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
            {showResend && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResendConfirmation}
                className="w-full mt-2 bg-transparent"
                disabled={loading}
              >
                {loading ? "发送中..." : "重新发送确认邮件"}
              </Button>
            )}
          </form>
          <div className="text-center text-sm text-muted-foreground">
            还没有账户？{" "}
            <Link href="/register" className="underline">
              注册
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
