import { NextRequest, NextResponse } from 'next/server'

// In-memory store for mock notes
const notesStore: Record<string, Array<{
  id: string
  order_id: string
  staff_id: string
  content: string
  created_at: string
  updated_at: string
  staff?: { username: string; display_name: string | null }
}>> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, content, staffId, staffUsername } = body

    if (!orderId || !content) {
      return NextResponse.json({ error: 'orderId and content are required' }, { status: 400 })
    }

    const note = {
      id: crypto.randomUUID(),
      order_id: orderId,
      staff_id: staffId || 'mock-staff-1',
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      staff: {
        username: staffUsername || 'staff',
        display_name: staffUsername || 'Staff',
      },
    }

    if (!notesStore[orderId]) {
      notesStore[orderId] = []
    }
    notesStore[orderId].push(note)

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { noteId, orderId } = await request.json()
    if (notesStore[orderId]) {
      notesStore[orderId] = notesStore[orderId].filter(n => n.id !== noteId)
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete note error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
