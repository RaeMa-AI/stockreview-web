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
  dateToNotesMap: Record<string, Note[]>
}

export const CustomChartTooltip: React.FC<CustomChartTooltipProps> = ({
  active,
  payload,
  label,
  mappedNotesForChart,
  dateToNotesMap,
}) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload // Get the full data object for the hovered point
    const date = dataPoint.date
    const price = dataPoint.price

    // Find当天所有笔记
    const notesForThisDate = dateToNotesMap[date] || []

    return (
      <Card className="p-3 shadow-lg border bg-background/95 backdrop-blur-sm">
        <div className="text-sm font-medium text-foreground">
          日期: {date ? new Date(date).toLocaleDateString("zh-CN") : "N/A"}
        </div>
        <div className="text-sm text-muted-foreground">
          价格: {typeof price === "number" ? `$${price.toFixed(2)}` : "N/A"}
        </div>
        {notesForThisDate.length > 0 && (
          <div className="mt-1 text-sm font-bold text-primary">
            {notesForThisDate.length === 1 ? (
              <>笔记: {notesForThisDate[0].title}</>
            ) : (
              <>
                笔记:
                <ul className="list-disc pl-4 mt-1">
                  {notesForThisDate.map((note) => (
                    <li key={note.id}>{note.title}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </Card>
    )
  }

  return null
}
