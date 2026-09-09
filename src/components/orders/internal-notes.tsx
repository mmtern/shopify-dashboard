'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { InternalNote } from '@/lib/types'
import { toast } from 'sonner'
import { Send, Trash2 } from 'lucide-react'
import { useTranslation } from '@/components/i18n-provider'

interface InternalNotesProps {
  orderId: string
  notes: InternalNote[]
}

export function InternalNotes({ orderId, notes: initialNotes }: InternalNotesProps) {
  const { t } = useTranslation()
  const [notes, setNotes] = useState<InternalNote[]>(initialNotes)
  const [newNote, setNewNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          content: newNote,
          staffUsername: "Demo User",
        }),
      })

      if (!res.ok) throw new Error('Failed to add note')

      const data = await res.json()
      setNotes(prev => [...prev, data.note])
      setNewNote('')
      toast.success((t as any).notifications?.noteAdded || 'Note added')
    } catch (error) {
      console.error(error)
      toast.error((t as any).notifications?.noteFailed || 'Failed to add note')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    try {
      const res = await fetch('/api/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, noteId }),
      })

      if (!res.ok) throw new Error('Failed to delete note')

      setNotes(prev => prev.filter(n => n.id !== noteId))
      toast.success((t as any).notifications?.noteDeleted || 'Note deleted')
    } catch (error) {
      console.error(error)
      toast.error((t as any).notifications?.noteDeleteFailed || 'Failed to delete note')
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <ScrollArea className="flex-1 p-4">
        {notes.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground italic">
            {t.noNotes}
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="flex gap-3 group">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {note.staff?.username?.substring(0, 2).toUpperCase() || 'ST'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{note.staff?.display_name || note.staff?.username || 'Staff'}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'MMM dd, h:mm a')}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm bg-muted/50 p-3 rounded-md rounded-tl-none border border-border/50 text-foreground whitespace-pre-wrap">
                    {note.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <Separator />
      
      <form onSubmit={handleSubmit} className="p-4 bg-muted/20">
        <div className="relative">
          <Textarea
            placeholder={t.addNote}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[80px] resize-none pr-12 bg-background"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute bottom-3 right-3 h-8 w-8 rounded-full"
            disabled={!newNote.trim() || isSubmitting}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 px-1">
          {t.pressEnter}
        </p>
      </form>
    </div>
  )
}
