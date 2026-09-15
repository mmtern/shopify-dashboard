import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Call the start preparation RPC
    const { data, error } = await supabase.rpc('start_file_preparation', {
      p_order_id: orderId,
      p_staff_id: user.id,
    })

    if (error) {
      console.error('Start preparation Supabase error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: error.message || 'Database error occurred' }, { status: 500 })
    }

    return NextResponse.json({ success: true, job: data })
  } catch (error) {
    console.error('Production job start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
