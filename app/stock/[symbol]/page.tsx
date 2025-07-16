// NO "use client" directive here. This is a Server Component.
import { getNotesBySymbol, getStockForUser, type UserStock } from "@/lib/data"
import { getFmpQuote, getFmpHistoricalData, type FmpQuote, type HistoricalPrice } from "@/app/actions"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server" // Changed import path
import ClientStockDetailPage from "@/components/client-stock-detail-page" // 导入新的客户端组件

interface StockDisplayData extends UserStock {
  currentQuote?: FmpQuote | null
  historicalPrices?: HistoricalPrice[]
}

export default async function StockDetailPage({ params }: { params: { symbol: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const symbol = params.symbol.toUpperCase()
  const userId = user.id

  // 1. 获取用户股票信息
  const userStockEntry = await getStockForUser(symbol, userId)

  // 2. 获取实时报价
  const quote = await getFmpQuote(symbol)

  // 3. 获取历史数据 (默认获取一年数据)
  const todayDate = new Date()
  const to = todayDate.toISOString().split("T")[0]
  const fromDate = new Date(todayDate)
  fromDate.setFullYear(todayDate.getFullYear() - 1) // 默认获取一年数据
  const from = fromDate.toISOString().split("T")[0]
  const fullHistoricalData = await getFmpHistoricalData(symbol, from, to)

  // 4. 获取笔记
  const fetchedNotes = await getNotesBySymbol(symbol, userId)

  // 组合初始股票数据
  const initialStockData: StockDisplayData = {
    ...(userStockEntry || {
      id: "", // Provide default empty values if userStockEntry is null
      user_id: userId,
      symbol: symbol,
      name: symbol, // Fallback name
      last_added_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_price: null,
      price_change: null,
      price_change_percent: null,
      last_fetched_price_date: null,
    }),
    currentQuote: quote,
    historicalPrices: fullHistoricalData,
  }

  return (
    <ClientStockDetailPage
      initialStockData={initialStockData}
      initialNotes={fetchedNotes}
      initialHistoricalData={fullHistoricalData} // 传递完整的历史数据
      userId={userId}
      symbol={symbol}
    />
  )
}
