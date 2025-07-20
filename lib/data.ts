import { createServerClient } from "@/lib/supabase-server" // Changed import path
import { revalidatePath } from "next/cache"

export type Trend = "hold" | "sell" | "buy"

export interface Note {
  id: string
  user_id: string
  stock_symbol: string
  title: string
  source?: string
  trend: Trend
  content?: string
  created_at: string
  updated_at: string
  note_date: string // YYYY-MM-DD (for chart plotting)
}

export interface UserStock {
  id: string
  user_id: string
  symbol: string
  name: string
  last_added_date: string // YYYY-MM-DD
  created_at: string
  updated_at: string
  // New fields for price caching
  current_price?: number | null
  price_change?: number | null
  price_change_percent?: number | null
  last_fetched_price_date?: string | null // YYYY-MM-DD
}

// --- Notes Functions ---

export async function getNotesBySymbol(symbol: string, userId: string): Promise<Note[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", userId)
    .eq("stock_symbol", symbol)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching notes:", error)
    return []
  }
  return data as Note[]
}

export async function getNoteById(noteId: string, userId: string): Promise<Note | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("notes").select("*").eq("id", noteId).eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching note:", error)
    return null
  }
  return data as Note
}

export async function saveNote(
  note: Omit<Note, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updatedAt?: string },
): Promise<Note | null> {
  const supabase = createServerClient()
  const now = new Date().toISOString()
  let result: any

  if (note.id) {
    // Update existing note
    result = await supabase
      .from("notes")
      .update({
        title: note.title,
        source: note.source,
        trend: note.trend,
        content: note.content,
        updated_at: now,
        note_date: note.note_date,
      })
      .eq("id", note.id)
      .eq("user_id", note.user_id)
      .select()
      .single()
  } else {
    // Create new note
    result = await supabase
      .from("notes")
      .insert({
        user_id: note.user_id,
        stock_symbol: note.stock_symbol,
        title: note.title,
        source: note.source,
        trend: note.trend,
        content: note.content,
        created_at: now,
        updated_at: now,
        note_date: note.note_date,
      })
      .select()
      .single()
  }

  if (result.error) {
    console.error("Error saving note:", result.error)
    return null
  }

  revalidatePath(`/stock/${note.stock_symbol}`)
  return result.data as Note
}

export async function deleteNote(noteId: string, userId: string): Promise<boolean> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("notes").delete().eq("id", noteId).eq("user_id", userId)

  if (error) {
    console.error("Error deleting note:", error)
    return false
  }
  return true
}

// --- User Stocks Functions ---

export async function getUserStocks(userId: string): Promise<UserStock[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .eq("user_id", userId)
      .order("symbol", { ascending: true })

    if (error) {
      console.error("Supabase error fetching user stocks:", error)
      // 尝试识别是否是速率限制或其他服务错误
      if ((error.message && error.message.includes("rate limit")) || error.status === 429) {
        console.error("Possible Supabase rate limit or service issue. Please try again later.")
      }
      return []
    }
    return data as UserStock[]
  } catch (e: any) {
    console.error("Unexpected error in getUserStocks:", e)
    // 如果错误信息包含 "Too Many R"，则明确指出可能是速率限制
    if (e.message && e.message.includes("Too Many R")) {
      console.error("This looks like a 'Too Many Requests' error from Supabase. Please try again later.")
    }
    return []
  }
}

export async function addStockToUser(userId: string, symbol: string, name: string): Promise<UserStock | null> {
  const supabase = createServerClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("stocks")
    .insert({
      user_id: userId,
      symbol: symbol,
      name: name,
      last_added_date: now.split("T")[0], // YYYY-MM-DD
      created_at: now,
      updated_at: now,
      // Initialize new price cache fields
      current_price: null,
      price_change: null,
      price_change_percent: null,
      last_fetched_price_date: null,
    })
    .select()
    .single()

  if (error) {
    console.error("Error adding stock:", error)
    return null
  }
  revalidatePath("/")
  return data as UserStock
}

export async function getStockForUser(symbol: string, userId: string): Promise<UserStock | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("stocks").select("*").eq("user_id", userId).eq("symbol", symbol).single()

  if (error) {
    console.error("Error fetching stock for user:", error)
    return null
  }
  return data as UserStock
}

export async function updateStockPrices(
  stockId: string,
  userId: string,
  price: number,
  change: number,
  changePercent: number,
  fetchedDate: string, // YYYY-MM-DD
): Promise<UserStock | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("stocks")
    .update({
      current_price: price,
      price_change: change,
      price_change_percent: changePercent,
      last_fetched_price_date: fetchedDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stockId)
    .eq("user_id", userId)
    .select()
    .single()

  if (error) {
    console.error("Error updating stock prices:", error)
    return null
  }
  revalidatePath("/") // Revalidate home page to show updated prices
  return data as UserStock
}

// New: Function to delete a stock from the user's portfolio
export async function deleteStockFromUser(stockId: string, userId: string): Promise<boolean> {
  const supabase = createServerClient()
  // Note: This will NOT delete associated notes due to Supabase RLS and table design.
  // Notes are linked to user_id and stock_symbol, not directly cascaded from stocks.id.
  const { error } = await supabase.from("stocks").delete().eq("id", stockId).eq("user_id", userId)

  if (error) {
    console.error("Error deleting stock from user portfolio:", error)
    return false
  }
  return true
}
