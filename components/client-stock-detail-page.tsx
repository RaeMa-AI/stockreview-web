"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Plus, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import type { Note, UserStock } from "@/lib/data"
import { addStockToPortfolio, removeStockFromPortfolio, type FmpQuote, type HistoricalPrice } from "@/app/actions"
import NoteCard from "@/components/note-card"
import { CustomChartDot } from "@/components/custom-chart-dot"
import { CustomChartTooltip } from "@/components/custom-chart-tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface StockDisplayData extends UserStock {
  currentQuote?: FmpQuote | null
  historicalPrices?: HistoricalPrice[]
}

interface MappedNoteForChart {
  note: Note
  mappedDate: string
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
  const router = useRouter()
  const { toast } = useToast()

  const [stockData, setStockData] = useState<StockDisplayData>(initialStockData)
  const [priceHistory, setPriceHistory] = useState<HistoricalPrice[]>([])
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "1Y" | "ALL">("3M")
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [mappedNotesForChart, setMappedNotesForChart] = useState<MappedNoteForChart[]>([])
  const noteRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const notesListRef = useRef<HTMLDivElement>(null)
  const [isStockInPortfolio, setIsStockInPortfolio] = useState(!!initialStockData.id)
  const [isAddingOrDeleting, setIsAddingOrDeleting] = useState(false)

  useEffect(() => {
    const filtered = filterHistoricalData(initialHistoricalData, timeRange)
    setPriceHistory(filtered)
  }, [timeRange, initialHistoricalData])

  useEffect(() => {
    if (notes.length > 0 && priceHistory.length > 0) {
      const mapped: MappedNoteForChart[] = notes
        .map((note) => {
          let mappedDate: string | null = null
          const noteTimestamp = new Date(note.note_date).getTime()

          const exactMatch = priceHistory.find((dataPoint) => dataPoint.date === note.note_date)
          if (exactMatch) {
            mappedDate = exactMatch.date
          } else {
            let closestPrecedingDate: string | null = null
            let maxTimestamp = -1

            const sortedPriceHistory = [...priceHistory].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            )

            for (const dataPoint of sortedPriceHistory) {
              const dataTimestamp = new Date(dataPoint.date).getTime()
              if (dataTimestamp <= noteTimestamp && dataTimestamp > maxTimestamp) {
                maxTimestamp = dataTimestamp
                closestPrecedingDate = dataPoint.date
              }
            }
            mappedDate = closestPrecedingDate
          }
          return { note, mappedDate }
        })
        .filter((item) => item.mappedDate !== null) as MappedNoteForChart[]

      setMappedNotesForChart(mapped)
    } else {
      setMappedNotesForChart([])
    }
  }, [notes, priceHistory])

  const filterHistoricalData = (data: HistoricalPrice[], range: typeof timeRange) => {
    if (!data || data.length === 0) return []

    const now = new Date()
    const startDate = new Date(now)

    switch (range) {
      case "1M":
        startDate.setMonth(now.getMonth() - 1)
        break
      case "3M":
        startDate.setMonth(now.getMonth() - 3)
        break
      case "6M":
        startDate.setMonth(now.getMonth() - 6)
        break
      case "1Y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      case "ALL":
      default:
        return data
    }

    return data.filter((item) => new Date(item.date) >= startDate)
  }

  const handleDotClick = (noteId: string) => {
    const noteElement = noteRefs.current[noteId]
    const scrollContainer = notesListRef.current

    console.log("handleDotClick called for noteId:", noteId)
    console.log("noteElement:", noteElement)
    console.log("scrollContainer:", scrollContainer)

    if (noteElement && scrollContainer) {
      const notesListRect = scrollContainer.getBoundingClientRect()
      const noteRect = noteElement.getBoundingClientRect()

      console.log("notesListRect:", notesListRect)
      console.log("noteRect:", noteRect)

      // Calculate scroll offset to center the note in the scrollable area
      // This calculates the position of the note relative to the scroll container's top,
      // then adjusts to center it.
      const scrollOffset = noteRect.top - notesListRect.top - notesListRect.height / 2 + noteRect.height / 2

      console.log("Calculated scrollOffset:", scrollOffset)
      console.log("Current scrollContainer.scrollTop:", scrollContainer.scrollTop)
      console.log("scrollContainer.scrollHeight:", scrollContainer.scrollHeight)
      console.log("scrollContainer.clientHeight:", scrollContainer.clientHeight)

      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + scrollOffset,
        behavior: "smooth",
      })
    } else {
      console.warn("Could not scroll: noteElement or scrollContainer is null.")
    }
  }

  const handleAddStock = async () => {
    if (!userId || !stockData?.symbol || !stockData?.name) {
      toast({
        title: "错误",
        description: "无法添加股票：缺少用户ID或股票信息。",
        variant: "destructive",
      })
      return
    }
    setIsAddingOrDeleting(true)
    try {
      const addedStock = await addStockToPortfolio(userId, stockData.symbol, stockData.name)
      if (addedStock) {
        toast({
          title: "添加成功",
          description: `${stockData.name} (${stockData.symbol}) 已添加到您的投资组合。`,
        })
        setIsStockInPortfolio(true)
        setStockData((prev) => ({ ...prev, ...addedStock }))
      } else {
        toast({
          title: "添加失败",
          description: "添加股票时发生错误，可能已存在或API限制。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding stock:", error)
      toast({
        title: "添加失败",
        description: "添加股票时发生意外错误。",
        variant: "destructive",
      })
    } finally {
      setIsAddingOrDeleting(false)
    }
  }

  const handleDeleteStock = async () => {
    if (!userId || !stockData?.id || !stockData?.symbol) {
      toast({
        title: "错误",
        description: "无法删除股票：缺少用户ID或股票信息。",
        variant: "destructive",
      })
      return
    }
    setIsAddingOrDeleting(true)
    try {
      const deleted = await removeStockFromPortfolio(stockData.id, userId, stockData.symbol)
      if (deleted) {
        toast({
          title: "删除成功",
          description: `${stockData.name || stockData.symbol} 已从您的投资组合中删除。笔记已保留。`,
        })
        setIsStockInPortfolio(false)
        router.push("/")
      } else {
        toast({
          title: "删除失败",
          description: "删除股票时发生错误。",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting stock:", error)
      toast({
        title: "删除失败",
        description: "删除股票时发生意外错误。",
        variant: "destructive",
      })
    } finally {
      setIsAddingOrDeleting(false)
    }
  }

  const quote = stockData.currentQuote
  const lastAddedDate = stockData.last_added_date

  return (
    <div className="h-screen flex flex-col container mx-auto max-w-6xl">
      {/* Header is outside the main scrollable content area */}
      <div className="p-6 flex justify-between items-center flex-shrink-0">
        <Link href="/">
          <Button variant="outline" className="bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回股票列表
          </Button>
        </Link>
        <div className="flex gap-2">
          {isStockInPortfolio ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isAddingOrDeleting}>
                  {isAddingOrDeleting ? (
                    "删除中..."
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      删除股票
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确定要删除此股票吗？</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将从您的投资组合中移除 {stockData.name || stockData.symbol}。
                    **与此股票相关的笔记将不会被删除。**
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteStock} disabled={isAddingOrDeleting}>
                    {isAddingOrDeleting ? "删除中..." : "确认删除"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={handleAddStock} disabled={isAddingOrDeleting}>
              {isAddingOrDeleting ? (
                "添加中..."
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  添加股票
                </>
              )}
            </Button>
          )}
          <Link href={`/stock/${stockData.symbol}/notes/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              添加笔记
            </Button>
          </Link>
        </div>
      </div>

      {/* Main content area that will manage its own overflow */}
      <main className="px-6 pb-6 flex flex-col flex-grow overflow-hidden">
        {/* Fixed Stock Basic Info Card */}
        <Card className="grid gap-6 mb-4 flex-shrink-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-3xl">{stockData.symbol}</CardTitle>
                <p className="text-muted-foreground mt-1">{stockData.name}</p>
                {lastAddedDate && <p className="text-sm text-muted-foreground mt-2">最近添加时间: {lastAddedDate}</p>}
              </div>
              <div className="text-right">
                {quote && quote.price !== undefined && quote.price !== null && quote.price !== 0 ? (
                  <>
                    <div className="text-4xl font-bold mb-2">${quote.price.toFixed(2)}</div>
                    <div
                      className={`flex items-center gap-2 justify-end ${
                        (quote.change ?? 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {(quote.change ?? 0) >= 0 ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                      <span className="text-xl font-semibold">
                        {(quote.change ?? 0) >= 0 ? "+" : ""}
                        {(quote.change ?? 0).toFixed(2)}
                      </span>
                      <span className="text-lg">
                        {(quote.changesPercentage ?? 0) >= 0 ? "+" : ""}
                        {(quote.changesPercentage ?? 0).toFixed(2)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground text-sm">价格数据不可用</div>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Fixed Historical Price Chart Card */}
        <Card className="mb-4 flex-shrink-0 h-[40vh] overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                历史价格走势
              </CardTitle>
              <div className="flex gap-2">
                {(["1M", "3M", "6M", "1Y", "ALL"] as const).map((range) => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-full">
            <ChartContainer
              config={{
                price: {
                  label: "价格",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-full w-full mx-auto"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={priceHistory} margin={{ top: 5, right: 20, left: 20, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
                    }
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, dy: 10 }}
                    interval="preserveStartEnd"
                    padding={{ left: 20, right: 20 }}
                    axisLine={true}
                    tickLine={true}
                  />
                  <YAxis domain={["auto", "auto"]} tickFormatter={(value) => `$${value.toFixed(0)}`} />
                  <ChartTooltip
                    content={({ active, payload, label }) => (
                      <CustomChartTooltip
                        active={active}
                        payload={payload}
                        label={label}
                        mappedNotesForChart={mappedNotesForChart}
                      />
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="var(--color-price)"
                    strokeWidth={2}
                    dot={({ cx, cy, payload, index }) => (
                      <CustomChartDot
                        cx={cx}
                        cy={cy}
                        payload={payload}
                        index={index}
                        mappedNotesForChart={mappedNotesForChart}
                        onDotClick={handleDotClick}
                      />
                    )}
                    // Removed activeDot as dot prop now handles all rendering
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Scrollable Notes Section */}
        <div
          ref={notesListRef} // Ref is correctly placed here
          className="flex-grow overflow-y-auto bg-card text-card-foreground rounded-lg shadow-sm min-h-0"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">股票笔记</h2>
            <div className="pr-2">
              {notes.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">暂无笔记，点击右上角添加。</p>
              ) : (
                <div className="grid gap-4">
                  {notes.map((note) => (
                    <Link key={note.id} href={`/stock/${note.stock_symbol}/notes/${note.id}`}>
                      <NoteCard note={note} onClick={() => {}} ref={(el) => (noteRefs.current[note.id] = el)} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
