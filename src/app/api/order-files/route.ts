import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, productionJobId, fileType, originalFilename, generatedFilename, designLengthInches, fileSequence, mimeType, fileSizeBytes } = body

    if (!orderId || !productionJobId || !fileType) {
      return NextResponse.json({ error: 'orderId, productionJobId, and fileType are required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('order_files')
      .insert({
        order_id: orderId,
        production_job_id: productionJobId,
        file_type: fileType,
        original_filename: originalFilename || null,
        generated_filename: generatedFilename || null,
        design_length_inches: designLengthInches || null,
        file_sequence: fileSequence || null,
        mime_type: mimeType || null,
        file_size_bytes: fileSizeBytes || null,
        upload_status: 'pending',
        uploaded_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Order file insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: data })
  } catch (error) {
    console.error('Order file error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileId, ...updates } = body

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow updating specific safe fields
    const allowedFields: Record<string, unknown> = {}
    if ('designLengthInches' in updates) allowedFields.design_length_inches = updates.designLengthInches
    if ('fileSequence' in updates) allowedFields.file_sequence = updates.fileSequence
    if ('generatedFilename' in updates) allowedFields.generated_filename = updates.generatedFilename
    if ('originalFilename' in updates) allowedFields.original_filename = updates.originalFilename
    if ('mimeType' in updates) allowedFields.mime_type = updates.mimeType
    if ('fileSizeBytes' in updates) allowedFields.file_size_bytes = updates.fileSizeBytes
    if ('uploadStatus' in updates) allowedFields.upload_status = updates.uploadStatus
    if ('isActive' in updates) allowedFields.is_active = updates.isActive

    const { data, error } = await supabase
      .from('order_files')
      .update(allowedFields)
      .eq('id', fileId)
      .select()
      .single()

    if (error) {
      console.error('Order file update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, file: data })
  } catch (error) {
    console.error('Order file patch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fileId } = await request.json()

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft-delete: set is_active = false
    const { error } = await supabase
      .from('order_files')
      .update({ is_active: false })
      .eq('id', fileId)

    if (error) {
      console.error('Order file delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Order file delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
