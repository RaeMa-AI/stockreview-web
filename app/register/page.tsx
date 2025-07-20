"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { checkUserConfirmationStatus } from "@/app/actions" // 导入新的 Server Action

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null) // 新增状态用于页面级错误
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setPageError(null) // 清除之前的页面错误

    console.log("--- 注册尝试开始 ---")
    console.log("输入邮箱:", email)

    // 1. 密码确认校验
    if (password !== confirmPassword) {
      console.log("密码确认失败: 两次密码不一致")
      toast({
        title: "注册失败",
        description: "两次输入的密码不一致。",
        variant: "destructive",
      })
      setLoading(false)
      return
    }
    console.log("密码确认成功")

    // 2. **新增步骤：** 在尝试注册前，先通过 Server Action 检查邮箱是否已激活
    console.log("调用 Server Action checkUserConfirmationStatus 检查邮箱激活状态...")
    let confirmedAt = null
    try {
      confirmedAt = await checkUserConfirmationStatus(email)
      console.log("checkUserConfirmationStatus 返回:", confirmedAt)
    } catch (error: any) {
      console.error("调用 checkUserConfirmationStatus Server Action 失败:", error)
      setPageError(`无法验证邮箱状态: ${error.message || "未知错误"}`)
      toast({
        title: "操作失败",
        description: "无法验证邮箱状态，请检查网络或稍后重试。",
        variant: "destructive",
      })
      setLoading(false)
      return // 阻止后续操作
    }

    if (confirmedAt) {
      console.log("判断为: 邮箱已注册且已激活 (通过 Server Action 确认)")
      toast({
        title: "邮箱已注册",
        description: "该邮箱已注册且已激活，请直接登录。",
        variant: "default",
      })
      router.push("/login")
      setLoading(false)
      return
    }

    // 3. 如果邮箱未激活或不存在，则尝试注册新用户
    console.log("调用 supabase.auth.signUp...")
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    console.log("supabase.auth.signUp 返回结果:")
    console.log("signUpData:", signUpData)
    console.log("signUpError:", signUpError)

    if (signUpError) {
      console.log("进入 signUpError 处理分支")
      console.error("Supabase signUp error:", signUpError.message)
      // 4. 处理注册错误
      if (
        signUpError.message.includes("User already registered") ||
        signUpError.message.includes("User already exists")
      ) {
        console.log("错误类型: 邮箱已注册/已存在 (通过 signUp 错误确认)")
        toast({
          title: "邮箱已注册",
          description: "该邮箱已注册，请登录。",
          variant: "destructive",
        })
        router.push("/login")
      } else if (
        signUpError.message.includes("Email rate limit exceeded") ||
        signUpError.message.includes("For security purposes")
      ) {
        console.log("错误类型: 邮件发送频率限制")
        toast({
          title: "认证邮件已发送",
          description: "请前往邮箱确认，如果未收到请稍后再试。",
        })
      } else {
        console.log("错误类型: 其他注册错误")
        // 其他通用注册错误
        toast({
          title: "注册失败",
          description: signUpError.message,
          variant: "destructive",
        })
      }
    } else {
      console.log("进入 signUp 成功处理分支 (signUpError 为 null)")
      // 5. 注册成功 (signUpError 为 null)。
      // 此时，根据之前的 Server Action 结果，我们知道用户不是已激活的。
      // 所以这里一定是新用户注册或未激活用户重新发送确认邮件。
      console.log("判断为: 新用户注册或未激活用户重新发送确认邮件")
      toast({
        title: "注册成功",
        description: "认证邮件已发送，请前往邮箱激活账号。",
      })
      router.push("/login")
    }
    setLoading(false)
    console.log("--- 注册尝试结束 ---")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">注册</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="grid gap-4">
            {pageError && ( // 显示页面级错误
              <div className="text-red-500 text-center text-sm mb-4">{pageError}</div>
            )}
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
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">确认密码</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "注册中..." : "注册"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            已有账号？{" "}
            <Link href="/login" className="underline">
              登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
