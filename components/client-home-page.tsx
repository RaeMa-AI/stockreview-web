"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Search } from "lucide-react"
import Link from "next/link"
import type { UserStock } from "@/lib/data"
import { searchFmpSymbols, type FmpSymbolSearchResult } from "@/app/actions"
import AuthButton from "@/components/auth-button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { useToast } from "@/hooks/use-toast"

interface StockDisplay extends UserStock {}

interface ClientHomePageProps {
  initialStocks: StockDisplay[]
  userId: string
}

export default function ClientHomePage({ initialStocks, userId }: ClientHomePageProps) {
  const [stocks, setStocks] = useState<StockDisplay[]>(initialStocks)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<FmpSymbolSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setStocks(initialStocks)
  }, [initialStocks])

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length > 1) {
        setIsSearching(true)
        try {
          const results = await searchFmpSymbols(query)
          setSearchResults(results)
          setPopoverOpen(true)
        } catch (error) {
          console.error("Error searching symbols:", error)
          toast({
            title: "搜索失败",
            description: "无法获取股票搜索结果，请稍后重试。",
            variant: "destructive",
          })
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
        setPopoverOpen(false)
      }
    }, 300),
    [],
  )

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchTerm(query)
    debouncedSearch(query)
  }

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">股票查询系统</h1>
          <p className="text-muted-foreground">管理和跟踪您的股票投资组合</p>
        </div>
        <AuthButton />
      </div>

      <div className="mb-6">
        <Popover open={popoverOpen && searchResults.length > 0} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索股票代码或公司名称..."
                value={searchTerm}
                onChange={handleSearchInputChange}
                className="pl-10"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput
                placeholder="搜索股票..."
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="hidden"
              />
              <CommandList>
                {isSearching && <CommandEmpty>搜索中...</CommandEmpty>}
                {!isSearching && searchResults.length === 0 && searchTerm.length > 1 && (
                  <CommandEmpty>未找到匹配的股票。</CommandEmpty>
                )}
                <CommandGroup>
                  {searchResults.map((result) => (
                    <Link key={result.symbol} href={`/stock/${result.symbol}`} onClick={() => setPopoverOpen(false)}>
                      <CommandItem className="cursor-pointer">
                        <div className="flex flex-col">
                          <span className="font-semibold">{result.symbol}</span>
                          <span className="text-sm text-muted-foreground">{result.name}</span>
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground">{result.exchangeShortName}</span>
                      </CommandItem>
                    </Link>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid gap-4">
        {filteredStocks.map((stock) => (
          <Link key={stock.symbol} href={`/stock/${stock.symbol}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{stock.symbol}</h3>
                      <Badge variant="outline">{stock.name}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    {stock.current_price !== undefined && stock.current_price !== null ? (
                      <>
                        <div className="text-2xl font-bold mb-1">${stock.current_price.toFixed(2)}</div>
                        <div
                          className={`flex items-center gap-1 ${stock.price_change && stock.price_change >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {stock.price_change && stock.price_change >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {stock.price_change && stock.price_change >= 0 ? "+" : ""}
                            {stock.price_change?.toFixed(2)}
                          </span>
                          <span className="text-sm">
                            ({stock.price_change_percent && stock.price_change_percent >= 0 ? "+" : ""}
                            {stock.price_change_percent?.toFixed(2)}%)
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-muted-foreground text-sm">价格不可用，请检查API密钥或稍后重试。</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredStocks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{searchTerm ? "未找到匹配的股票" : "暂无股票数据，请添加股票"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeout: NodeJS.Timeout
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), delay)
  } as T
}
