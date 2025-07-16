import { createServerClient } from "@/lib/supabase-server"
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
