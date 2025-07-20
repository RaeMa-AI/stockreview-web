"use client"

import type React from "react"
import type { Note, Trend } from "@/lib/data"

interface MappedNoteForChart {
  note: Note
  mappedDate: string
}

interface CustomDotProps {
  cx?: number
  cy?: number
  payload?: { date: string; price: number }
  index?: number
  mappedNotesForChart: MappedNoteForChart[]
  dateToNotesMap: Record<string, Note[]>
  onDotClick: (noteId: string) => void
}

const getTrendColor = (trend: Trend) => {
  switch (trend) {
    case "buy":
      return "hsl(142.1, 76.2%, 36.3%)" // 绿色
    case "sell":
      return "hsl(0, 84.2%, 60.2%)" // 红色
    case "hold":
      return "hsl(215.4, 16.3%, 46.9%)" // 灰色
    default:
      return "gray"
  }
}

export const CustomChartDot: React.FC<CustomDotProps> = ({ cx, cy, payload, mappedNotesForChart, dateToNotesMap, onDotClick }) => {
  if (typeof cx !== "number" || isNaN(cx) || typeof cy !== "number" || isNaN(cy) || !payload) {
    return null
  }
  if (typeof payload.date !== "string") {
    return null
  }
  if (typeof payload.price !== "number" || isNaN(payload.price)) {
    return null
  }

  // 只在该价格点有笔记时渲染圆点
  const notesForThisDate = dateToNotesMap[payload.date] || [];
  if (!notesForThisDate || notesForThisDate.length === 0) return null;

  const dotSpacing = 16 // px
  const total = notesForThisDate.length
  const centerOffset = (total - 1) / 2

  return (
    <g>
      {notesForThisDate.map((note, i) => (
        <g
          key={note.id || `${payload.date}-${i}`}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onDotClick(note.id)}
        >
          <circle
            cx={cx}
            cy={cy + (i - centerOffset) * dotSpacing}
            r={10}
            fill="transparent"
            stroke="transparent"
          />
          <circle
            cx={cx}
            cy={cy + (i - centerOffset) * dotSpacing}
            r={5}
            fill={getTrendColor(note.trend)}
            stroke={getTrendColor(note.trend)}
            strokeWidth={2}
          />
        </g>
      ))}
    </g>
  )
}
