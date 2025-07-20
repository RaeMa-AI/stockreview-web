"use server"

import { revalidatePath } from "next/cache"
import {
  updateStockPrices,
  addStockToUser,
  deleteStockFromUser,
  type UserStock,
  getNoteById as getNoteByIdServer,
  saveNote as saveNoteServer,
  deleteNote as deleteNoteServer,
  getStockForUser as getStockForUserServer, // Import the server-side function
  type Note,
} from "@/lib/data" // Import server-side data functions

import { createAdminServerClient } from "@/lib/supabase-server" // 导入新的 admin 客户端

const FMP_API_KEY = process.env.FMP_API_KEY

if (!FMP_API_KEY) {
  console.warn("FMP_API_KEY is not set. Stock data will not be fetched from Financial Modeling Prep.")
}

export interface FmpQuote {
  symbol: string
  price: number
  changesPercentage: number
  change: number
  dayLow: number
  dayHigh: number
  open: number
  previousClose: number
  timestamp: number
}

interface FmpCompanyProfile {
  symbol: string
  profile: {
    companyName: string
  }
}

export interface HistoricalPrice {
  date: string // YYYY-MM-DD
  price: number // This is 'close' from FMP
  open: number
  high: number
  low: number
  volume: number
}

export interface FmpSymbolSearchResult {
  symbol: string
  name: string
  currency: string
  stockExchange: string
  exchangeShortName: string
}

export async function getFmpQuote(symbol: string): Promise<FmpQuote | null> {
  if (!FMP_API_KEY) {
    console.warn("FMP_API_KEY is not set. Cannot fetch quote from Financial Modeling Prep.")
    return null
  }

  const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`

  try {
    const response = await fetch(url, { next: { revalidate: 60 } })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `FMP Quote API Error for ${symbol}: Status ${response.status} ${response.statusText}, Body: ${errorText}`,
      )
      return null
    }

    const data: FmpQuote[] = await response.json()

    if (data && data.length > 0 && data[0].price !== undefined && data[0].price !== null) {
      return data[0]
    } else {
      console.warn(`FMP: No valid quote data for ${symbol}. Response:`, data)
      return null
    }
  } catch (error) {
    console.error(`Failed to fetch FMP quote for ${symbol}:`, error)
    return null
  }
}

export async function getFmpCompanyName(symbol: string): Promise<string | null> {
  if (!FMP_API_KEY) {
    console.warn("FMP_API_KEY is not set. Cannot fetch company name from Financial Modeling Prep.");
    return null;
  }

  const url = `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 * 24 } });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `FMP Company Name API Error for ${symbol}: Status ${response.status} ${response.statusText}, Body: ${errorText}`,
      );
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0 && data[0].companyName) {
      return data[0].companyName;
    } else {
      console.warn(`FMP: No company name found for symbol ${symbol}. Response:`, data);
      return null;
    }
  } catch (error) {
    console.error(`Failed to fetch company name for ${symbol} from Financial Modeling Prep:`, error);
    return null;
  }
}

export async function getFmpHistoricalData(
  symbol: string,
  from: string, // YYYY-MM-DD
  to: string, // YYYY-MM-DD
): Promise<HistoricalPrice[]> {
  if (!FMP_API_KEY) {
    console.warn("FMP_API_KEY is not set. Cannot fetch historical data from Financial Modeling Prep.")
    return []
  }

  const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?from=${from}&to=${to}&apikey=${FMP_API_KEY}`

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `FMP Historical Data API Error for ${symbol}: Status ${response.status} ${response.statusText}, Body: ${errorText}`,
      )
      // If the API returns an error, it's better to return an empty array than throw,
      // so the page can still render without historical data.
      return []
    }

    const data: { historical: HistoricalPrice[]; symbol: string } = await response.json()

    console.log(`FMP Historical Data Raw Response for ${symbol}:`, data)

    if (data && data.historical && data.historical.length > 0) {
      const processedData = data.historical
        .map((item) => {
          // Ensure price is a number. Use parseFloat to handle string numbers, default to 0 if invalid.
          const priceValue = typeof item.close === "number" ? item.close : Number.parseFloat(item.close as any)
          // If priceValue is NaN or null/undefined, default to 0
          const finalPrice = isNaN(priceValue) || priceValue === null || priceValue === undefined ? 0 : priceValue

          if (isNaN(finalPrice)) {
            console.error(`FMP Historical Data: price for date ${item.date} is NaN after conversion:`, item.close)
          }
          return {
            date: item.date,
            price: finalPrice,
            open: item.open,
            high: item.high,
            low: item.low,
            volume: item.volume,
          }
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      console.log(
        `FMP Historical Data Processed and Sorted for ${symbol} (first 5):`,
        JSON.stringify(processedData.slice(0, 5), null, 2),
      )
      return processedData
    } else {
      console.warn(`FMP: No historical data for ${symbol} in the specified range. Response:`, data)
      return []
    }
  } catch (error) {
    console.error(`Failed to fetch FMP historical data for ${symbol}:`, error)
    // Return empty array on network errors or other unexpected fetch failures
    return []
  }
}

export async function fetchAndCacheStockPrices(userId: string, userStock: UserStock): Promise<UserStock> {
  const today = new Date().toISOString().split("T")[0]

  if (userStock.last_fetched_price_date === today && userStock.current_price !== null) {
    return userStock
  }

  let quote: FmpQuote | null = null

  if (FMP_API_KEY) {
    quote = await getFmpQuote(userStock.symbol)
  }

  if (quote) {
    const updatedStock = await updateStockPrices(
      userStock.id,
      userId,
      quote.price,
      quote.change,
      quote.changesPercentage,
      today,
    )
    if (updatedStock) {
      return updatedStock
    }
  }
  return userStock
}

export async function searchFmpSymbols(query: string): Promise<FmpSymbolSearchResult[]> {
  if (!FMP_API_KEY) {
    console.warn("FMP_API_KEY is not set. Cannot search symbols from Financial Modeling Prep.")
    return []
  }
  if (!query) {
    return []
  }

  const url = `https://financialmodelingprep.com/api/v3/search?query=${query}&limit=10&exchange=NASDAQ&apikey=${FMP_API_KEY}`

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `FMP Search API Error for ${query}: Status ${response.status} ${response.statusText}, Body: ${errorText}`,
      )
      return []
    }

    const data: FmpSymbolSearchResult[] = await response.json()
    return data || []
  } catch (error) {
    console.error(`Failed to search FMP symbols for ${query}:`, error)
    return []
  }
}

export async function addStockToPortfolio(userId: string, symbol: string, name: string): Promise<UserStock | null> {
  const newStock = await addStockToUser(userId, symbol, name)
  if (newStock) {
    revalidatePath("/")
    revalidatePath(`/stock/${symbol}`)
  }
  return newStock
}

export async function removeStockFromPortfolio(stockId: string, userId: string, symbol: string): Promise<boolean> {
  const success = await deleteStockFromUser(stockId, userId)
  if (success) {
    revalidatePath("/")
    revalidatePath(`/stock/${symbol}`)
  }
  return success
}

export async function revalidateHomePage() {
  revalidatePath("/")
}

export async function revalidateStockPage(symbol: string) {
  revalidatePath(`/stock/${symbol}`)
}

// --- New Server Actions for Notes and Stock Data (for client components) ---

export async function getNoteByIdAction(noteId: string, userId: string): Promise<Note | null> {
  return await getNoteByIdServer(noteId, userId)
}

export async function saveNoteAction(
  note: Omit<Note, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updatedAt?: string },
): Promise<Note | null> {
  return await saveNoteServer(note)
}

export async function deleteNoteAction(noteId: string, userId: string): Promise<boolean> {
  return await deleteNoteServer(noteId, userId)
}

export async function getStockForUserAction(symbol: string, userId: string): Promise<UserStock | null> {
  return await getStockForUserServer(symbol, userId)
}

// New Server Action to check user email confirmation status
export async function checkUserConfirmationStatus(email: string): Promise<string | null> {
  const supabase = createAdminServerClient() // 使用 admin 客户端
  console.log("Server Action: checkUserConfirmationStatus for email:", email)

  try {
    let userConfirmedAt: string | null = null

    // First, try using getUserByEmail if it's available
    if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.getUserByEmail === "function") {
      console.log("Server Action: Attempting to use supabase.auth.admin.getUserByEmail()...")
      const { data, error } = await supabase.auth.admin.getUserByEmail(email)
      if (error) {
        console.error("Server Action: Error from getUserByEmail:", error)
      } else if (data?.user && data.user.email_confirmed_at) {
        userConfirmedAt = data.user.email_confirmed_at as string
      }
    } else {
      // Fallback to listUsers if getUserByEmail is not a function
      console.warn(
        "Server Action: getUserByEmail not available or admin client not fully initialized. Falling back to listUsers()...",
      )
      if (supabase.auth && supabase.auth.admin && typeof supabase.auth.admin.listUsers === "function") {
        const { data, error } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 100, // Fetch a reasonable number of users to find the email
        })
        if (error) {
          console.error("Server Action: Error from listUsers:", error)
        } else if (data?.users && data.users.length > 0) {
          const foundUser = data.users.find((u) => u.email === email)
          if (foundUser && foundUser.email_confirmed_at) {
            userConfirmedAt = foundUser.email_confirmed_at as string
          }
        }
      } else {
        console.error("Server Action: Neither getUserByEmail nor listUsers is available on auth.admin.")
      }
    }

    if (userConfirmedAt) {
      console.log("Server Action: Email confirmed at:", userConfirmedAt)
      return userConfirmedAt
    }
    console.log("Server Action: Email not confirmed or user not found.")
    return null
  } catch (e) {
    console.error("Server Action: Unexpected error in checkUserConfirmationStatus:", e)
    return null
  }
}

// 批量修正所有用户所有股票的公司名称
export async function fixAllUsersStockNames() {
  const supabase = createAdminServerClient();
  // 获取所有用户id
  const { data: users, error: userError } = await supabase.from("users").select("id");
  if (userError) {
    console.error("获取用户列表失败:", userError);
    return "获取用户失败";
  }
  let total = 0;
  for (const user of users) {
    const userId = user.id;
    // 获取该用户所有股票
    const { data: stocks, error: stockError } = await supabase.from("stocks").select("id,symbol,name").eq("user_id", userId);
    if (stockError) {
      console.error(`获取用户${userId}股票失败:`, stockError);
      continue;
    }
    for (const stock of stocks) {
      const companyName = await getFmpCompanyName(stock.symbol);
      if (companyName && companyName !== stock.name) {
        const { error } = await supabase
          .from("stocks")
          .update({ name: companyName })
          .eq("id", stock.id)
          .eq("user_id", userId);
        if (error) {
          console.error(`更新用户${userId}的${stock.symbol}失败:`, error);
        } else {
          console.log(`已更新用户${userId}的${stock.symbol}为${companyName}`);
          total++;
        }
      }
    }
  }
  return `批量修正完成，共更新${total}条记录`;
}

// 只处理指定用户uid的批量修正函数
export async function fixSpecificUsersStockNames() {
  const supabase = createAdminServerClient();
  // 指定需要处理的用户uid
  const userIds = [
    "36393788-57cb-47c2-8a8a-17c6641095f3",
    "50d30f15-36df-4893-a917-f4b2f83dcf0d",
    "6747cd97-3d1a-43a4-b45d-a06406f95c07",
    "ad30302e-4d05-4075-8011-f7f112f889aa"
  ];
  let total = 0;
  for (const userId of userIds) {
    const { data: stocks, error: stockError } = await supabase.from("stocks").select("id,symbol,name").eq("user_id", userId);
    if (stockError) {
      console.error(`获取用户${userId}股票失败:`, stockError);
      continue;
    }
    for (const stock of stocks) {
      const companyName = await getFmpCompanyName(stock.symbol);
      if (companyName && companyName !== stock.name) {
        const { error } = await supabase
          .from("stocks")
          .update({ name: companyName })
          .eq("id", stock.id)
          .eq("user_id", userId);
        if (error) {
          console.error(`更新用户${userId}的${stock.symbol}失败:`, error);
        } else {
          console.log(`已更新用户${userId}的${stock.symbol}为${companyName}`);
          total++;
        }
      }
    }
  }
  return `批量修正完成，共更新${total}条记录`;
}
