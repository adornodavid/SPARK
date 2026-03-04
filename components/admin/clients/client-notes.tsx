"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, Pin, PinOff } from "lucide-react"

interface Note {
  id: string
  content: string
  is_pinned: boolean
  created_at: string
  created_by_user: {
    first_name: string
    last_name: string
  }
}

interface ClientNotesProps {
  clientId: string
  initialNotes: Note[]
}

export function ClientNotes({ clientId, initialNotes }: ClientNotesProps) {
  const router = useRouter()
  const [notes, setNotes] = useState(initialNotes)
  const [newNote, setNewNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    setIsSubmitting(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsSubmitting(false)
      return
    }

    const { data, error } = await supabase
      .from("notes")
      .insert({
        entity_type: "client",
        entity_id: clientId,
        created_by: user.id,
        content: newNote,
      })
      .select(
        `
        *,
        created_by_user:profiles!notes_created_by_fkey(first_name, last_name)
      `,
      )
      .single()

    if (!error && data) {
      setNotes([data, ...notes])
      setNewNote("")
    }

    setIsSubmitting(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("notes").delete().eq("id", noteId)

    if (!error) {
      setNotes(notes.filter((n) => n.id !== noteId))
    }
  }

  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    const supabase = createClient()
    const { error } = await supabase.from("notes").update({ is_pinned: !currentPinned }).eq("id", noteId)

    if (!error) {
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Nueva Nota</CardTitle>
          <CardDescription>Agrega una nota sobre este cliente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Escribe una nota..."
            rows={3}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <Button onClick={handleAddNote} disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Agregar Nota"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <p className="text-sm">{note.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {note.created_by_user.first_name} {note.created_by_user.last_name}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(note.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleTogglePin(note.id, note.is_pinned)}>
                    {note.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteNote(note.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
