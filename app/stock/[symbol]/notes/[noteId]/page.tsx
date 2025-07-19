"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"
import type { Note, Trend } from "@/lib/data" // Only import types from lib/data
import { TrendSelector } from "@/components/trend-selector"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase-client" // Client-side Supabase client
import { getFmpQuote, getNoteByIdAction, saveNoteAction, deleteNoteAction, getStockForUserAction } from "@/app/actions" // Import all necessary Server Actions

export default function NoteEditPage({ params }: { params: { symbol: string; noteId: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient() // Uses the client-side Supabase client

  const { symbol, noteId } = params
  const isNewNote = noteId === "new"

  const [stockName, setStockName] = useState("")
  const [stockPrice, setStockPrice] = useState<number | null>(null)

  const [title, setTitle] = useState("")
  const [source, setSource] = useState("")
  const [trend, setTrend] = useState<Trend | undefined>(undefined)
  const [content, setContent] = useState("")
  const [createdAt, setCreatedAt] = useState("")
  const [updatedAt, setUpdatedAt] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      setUserId(user.id)

      const fmpQuote = await getFmpQuote(symbol)
      if (fmpQuote && fmpQuote.price !== undefined && fmpQuote.price !== null && fmpQuote.price !== 0) {
        setStockName(symbol)
        setStockPrice(fmpQuote.price)
      } else {
        // Fallback to user's stored stock data if FMP quote fails or is zero
        // Call the new Server Action to get user stock
        const userStock = await getStockForUserAction(symbol, user.id)
        if (userStock) {
          setStockName(userStock.name)
          setStockPrice(userStock.current_price || null)
        } else {
          setStockName(symbol)
          setStockPrice(null)
        }
      }

      if (!isNewNote) {
        // Call the new Server Action to get note by ID
        const existingNote = await getNoteByIdAction(noteId, user.id)
        if (existingNote) {
          setTitle(existingNote.title)
          setSource(existingNote.source || "")
          setTrend(existingNote.trend)
          setContent(existingNote.content || "")
          setCreatedAt(existingNote.created_at)
          setUpdatedAt(existingNote.updated_at)
        } else {
          toast({
            title: "错误",
            description: "未找到该笔记。",
            variant: "destructive",
          })
          router.push(`/stock/${symbol}`)
        }
      } else {
        const now = new Date().toISOString()
        setCreatedAt(now)
        setUpdatedAt(now)
        setTrend("hold")
      }
      setLoading(false)
    }
    fetchData()
  }, [noteId, isNewNote, symbol, router, toast, supabase])

  const handleSave = async () => {
    if (!userId) {
      toast({
        title: "错误",
        description: "用户未登录。",
        variant: "destructive",
      })
      return
    }
    if (!title.trim()) {
      toast({
        title: "保存失败",
        description: "笔记标题不能为空。",
        variant: "destructive",
      })
      return
    }
    if (!trend) {
      toast({
        title: "保存失败",
        description: "请选择趋势。",
        variant: "destructive",
      })
      return
    }

    const noteDate = new Date().toISOString().split("T")[0]

    const noteToSave: Omit<Note, "id" | "created_at" | "updated_at"> & {
      id?: string
      created_at?: string
      updated_at?: string
    } = {
      id: isNewNote ? undefined : noteId,
      user_id: userId,
      stock_symbol: symbol,
      title: title.trim(),
      source: source.trim() || undefined,
      trend: trend,
      content: content.trim() || undefined,
      created_at: isNewNote ? new Date().toISOString() : createdAt,
      updated_at: new Date().toISOString(),
      note_date: noteDate,
    }

    // Call the new Server Action to save note
    const saved = await saveNoteAction(noteToSave)
    if (saved) {
      toast({
        title: "保存成功",
        description: "笔记已保存。",
      })
      router.push(`/stock/${symbol}`)
    } else {
      toast({
        title: "保存失败",
        description: "保存笔记时发生错误。",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!userId) {
      toast({
        title: "错误",
        description: "用户未登录。",
        variant: "destructive",
      })
      return
    }
    if (confirm("确定要删除这篇笔记吗？")) {
      // Call the new Server Action to delete note
      const deleted = await deleteNoteAction(noteId, userId)
      if (deleted) {
        toast({
          title: "删除成功",
          description: "笔记已删除。",
        })
        router.push(`/stock/${symbol}`)
      } else {
        toast({
          title: "删除失败",
          description: "删除笔记时发生错误。",
        })
      }
    }
  }

  if (loading) {
    return <div className="container mx-auto p-6">加载中...</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <Link href={`/stock/${symbol}`}>
          <Button variant="outline" className="bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        {!isNewNote && (
          <Button variant="destructive" onClick={handleDelete}>
            删除笔记
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          {/* Removed the large CardTitle as requested */}
          <div className="text-muted-foreground text-sm mt-2">
            <p>
              股票: {stockName} ({symbol}) {stockPrice !== null ? `$${stockPrice.toFixed(2)}` : ""}
            </p>
            <p>创建时间: {createdAt ? new Date(createdAt).toLocaleString("zh-CN") : "N/A"}</p>
            <p>最近修改: {updatedAt ? new Date(updatedAt).toLocaleString("zh-CN") : "N/A"}</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                标题 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="笔记标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-2xl" // Added text-2xl class
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="source">笔记来源 (选填)</Label>
              <Input
                id="source"
                placeholder="例如: 研报, 新闻, 个人分析"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>
                趋势 <span className="text-red-500">*</span>
              </Label>
              <TrendSelector value={trend} onChange={setTrend} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="content">详细内容 (选填)</Label>
              <Textarea
                id="content"
                placeholder="输入笔记详细内容..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
              />
            </div>
            <Button onClick={handleSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              保存笔记
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
