"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import type { Note, Trend } from "@/lib/data" // Import Trend type
import { deleteNoteAction } from "@/app/actions" // Import server action for deletion
import { useRouter } from "next/navigation"
import { useState } from "react"

interface NoteCardProps {
  note: Note
  stockSymbol: string
}

export function NoteCard({ note, stockSymbol }: NoteCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (window.confirm("确定要删除此笔记吗？")) {
      setIsDeleting(true)
      const success = await deleteNoteAction(note.id, note.user_id)
      if (success) {
        // Revalidation handled by the server action
        router.refresh() // Refresh the current route to refetch notes
      } else {
        alert("删除笔记失败。请重试。")
      }
      setIsDeleting(false)
    }
  }

  const getTrendColor = (trend: Trend) => {
    switch (trend) {
      case "buy":
        return "text-green-500"
      case "sell":
        return "text-red-500"
      case "hold":
        return "text-yellow-500"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">{note.title}</CardTitle>
          <CardDescription className="text-sm">
            {note.source && <span className="mr-2">来源: {note.source}</span>}
            <span className="text-muted-foreground">{format(new Date(note.note_date), "yyyy年MM月dd日")}</span>
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-semibold ${getTrendColor(note.trend)}`}>
            {note.trend === "buy" ? "买入" : note.trend === "sell" ? "卖出" : "持有"}
          </span>
          <Link href={`/stock/${stockSymbol}/notes/${note.id}`}>
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
              <span className="sr-only">编辑笔记</span>
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <Trash2 className="h-4 w-4 text-red-500" />
            )}
            <span className="sr-only">删除笔记</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <p className="text-sm text-muted-foreground">{note.content}</p>
      </CardContent>
    </Card>
  )
}
