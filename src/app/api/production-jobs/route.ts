import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST removed. Use /api/production-jobs/start and /api/production-jobs/complete instead.

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId, include_sample } = body

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('production_jobs')
      .update({ include_sample: Boolean(include_sample) })
      .eq('id', jobId)
      .eq('is_active', true)
      .select()
      .single()

    if (error) {
      console.error('Production job update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, job: data })
  } catch (error) {
    console.error('Production job patch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId')
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_jobs')
      .select('*, staff:preparation_started_by(username, display_name)')
      .eq('order_id', orderId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Production job fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ job: data })
  } catch (error) {
    console.error('Production job get error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
