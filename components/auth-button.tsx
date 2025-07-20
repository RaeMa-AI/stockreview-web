"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase-client" // Changed import path
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AuthButton() {
  const router = useRouter()
  const supabase = createClient() // Uses the client-side Supabase client
  const { toast } = useToast()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "登出失败",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "登出成功",
        description: "您已成功登出。",
      })
      router.push("/login")
      router.refresh() // Refresh to clear session
    }
  }

  return (
    <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2 bg-transparent">
      <LogOut className="h-4 w-4" />
      登出
    </Button>
  )
}
