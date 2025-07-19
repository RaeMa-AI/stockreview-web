"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client" // Changed import path
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient() // Uses the client-side Supabase client
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid Refresh Token: Refresh Token Not Found")) {
          toast({
            title: "会话错误",
            description: "您的会话已过期或损坏。请尝试清除浏览器缓存和Cookie，然后重试。",
            variant: "destructive",
            duration: 8000, // Give user time to read
          })
          // Attempt to sign out to clear local storage, then refresh
          await supabase.auth.signOut()
          router.refresh()
        } else {
          toast({
            title: "登录失败",
            description: error.message,
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "登录成功",
          description: "您已成功登录。",
        })
        router.push("/")
        router.refresh() // Refresh to update session
      }
    } catch (e: any) {
      // Catch any other unexpected errors during the sign-in process
      if (e.message.includes("Invalid Refresh Token: Refresh Token Not Found")) {
        toast({
          title: "会话错误",
          description: "您的会话已过期或损坏。请尝试清除浏览器缓存和Cookie，然后重试。",
          variant: "destructive",
          duration: 8000,
        })
        await supabase.auth.signOut()
        router.refresh()
      } else {
        toast({
          title: "登录失败",
          description: e.message || "发生未知错误。",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">登录</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
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
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            没有账号？{" "}
            <Link href="/register" className="underline">
              注册
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
