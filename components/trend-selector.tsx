"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import type { Trend } from "@/lib/data" // Changed import path
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TrendSelectorProps {
  value: Trend | undefined
  onChange: (trend: Trend) => void
  className?: string
}

export function TrendSelector({ value, onChange, className }: TrendSelectorProps) {
  const trends: { label: string; value: Trend; icon: React.ReactNode; colorClass: string }[] = [
    { label: "Hold", value: "hold", icon: <Minus className="h-4 w-4 mr-2" />, colorClass: "text-muted-foreground" },
    { label: "Sell", value: "sell", icon: <TrendingDown className="h-4 w-4 mr-2" />, colorClass: "text-destructive" },
    { label: "Buy", value: "buy", icon: <TrendingUp className="h-4 w-4 mr-2" />, colorClass: "text-success" },
  ]

  return (
    <div className={cn("flex gap-2", className)}>
      {trends.map((trendOption) => (
        <Button
          key={trendOption.value}
          variant={value === trendOption.value ? "default" : "outline"}
          className={cn(
            "flex-1",
            value === trendOption.value && trendOption.colorClass,
            value === trendOption.value && "font-bold border-2",
          )}
          onClick={() => onChange(trendOption.value)}
        >
          {trendOption.icon}
          {trendOption.label}
        </Button>
      ))}
    </div>
  )
}
