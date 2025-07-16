import { redirect } from "next/navigation"
import { getUserStocks, type UserStock } from "@/lib/data"
import { fetchAndCacheStockPrices } from "@/app/actions"
import { createServerClient } from "@/lib/supabase-server" // Changed import path
import ClientHomePage from "@/components/client-home-page"

interface StockDisplay extends UserStock {}

export default async function HomePage() {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const userStocks = await getUserStocks(user.id)

  const stocksWithLatestPrices: StockDisplay[] = await Promise.all(
    userStocks.map(async (stock) => {
      return await fetchAndCacheStockPrices(user.id, stock)
    }),
  )

  return <ClientHomePage initialStocks={stocksWithLatestPrices} userId={user.id} />
}
