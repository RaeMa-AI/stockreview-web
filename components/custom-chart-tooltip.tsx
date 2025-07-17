import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    name: string
    color: string
    payload: { date: string; price: number }
  }>
  label?: string
}

export function CustomChartTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className={cn("rounded-lg border bg-background p-2 text-sm shadow-md")}>
        <p className="font-bold">{format(new Date(data.date), "yyyy年MM月dd日")}</p>
        <p className="text-muted-foreground">
          价格: <span className="font-semibold text-foreground">${data.price?.toFixed(2)}</span>
        </p>
      </div>
    )
  }

  return null
}
