import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, field, value, staffId } = body

    if (!orderId || !field) {
      return NextResponse.json({ error: 'orderId and field are required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Get the current status to record in history
    const { data: currentStatus } = await supabase
      .from('production_status')
      .select(field)
      .eq('order_id', orderId)
      .single()

    const oldValue = currentStatus?.[field as keyof typeof currentStatus] || 'new_order'

    // 2. Upsert the new status
    const updateData: any = { order_id: orderId }
    if (field === 'stage') {
      updateData.stage = value
      updateData.assigned_staff_id = staffId || null
    } else {
      updateData[field] = Boolean(value)
    }

    const { error: upsertError } = await supabase
      .from('production_status')
      .upsert(updateData, { onConflict: 'order_id' })

    if (upsertError) {
      require('fs').writeFileSync('supabase_error.log', JSON.stringify(upsertError, null, 2))
      throw upsertError
    }

    // 3. Log to history if there is an authenticated staff member
    // Using auth.uid() directly or getting it from the server-side user object
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
        const { error: historyError } = await supabase
        .from('status_history')
        .insert({
            order_id: orderId,
            staff_id: user.id, // Must match public.staff.id (which references auth.users.id)
            status_field: field,
            old_value: String(oldValue),
            new_value: String(value),
        })
        
        if (historyError) {
             require('fs').writeFileSync('supabase_history_error.log', JSON.stringify(historyError, null, 2))
             console.error('Failed to write status history:', historyError)
             // We won't fail the whole request just because history failed
        }
    }

    return NextResponse.json({
      success: true,
      orderId,
      field,
      value: field === 'stage' ? value : Boolean(value),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Status update error:', error)
    require('fs').writeFileSync('supabase_catch_error.log', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
    return NextResponse.json({ error: 'GET not implemented for real database yet' }, { status: 501 })
}
