import { v4 as uuidv4 } from "uuid"

export type Trend = "hold" | "sell" | "buy"

export interface Note {
  id: string
  stockSymbol: string
  title: string
  source?: string
  trend: Trend
  content?: string
  createdAt: string // YYYY-MM-DDTHH:mm:ss.sssZ
  updatedAt: string // YYYY-MM-DDTHH:mm:ss.sssZ
  noteDate: string // YYYY-MM-DD (for chart plotting)
}

const LOCAL_STORAGE_KEY = "stock_notes"

function getStoredNotes(): Note[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

function saveStoredNotes(notes: Note[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notes))
}

export function getNotesBySymbol(symbol: string): Note[] {
  const allNotes = getStoredNotes()
  return allNotes
    .filter((note) => note.stockSymbol === symbol)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getNoteById(id: string): Note | undefined {
  const allNotes = getStoredNotes()
  return allNotes.find((note) => note.id === id)
}

export function saveNote(
  note: Omit<Note, "id" | "createdAt" | "updatedAt"> & { id?: string; createdAt?: string; updatedAt?: string },
): Note {
  const allNotes = getStoredNotes()
  const now = new Date().toISOString()
  let savedNote: Note

  if (note.id) {
    // Update existing note
    const existingIndex = allNotes.findIndex((n) => n.id === note.id)
    if (existingIndex > -1) {
      savedNote = {
        ...allNotes[existingIndex],
        ...note,
        updatedAt: now,
      }
      allNotes[existingIndex] = savedNote
    } else {
      // Should not happen if ID is valid, but handle as new if it does
      savedNote = {
        id: uuidv4(),
        ...note,
        createdAt: now,
        updatedAt: now,
        noteDate: note.noteDate || now.split("T")[0], // Ensure noteDate is set
      } as Note
      allNotes.push(savedNote)
    }
  } else {
    // Create new note
    savedNote = {
      id: uuidv4(),
      ...note,
      createdAt: now,
      updatedAt: now,
      noteDate: note.noteDate || now.split("T")[0], // Ensure noteDate is set
    } as Note
    allNotes.push(savedNote)
  }

  saveStoredNotes(allNotes)
  return savedNote
}

export function deleteNote(id: string): void {
  const allNotes = getStoredNotes()
  const filteredNotes = allNotes.filter((note) => note.id !== id)
  saveStoredNotes(filteredNotes)
}

// For storing/retrieving stock last added date
const LOCAL_STORAGE_STOCKS_KEY = "stock_list_data"

interface StoredStock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  lastAddedDate: string // YYYY-MM-DD
}

export function getStoredStockList(): StoredStock[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(LOCAL_STORAGE_STOCKS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function saveStoredStockList(stocks: StoredStock[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LOCAL_STORAGE_STOCKS_KEY, JSON.stringify(stocks))
}

export function getStockBySymbol(symbol: string): StoredStock | undefined {
  const stocks = getStoredStockList()
  return stocks.find((s) => s.symbol === symbol)
}
