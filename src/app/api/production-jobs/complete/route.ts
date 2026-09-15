import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPickupOrder } from '@/lib/production/shipping'
import { generateProductionFilename, getFileExtension } from '@/lib/production/filename'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jobId } = body

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Fetch the job, order info, and active files
    const { data: jobData, error: jobError } = await supabase
      .from('production_jobs')
      .select('*, orders!inner(shipping_method, customer_name, order_number)')
      .eq('id', jobId)
      .eq('is_active', true)
      .single()

    if (jobError || !jobData) {
      return NextResponse.json({ error: 'Active production job not found' }, { status: 404 })
    }

    // 2. Server-side validation
    const { data: filesData, error: filesError } = await supabase
      .from('order_files')
      .select('*')
      .eq('production_job_id', jobId)
      .eq('is_active', true)

    if (filesError) {
      return NextResponse.json({ error: 'Failed to fetch order files for validation' }, { status: 500 })
    }

    const activeFiles = filesData || []
    const designFiles = activeFiles.filter(f => f.file_type === 'design')
    const labelFiles = activeFiles.filter(f => f.file_type === 'shipping_label')
    const hasCompletedDesign = designFiles.some(f => f.upload_status === 'completed')
    const hasCompletedLabel = labelFiles.some(f => f.upload_status === 'completed')
    const isPickup = isPickupOrder(jobData.orders.shipping_method)

    let isReady = false
    if (isPickup) {
      isReady = hasCompletedDesign
    } else {
      isReady = hasCompletedDesign && hasCompletedLabel
    }

    if (!isReady) {
      return NextResponse.json({ 
        error: 'Validation failed: Required files are missing or incomplete. ' +
               (isPickup ? 'At least one completed design file is required.' : 'A completed design file and a completed shipping label are required.')
      }, { status: 400 })
    }

    // 3. Finalize Job (assign queue number)
    const { data: finalJob, error: finalizeError } = await supabase.rpc('finalize_production_job', {
      p_job_id: jobId,
      p_staff_id: user.id,
    })

    if (finalizeError) {
      console.error('Finalize job Supabase error:', JSON.stringify(finalizeError, null, 2))
      return NextResponse.json({ error: finalizeError.message || 'Database error occurred during finalization' }, { status: 500 })
    }

    // 4. Regenerate and persist final generated_filenames
    const validDesigns = designFiles.filter(f => f.design_length_inches && f.design_length_inches > 0)
    // Sort by sequence or created_at to ensure stable ordering
    validDesigns.sort((a, b) => {
      if (a.file_sequence && b.file_sequence) return a.file_sequence - b.file_sequence
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })
    
    const totalDesignFiles = validDesigns.length

    for (let i = 0; i < validDesigns.length; i++) {
      const df = validDesigns[i]
      const ext = getFileExtension(df.original_filename || '')
      const seq = totalDesignFiles > 1 ? i + 1 : undefined
      const finalName = generateProductionFilename({
        queueNumber: finalJob.queue_number,
        shippingMethod: jobData.orders.shipping_method,
        includeSample: finalJob.include_sample,
        customerName: jobData.orders.customer_name,
        orderNumber: jobData.orders.order_number,
        designLengthInches: df.design_length_inches,
        fileSequence: seq,
        totalDesignFiles,
        fileType: 'design',
        originalExtension: ext,
      })
      await supabase.from('order_files').update({ generated_filename: finalName }).eq('id', df.id)
    }

    // Process shipping label
    const labelFile = labelFiles.find(f => f.upload_status === 'completed')
    if (labelFile) {
      const ext = getFileExtension(labelFile.original_filename || '')
      const finalName = generateProductionFilename({
        queueNumber: finalJob.queue_number,
        shippingMethod: jobData.orders.shipping_method,
        includeSample: finalJob.include_sample,
        customerName: jobData.orders.customer_name,
        orderNumber: jobData.orders.order_number,
        fileType: 'shipping_label',
        originalExtension: ext,
      })
      await supabase.from('order_files').update({ generated_filename: finalName }).eq('id', labelFile.id)
    }

    // 5. Automatically progress Production Tracker to 'ready_for_print' if applicable
    const { data: currentStatus } = await supabase
      .from('production_status')
      .select('stage')
      .eq('order_id', jobData.order_id)
      .single()

    const currentStage = currentStatus?.stage || 'new_order'

    // We only move it forward if it's currently at 'new_order'.
    // If it's already 'ready_for_print' or beyond, we do nothing to preserve idempotency and prevent moving backwards.
    if (currentStage === 'new_order') {
      const { error: upsertError } = await supabase
        .from('production_status')
        .upsert({
          order_id: jobData.order_id,
          stage: 'ready_for_print',
          assigned_staff_id: user.id
        }, { onConflict: 'order_id' })

      if (!upsertError) {
        // Log to history
        await supabase
          .from('status_history')
          .insert({
            order_id: jobData.order_id,
            staff_id: user.id,
            status_field: 'stage',
            old_value: currentStage,
            new_value: 'ready_for_print',
          })
      } else {
        console.error('Failed to auto-progress production status:', upsertError)
      }
    }

    return NextResponse.json({ success: true, job: finalJob })
  } catch (error) {
    console.error('Production job complete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
