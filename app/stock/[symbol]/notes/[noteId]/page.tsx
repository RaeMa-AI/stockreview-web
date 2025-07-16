"use client"

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { getNoteById, saveNote, deleteNote, type Note } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { TrendSelector } from "@/components/trend-selector"
import { DatePicker } from "@/components/date-picker"
import { format } from "date-fns"
import { z } from "zod"
import { revalidatePath } from "next/cache"

interface NoteFormProps {
  note?: Note | null
  stockSymbol: string
  userId: string
}

// Zod schema for validation
const noteSchema = z.object({
  title: z.string().min(1, "标题不能为空"),
  source: z.string().optional(),
  trend: z.enum(["buy", "hold", "sell"], { message: "请选择一个趋势" }),
  content: z.string().optional(),
  note_date: z.string().min(1, "笔记日期不能为空"),
})

async function NoteForm({ note, stockSymbol, userId }: NoteFormProps) {
  const isNewNote = !note?.id

  const handleSubmit = async (formData: FormData) => {
    "use server"

    const rawNoteDate = formData.get("note_date") as string
    const parsedNoteDate = rawNoteDate ? format(new Date(rawNoteDate), "yyyy-MM-dd") : ""

    const dataToValidate = {
      title: formData.get("title"),
      source: formData.get("source"),
      trend: formData.get("trend"),
      content: formData.get("content"),
      note_date: parsedNoteDate,
    }

    const validationResult = noteSchema.safeParse(dataToValidate)

    if (!validationResult.success) {
      // In a real application, you'd pass these errors back to the client
      // For simplicity, we'll just log them and redirect.
      console.error("Validation errors:", validationResult.error.flatten().fieldErrors)
      // You might want to throw an error or return a specific status
      return { success: false, errors: validationResult.error.flatten().fieldErrors }
    }

    const validatedData = validationResult.data

    const noteToSave: Omit<Note, "id" | "created_at" | "updated_at"> & { id?: string } = {
      user_id: userId,
      stock_symbol: stockSymbol,
      title: validatedData.title,
      source: validatedData.source || undefined,
      trend: validatedData.trend,
      content: validatedData.content || undefined,
      note_date: validatedData.note_date,
    }

    if (note?.id) {
      noteToSave.id = note.id
    }

    const savedNote = await saveNote(noteToSave)

    if (savedNote) {
      revalidatePath(`/stock/${stockSymbol}`)
      revalidatePath(`/stock/${stockSymbol}/notes/${savedNote.id}`)
      redirect(`/stock/${stockSymbol}`)
    } else {
      // Handle save error
      console.error("Failed to save note.")
      // In a real app, you'd show an error message to the user
    }
  }

  const handleDelete = async () => {
    "use server"
    if (note?.id) {
      const success = await deleteNote(note.id, userId)
      if (success) {
        revalidatePath(`/stock/${stockSymbol}`)
        redirect(`/stock/${stockSymbol}`)
      } else {
        console.error("Failed to delete note.")
      }
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isNewNote ? "创建新笔记" : "编辑笔记"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">标题</Label>
            <Input id="title" name="title" defaultValue={note?.title || ""} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="source">来源 (可选)</Label>
            <Input id="source" name="source" defaultValue={note?.source || ""} />
          </div>
          <div className="grid gap-2">
            <Label>趋势</Label>
            <TrendSelector
              initialTrend={note?.trend || "hold"}
              onTrendChange={() => {
                /* Client-side state handled by TrendSelector, form will get value on submit */
              }}
            />
            {/* Hidden input to capture the final trend value for server action */}
            <input type="hidden" name="trend" id="hidden-trend-input" value={note?.trend || "hold"} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">内容 (可选)</Label>
            <Textarea id="content" name="content" defaultValue={note?.content || ""} rows={5} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note_date">笔记日期</Label>
            <DatePicker
              initialDate={note?.note_date ? new Date(note.note_date) : new Date()}
              onDateChange={() => {
                /* Client-side state handled by DatePicker, form will get value on submit */
              }}
            />
            {/* Hidden input to capture the final date value for server action */}
            <input
              type="hidden"
              name="note_date"
              id="hidden-note-date-input"
              value={note?.note_date || format(new Date(), "yyyy-MM-dd")}
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button type="submit" className="flex-1">
              {isNewNote ? "创建笔记" : "保存笔记"}
            </Button>
            {!isNewNote && (
              <Button type="button" variant="destructive" onClick={handleDelete} className="flex-1">
                删除笔记
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => redirect(`/stock/${stockSymbol}`)}
              className="flex-1"
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default async function NoteDetailPage({ params }: { params: { symbol: string; noteId: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const stockSymbol = params.symbol.toUpperCase()
  const noteId = params.noteId === "new" ? null : params.noteId
  const userId = user.id

  let note: Note | null = null
  if (noteId) {
    note = await getNoteById(noteId, userId)
    if (!note || note.user_id !== userId || note.stock_symbol !== stockSymbol) {
      // If note not found, or doesn't belong to user/stock, redirect to stock detail page
      redirect(`/stock/${stockSymbol}`)
    }
  }

  return <NoteForm note={note} stockSymbol={stockSymbol} userId={userId} />
}
