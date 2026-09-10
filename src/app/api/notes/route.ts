import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, content } = body

    if (!orderId || !content) {
      return NextResponse.json({ error: 'orderId and content are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: note, error: insertError } = await supabase
      .from('internal_notes')
      .insert({
        order_id: orderId,
        staff_id: user.id,
        content: content,
      })
      .select(`
        *,
        staff (
          username,
          display_name
        )
      `)
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ success: true, note })
  } catch (error) {
    console.error('Notes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { noteId } = await request.json()
    
    if (!noteId) {
       return NextResponse.json({ error: 'noteId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error: deleteError } = await supabase
      .from('internal_notes')
      .delete()
      .eq('id', noteId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete note error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
