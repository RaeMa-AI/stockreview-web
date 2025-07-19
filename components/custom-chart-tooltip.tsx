"use client"

import type React from "react"
import type { Note } from "@/lib/data"
import { Card } from "@/components/ui/card"

interface MappedNoteForChart {
  note: Note
  mappedDate: string
}

interface CustomChartTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      date: string
      price: number
      // Add other historical price properties if needed for display
    }
    dataKey: string
    name: string
    value: number
  }>
  label?: string // This is the date from XAxis
  mappedNotesForChart: MappedNoteForChart[]
}

export const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  label,
  mappedNotesForChart,
}) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload // Get the full data object for the hovered point
    const date = dataPoint.date
    const price = dataPoint.price

    // Find if there's a note for this date
    const noteForThisDate = mappedNotesForChart.find((mappedNote) => mappedNote.mappedDate === date)?.note

    return (
      <Card className="p-3 shadow-lg border bg-background/95 backdrop-blur-sm">
        <div className="text-sm font-medium text-foreground">
          日期: {date ? new Date(date).toLocaleDateString("zh-CN") : "N/A"}
        </div>
        <div className="text-sm text-muted-foreground">
          价格: {typeof price === "number" ? `$${price.toFixed(2)}` : "N/A"}
        </div>
        {noteForThisDate && <div className="mt-1 text-sm font-bold text-primary">笔记: {noteForThisDate.title}</div>}
      </Card>
    )
  }

  return null
}
