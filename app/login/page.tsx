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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push("/")
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

    console.log("开始登录过程，邮箱:", email)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("登录响应:", { data, signInError })

      if (signInError) {
        console.error("登录错误:", signInError)
        if (signInError.message.includes("Email not confirmed") || 
            signInError.message.includes("email_not_confirmed")) {
          setError("您的邮箱尚未确认。请检查您的收件箱以获取确认链接。")
          setShowResend(true)
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("邮箱或密码错误，请检查后重试。")
        } else {
          setError(`登录失败: ${signInError.message}`)
        }
      } else {
        console.log("登录成功，检查会话状态...")
        // 检查用户会话状态
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        console.log("会话数据:", { sessionData, sessionError })
        
        if (sessionData?.session) {
          setMessage("登录成功！正在跳转...")
          console.log("会话确认成功，开始跳转")
          // 短暂延迟确保状态更新
          setTimeout(() => {
            router.replace("/")
          }, 500)
        } else {
          setError("登录过程中出现异常，请重试。")
          console.error("会话验证失败:", sessionError)
        }
      }
    } catch (err: any) {
      console.error("登录异常:", err)
      setError(`登录过程中发生错误: ${err.message || "未知错误"}`)
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
