"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { addStockToPortfolio, removeStockFromPortfolio, searchFmpSymbols, revalidateHomePage } from "@/app/actions"
import type { UserStock, FmpSymbolSearchResult } from "@/lib/data" // Import UserStock type
import { formatCurrency } from "@/lib/utils" // Assuming you have a utility for currency formatting

interface ClientHomePageProps {
  initialStocks: UserStock[]
  userId: string
}

export default function ClientHomePage({ initialStocks, userId }: ClientHomePageProps) {
  const [stocks, setStocks] = useState<UserStock[]>(initialStocks)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<FmpSymbolSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingStock, setAddingStock] = useState<string | null>(null) // Stores symbol of stock being added
  const [removingStock, setRemovingStock] = useState<string | null>(null) // Stores ID of stock being removed

  // Memoize filtered stocks for performance
  const filteredStocks = useMemo(() => {
    if (!searchTerm) {
      return stocks
    }
    return stocks.filter(
      (stock) =>
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [stocks, searchTerm])

  // Handle search input change
  const handleSearchChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchTerm(query)
    if (query.length > 1) {
      setIsSearching(true)
      const results = await searchFmpSymbols(query)
      setSearchResults(results)
      setIsSearching(false)
    } else {
      setSearchResults([])
    }
  }, [])

  // Handle adding a stock to portfolio
  const handleAddStock = useCallback(
    async (symbol: string, name: string) => {
      setAddingStock(symbol)
      const newStock = await addStockToPortfolio(userId, symbol, name)
      if (newStock) {
        setStocks((prevStocks) => {
          // Check if stock already exists to prevent duplicates in UI state
          if (!prevStocks.some((s) => s.symbol === newStock.symbol)) {
            return [...prevStocks, newStock].sort((a, b) => a.symbol.localeCompare(b.symbol))
          }
          return prevStocks
        })
        setSearchTerm("") // Clear search
        setSearchResults([]) // Clear search results
        await revalidateHomePage() // Revalidate server cache
      }
      setAddingStock(null)
    },
    [userId],
  )

  // Handle removing a stock from portfolio
  const handleRemoveStock = useCallback(
    async (stockId: string, symbol: string) => {
      if (window.confirm(`确定要从投资组合中删除 ${symbol} 吗？`)) {
        setRemovingStock(stockId)
        const success = await removeStockFromPortfolio(stockId, userId, symbol)
        if (success) {
          setStocks((prevStocks) => prevStocks.filter((stock) => stock.id !== stockId))
          await revalidateHomePage() // Revalidate server cache
        } else {
          alert("删除股票失败。请重试。")
        }
        setRemovingStock(null)
      }
    },
    [userId],
  )

  // Update stocks state when initialStocks prop changes (e.g., after revalidation)
  useEffect(() => {
    setStocks(initialStocks)
  }, [initialStocks])

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4 md:p-6">
      <div className="w-full max-w-4xl space-y-6">
        {/* Search and Add Stock Section */}
        <Card>
          <CardHeader>
            <CardTitle>添加股票</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="搜索股票代码或公司名称..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="flex-grow"
                />
                <Button type="button" disabled={isSearching}>
                  <Search className="h-4 w-4" />
                  <span className="sr-only">搜索</span>
                </Button>
              </div>
              {isSearching && searchTerm.length > 1 && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                  <div className="p-2 text-sm text-muted-foreground">搜索中...</div>
                </div>
              )}
              {searchResults.length > 0 && searchTerm.length > 1 && !isSearching && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.symbol}
                      className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold">{result.symbol}</div>
                        <div className="text-sm text-muted-foreground">{result.name}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddStock(result.symbol, result.name)}
                        disabled={addingStock === result.symbol || stocks.some((s) => s.symbol === result.symbol)}
                      >
                        {addingStock === result.symbol ? "添加中..." : "添加"}
                        <Plus className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              {searchTerm.length > 1 && searchResults.length === 0 && !isSearching && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-lg mt-1">
                  <div className="p-2 text-sm text-muted-foreground">无结果</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* My Stocks List */}
        <Card>
          <CardHeader>
            <CardTitle>我的股票</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {filteredStocks.length === 0 ? (
              <p className="text-center text-muted-foreground">
                {searchTerm ? "没有找到匹配的股票。" : "您还没有添加任何股票。"}
              </p>
            ) : (
              filteredStocks.map((stock) => (
                <div key={stock.id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <Link href={`/stock/${stock.symbol}`} className="flex items-center space-x-4 group">
                    <div className="font-semibold text-lg group-hover:underline">{stock.symbol}</div>
                    <div className="text-muted-foreground group-hover:text-foreground">{stock.name}</div>
                  </Link>
                  <div className="flex items-center space-x-4">
                    {stock.current_price !== undefined && stock.current_price !== null && (
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(stock.current_price)}</div>
                        {stock.price_change !== undefined &&
                          stock.price_change !== null &&
                          stock.price_change_percent !== undefined &&
                          stock.price_change_percent !== null && (
                            <div className={`text-sm ${stock.price_change >= 0 ? "text-green-500" : "text-red-500"}`}>
                              {stock.price_change >= 0 ? "+" : ""}
                              {stock.price_change.toFixed(2)} ({stock.price_change_percent >= 0 ? "+" : ""}
                              {stock.price_change_percent.toFixed(2)}%)
                            </div>
                          )}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveStock(stock.id, stock.symbol)}
                      disabled={removingStock === stock.id}
                    >
                      {removingStock === stock.id ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <Trash2 className="h-5 w-5 text-red-500" />
                      )}
                      <span className="sr-only">删除股票</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
