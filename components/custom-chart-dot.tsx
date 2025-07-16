import { Dot } from "recharts"
import type { Note } from "@/lib/data" // Assuming Note type is defined here

interface CustomChartDotProps {
  cx?: number
  cy?: number
  payload?: { date: string; price: number }
  notes?: Note[]
}

export function CustomChartDot({ cx, cy, payload, notes }: CustomChartDotProps) {
  if (!cx || !cy || !payload || !notes) {
    return null
  }

  const noteForDate = notes.find((note) => note.note_date === payload.date)

  if (noteForDate) {
    let color = "#8884d8" // Default color
    if (noteForDate.trend === "buy") {
      color = "#10B981" // Green for buy
    } else if (noteForDate.trend === "sell") {
      color = "#EF4444" // Red for sell
    } else if (noteForDate.trend === "hold") {
      color = "#F59E0B" // Amber for hold
    }

    return <Dot cx={cx} cy={cy} r={5} fill={color} stroke={color} strokeWidth={2} />
  }

  return null
}
