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
  onDotClick: (noteId: string) => void
}

const getTrendColor = (trend: Trend) => {
  switch (trend) {
    case "buy":
      return "hsl(var(--success))"
    case "sell":
      return "hsl(var(--destructive))"
    case "hold":
      return "hsl(var(--muted-foreground))"
    default:
      return "gray"
  }
}

export const CustomChartDot: React.FC<CustomDotProps> = ({ cx, cy, payload, mappedNotesForChart, onDotClick }) => {
  // console.log("CustomChartDot rendered. cx:", cx, "cy:", cy, "Payload:", payload)

  // Detailed check for invalid props
  if (typeof cx !== "number" || isNaN(cx) || typeof cy !== "number" || isNaN(cy) || !payload) {
    // console.error("CustomChartDot: Invalid cx, cy, or payload. Not rendering dot.", { cx, cy, payload })
    return null
  }
  if (typeof payload.date !== "string") {
    // console.error("CustomChartDot: Payload date is not a string:", payload.date)
    return null
  }
  if (typeof payload.price !== "number" || isNaN(payload.price)) {
    // console.error("CustomChartDot: Payload price is not a number or is NaN:", payload.price)
    return null
  }

  const noteForThisDate = mappedNotesForChart.find((mappedNote) => mappedNote.mappedDate === payload.date)?.note

  if (noteForThisDate) {
    // console.log("CustomChartDot: Drawing dot for date:", payload.date, "Note:", noteForThisDate.title)
    return (
      <g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => onDotClick(noteForThisDate.id)}>
        {/* Transparent larger circle for easier clicking */}
        <circle
          cx={cx}
          cy={cy}
          r={10} // Radius for the transparent hit area
          fill="transparent"
          stroke="transparent"
        />
        {/* Visible dot */}
        <circle
          cx={cx}
          cy={cy}
          r={5} // Visible dot radius
          fill={getTrendColor(noteForThisDate.trend)}
          stroke={getTrendColor(noteForThisDate.trend)}
          strokeWidth={2}
        />
      </g>
    )
  }

  return null
}
