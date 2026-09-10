import { NextRequest, NextResponse } from 'next/server'

// In-memory store for mock status updates (will be replaced with Supabase)
const statusUpdates: Record<string, Record<string, { value: boolean | string; timestamp: string }>> = {}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, field, value, staffId } = body

    if (!orderId || !field) {
      return NextResponse.json({ error: 'orderId and field are required' }, { status: 400 })
    }

    // For mock mode, store in memory
    if (!statusUpdates[orderId]) {
      statusUpdates[orderId] = {}
    }

    if (field === 'stage') {
      statusUpdates[orderId]['stage'] = {
        value: value as string,
        timestamp: new Date().toISOString(),
      }
    } else {
      statusUpdates[orderId][field] = {
        value: Boolean(value),
        timestamp: new Date().toISOString(),
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      field,
      value: field === 'stage' ? value : Boolean(value),
      timestamp: statusUpdates[orderId][field].timestamp,
    })
  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId')
  if (orderId && statusUpdates[orderId]) {
    return NextResponse.json(statusUpdates[orderId])
  }
  return NextResponse.json(statusUpdates)
}
