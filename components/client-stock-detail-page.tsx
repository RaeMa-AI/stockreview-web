"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { format } from "date-fns"
import { NoteCard } from "@/components/note-card"
import { Plus, CalendarDays } from "lucide-react"
import Link from "next/link"
import { CustomChartTooltip } from "@/components/custom-chart-tooltip"
import { CustomChartDot } from "@/components/custom-chart-dot"
import {
  getFmpHistoricalData,
  getFmpQuote,
  getStockForUserAction,
  revalidateStockPage,
  type FmpQuote,
  type HistoricalPrice,
} from "@/app/actions"
import type { Note, UserStock } from "@/lib/data"
import { formatCurrency } from "@/lib/utils"

interface StockDisplayData extends UserStock {
  currentQuote?: FmpQuote | null
  historicalPrices?: HistoricalPrice[]
}

interface ClientStockDetailPageProps {
  initialStockData: StockDisplayData
  initialNotes: Note[]
  initialHistoricalData: HistoricalPrice[]
  userId: string
  symbol: string
}

export default function ClientStockDetailPage({
  initialStockData,
  initialNotes,
  initialHistoricalData,
  userId,
  symbol,
}: ClientStockDetailPageProps) {
  const [stockData, setStockData] = useState<StockDisplayData>(initialStockData)
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [historicalData, setHistoricalData] = useState<HistoricalPrice[]>(initialHistoricalData)
  const [timeRange, setTimeRange] = useState<string>("1Y") // Default to 1 year

  // Update state when initial props change (e.g., after server revalidation)
  useEffect(() => {
    setStockData(initialStockData)
    setNotes(initialNotes)
    setHistoricalData(initialHistoricalData)
  }, [initialStockData, initialNotes, initialHistoricalData])

  const fetchHistoricalData = useCallback(
    async (range: string) => {
      const todayDate = new Date()
      const to = format(todayDate, "yyyy-MM-dd")
      const fromDate = new Date(todayDate)

      switch (range) {
        case "1M":
          fromDate.setMonth(todayDate.getMonth() - 1)
          break
        case "3M":
          fromDate.setMonth(todayDate.getMonth() - 3)
          break
        case "6M":
          fromDate.setMonth(todayDate.getMonth() - 6)
          break
        case "1Y":
          fromDate.setFullYear(todayDate.getFullYear() - 1)
          break
        case "ALL":
          // For "ALL", we might need to fetch from a very early date or handle large datasets
          // For now, let's set a reasonable large range, e.g., 5 years, or rely on FMP's default if 'from' is too early
          fromDate.setFullYear(todayDate.getFullYear() - 5) // Example: 5 years for ALL
          break
        default:
          fromDate.setFullYear(todayDate.getFullYear() - 1) // Default to 1 year
      }
      const from = format(fromDate, "yyyy-MM-dd")

      const newHistoricalData = await getFmpHistoricalData(symbol, from, to)
      setHistoricalData(newHistoricalData)
      setTimeRange(range)
      await revalidateStockPage(symbol) // Revalidate server cache for this page
    },
    [symbol],
  )

  const refreshStockData = useCallback(async () => {
    const latestQuote = await getFmpQuote(symbol)
    const latestStockEntry = await getStockForUserAction(symbol, userId) // Fetch latest cached data

    setStockData((prev) => ({
      ...prev,
      ...latestStockEntry, // Update cached price data
      currentQuote: latestQuote, // Update real-time quote
    }))
    await revalidateStockPage(symbol) // Revalidate server cache for this page
  }, [symbol, userId])

  // Filter notes to only show those relevant to the current historical data range
  const notesInDateRange = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return []
    const minDate = new Date(historicalData[0].date)
    const maxDate = new Date(historicalData[historicalData.length - 1].date)

    return notes.filter((note) => {
      const noteDate = new Date(note.note_date)
      return noteDate >= minDate && noteDate <= maxDate
    })
  }, [notes, historicalData])

  const chartData = useMemo(() => {
    return historicalData.map((dataPoint) => ({
      date: dataPoint.date,
      price: dataPoint.price,
    }))
  }, [historicalData])

  const priceChange = stockData.currentQuote?.change ?? stockData.price_change ?? null
  const priceChangePercent = stockData.currentQuote?.changesPercentage ?? stockData.price_change_percent ?? null

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 md:p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Stock Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-2xl md:text-3xl">{stockData.symbol}</CardTitle>
              <div className="text-muted-foreground text-lg md:text-xl">{stockData.name}</div>
            </div>
            <Button onClick={refreshStockData} variant="outline" size="sm">
              刷新
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <div className="text-4xl md:text-5xl font-bold">
                {formatCurrency(stockData.currentQuote?.price ?? stockData.current_price ?? 0)}
              </div>
              {priceChange !== null && priceChangePercent !== null && (
                <div
                  className={`text-xl md:text-2xl font-semibold ${
                    priceChange >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {priceChange >= 0 ? "+" : ""}
                  {priceChange.toFixed(2)} ({priceChangePercent >= 0 ? "+" : ""}
                  {priceChangePercent.toFixed(2)}%)
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              上次更新:{" "}
              {stockData.currentQuote?.timestamp
                ? format(new Date(stockData.currentQuote.timestamp * 1000), "yyyy年MM月dd日 HH:mm")
                : stockData.last_fetched_price_date
                  ? format(new Date(stockData.last_fetched_price_date), "yyyy年MM月dd日")
                  : "N/A"}
            </div>
          </CardContent>
        </Card>

        {/* Historical Price Chart */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 pt-4">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 mb-2 sm:mb-0">
              <CalendarDays className="h-5 w-5" />
              历史价格走势
            </CardTitle>
            <div className="flex flex-wrap gap-2 justify-end sm:justify-start overflow-x-auto pb-2 sm:pb-0">
              <Button
                variant={timeRange === "1M" ? "default" : "outline"}
                onClick={() => fetchHistoricalData("1M")}
                size="sm"
                className="flex-shrink-0"
              >
                1M
              </Button>
              <Button
                variant={timeRange === "3M" ? "default" : "outline"}
                onClick={() => fetchHistoricalData("3M")}
                size="sm"
                className="flex-shrink-0"
              >
                3M
              </Button>
              <Button
                variant={timeRange === "6M" ? "default" : "outline"}
                onClick={() => fetchHistoricalData("6M")}
                size="sm"
                className="flex-shrink-0"
              >
                6M
              </Button>
              <Button
                variant={timeRange === "1Y" ? "default" : "outline"}
                onClick={() => fetchHistoricalData("1Y")}
                size="sm"
                className="flex-shrink-0"
              >
                1Y
              </Button>
              <Button
                variant={timeRange === "ALL" ? "default" : "outline"}
                onClick={() => fetchHistoricalData("ALL")}
                size="sm"
                className="flex-shrink-0"
              >
                ALL
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[400px] w-full pr-6">
            {historicalData && historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => format(new Date(value), "MM月dd日")}
                    minTickGap={30}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                    interval="preserveStartEnd"
                  />
                  <YAxis tickFormatter={(value) => `$${value.toFixed(0)}`} domain={["dataMin", "dataMax"]} width={80} />
                  <Tooltip content={<CustomChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={<CustomChartDot notes={notesInDateRange} />}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">无法加载历史数据。</div>
            )}
          </CardContent>
        </Card>

        {/* Stock Notes Section */}
        <Card className="mt-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>股票笔记</CardTitle>
            <Link href={`/stock/${symbol}/notes/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加笔记
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="grid gap-4">
            {notes.length === 0 ? (
              <p className="text-center text-muted-foreground">还没有笔记。点击“添加笔记”来创建第一个笔记。</p>
            ) : (
              notes.map((note) => <NoteCard key={note.id} note={note} stockSymbol={symbol} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
