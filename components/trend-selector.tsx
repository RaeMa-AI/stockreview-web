"use client"

import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Trend } from "@/lib/notes" // Assuming Trend type is defined here

interface TrendSelectorProps {
  initialTrend?: Trend
  onTrendChange: (trend: Trend) => void
}

export function TrendSelector({ initialTrend = "hold", onTrendChange }: TrendSelectorProps) {
  const [selectedTrend, setSelectedTrend] = useState<Trend>(initialTrend)

  const handleValueChange = (value: string) => {
    if (value) {
      setSelectedTrend(value as Trend)
      onTrendChange(value as Trend)
    }
  }

  return (
    <ToggleGroup
      type="single"
      value={selectedTrend}
      onValueChange={handleValueChange}
      className="grid grid-cols-3 gap-2"
    >
      <ToggleGroupItem value="buy" aria-label="Set trend to buy">
        买入
      </ToggleGroupItem>
      <ToggleGroupItem value="hold" aria-label="Set trend to hold">
        持有
      </ToggleGroupItem>
      <ToggleGroupItem value="sell" aria-label="Set trend to sell">
        卖出
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
