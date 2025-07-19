"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card" // Fixed import syntax
import type { Note, Trend } from "@/lib/data" // Changed import path
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface NoteCardProps {
  note: Note
  onClick: (noteId: string) => void
}

const getTrendIcon = (trend: Trend) => {
  switch (trend) {
    case "buy":
      return <TrendingUp className="h-4 w-4 text-success" />
    case "sell":
      return <TrendingDown className="h-4 w-4 text-destructive" />
    case "hold":
      return <Minus className="h-4 w-4 text-muted-foreground" />
    default:
      return null
  }
}

const NoteCard = React.forwardRef<HTMLDivElement, NoteCardProps>(({ note, onClick }, ref) => {
  return (
    <Card ref={ref} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onClick(note.id)}>
      <CardContent className="p-4 relative">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-lg font-semibold line-clamp-1 pr-8">{note.title}</h4>
          <div className="absolute top-4 right-4">{getTrendIcon(note.trend)}</div>
        </div>
        {note.content && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{note.content}</p>}
        {note.source && <p className="text-xs text-muted-foreground italic line-clamp-1">来源: {note.source}</p>}
        <div className="text-xs text-right text-muted-foreground mt-2">
          创建于: {new Date(note.created_at).toLocaleDateString("zh-CN")} {/* Changed to created_at */}
        </div>
      </CardContent>
    </Card>
  )
})

NoteCard.displayName = "NoteCard"

export default NoteCard
