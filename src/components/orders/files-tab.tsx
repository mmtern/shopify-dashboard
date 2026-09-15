'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { OrderWithDetails, ProductionJob } from '@/lib/types'
import { generateProductionFilename, getFileExtension } from '@/lib/production/filename'
import { isPickupOrder, shippingFilenameTag } from '@/lib/production/shipping'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  FileText, Plus, Trash2, ChevronUp, ChevronDown,
  Package, Truck, Play, Hash, Upload, Tag, User
} from 'lucide-react'

interface FilesTabProps {
  order: OrderWithDetails
  username: string
}

// Local state for a design file entry (lives only in UI until real upload)
interface LocalDesignFile {
  id: string            // local unique key
  file: File | null
  lengthInches: number | null
}

// Local state for a shipping label
interface LocalLabelFile {
  file: File | null
}

export function FilesTab({ order, username }: FilesTabProps) {
  const router = useRouter()
  const [job, setJob] = useState<ProductionJob | null>(order.production_job)
  const [isAssigning, setIsAssigning] = useState(false)
  const [includeSample, setIncludeSample] = useState(job?.include_sample ?? false)
  const [isSampleUpdating, setIsSampleUpdating] = useState(false)

  // Local file state — no DB rows until real storage is connected
  const [designFiles, setDesignFiles] = useState<LocalDesignFile[]>([
    { id: crypto.randomUUID(), file: null, lengthInches: null }
  ])
  const [labelFile, setLabelFile] = useState<LocalLabelFile>({ file: null })

  const isPickup = isPickupOrder(order.shipping_method)
  const shipTag = shippingFilenameTag(order.shipping_method)
  const orderNum = order.order_number?.replace(/^#/, '') || ''

  // ── Queue assignment ──────────────────────────────────────────────
  const handleStartPreparation = useCallback(async () => {
    setIsAssigning(true)
    try {
      const res = await fetch('/api/production-jobs/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      if (!res.ok) throw new Error('Failed to start file preparation')
      const data = await res.json()
      setJob(data.job)
      setIncludeSample(data.job.include_sample)
      toast.success('File preparation started')
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to start file preparation')
    } finally {
      setIsAssigning(false)
    }
  }, [order.id, router])

  const handleCompletePreparation = useCallback(async () => {
    if (!job) return
    setIsAssigning(true)
    try {
      const res = await fetch('/api/production-jobs/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to complete file preparation')
        
      setJob(data.job)
      toast.success(`Preparation completed. Queue #${String(data.job.queue_number).padStart(3, '0')} assigned.`)
      router.refresh()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to complete file preparation')
    } finally {
      setIsAssigning(false)
    }
  }, [job, router])

  // ── Sample toggle ─────────────────────────────────────────────────
  const handleSampleToggle = useCallback(async (checked: boolean) => {
    if (!job) return
    setIncludeSample(checked)
    setIsSampleUpdating(true)
    try {
      const res = await fetch('/api/production-jobs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, include_sample: checked }),
      })
      if (!res.ok) throw new Error('Failed to update sample')
      toast.success(checked ? 'Sample pack enabled' : 'Sample pack disabled')
    } catch (error) {
      console.error(error)
      setIncludeSample(!checked) // revert
      toast.error('Failed to update sample setting')
    } finally {
      setIsSampleUpdating(false)
    }
  }, [job])

  // ── Design files management ───────────────────────────────────────
  const addDesignFile = useCallback(() => {
    setDesignFiles(prev => [...prev, { id: crypto.randomUUID(), file: null, lengthInches: null }])
  }, [])

  const removeDesignFile = useCallback((id: string) => {
    setDesignFiles(prev => {
      if (prev.length <= 1) return prev
      return prev.filter(f => f.id !== id)
    })
  }, [])

  const updateDesignFile = useCallback((id: string, updates: Partial<LocalDesignFile>) => {
    setDesignFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }, [])

  const moveDesignFile = useCallback((index: number, direction: 'up' | 'down') => {
    setDesignFiles(prev => {
      const next = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }, [])

  const handleDesignFileSelect = useCallback((id: string, file: File | null) => {
    updateDesignFile(id, { file })
  }, [updateDesignFile])

  // ── Filename generation (preview) ─────────────────────────────────
  const generatedFilenames = useMemo(() => {
    if (!job) return { design: [] as string[], label: null as string | null }

    const design: string[] = []
    let label: string | null = null

    const validDesigns = designFiles.filter(f => f.file && f.lengthInches && f.lengthInches > 0)
    const totalDesignFiles = validDesigns.length

    designFiles.forEach((df, index) => {
      if (!df.file) {
        design.push('')
        return
      }
      const ext = getFileExtension(df.file.name)
      const seq = totalDesignFiles > 1 ? index + 1 : undefined
      const name = generateProductionFilename({
        queueNumber: job.queue_number || null,
        shippingMethod: order.shipping_method,
        includeSample: includeSample,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        designLengthInches: df.lengthInches || undefined,
        fileSequence: seq,
        totalDesignFiles,
        fileType: 'design',
        originalExtension: ext,
      })
      design.push(name)
    })

    if (labelFile.file) {
      const ext = getFileExtension(labelFile.file.name)
      label = generateProductionFilename({
        queueNumber: job.queue_number || null,
        shippingMethod: order.shipping_method,
        includeSample: includeSample,
        customerName: order.customer_name,
        orderNumber: order.order_number,
        fileType: 'shipping_label',
        originalExtension: ext,
      })
    }

    return { design, label }
  }, [job, designFiles, labelFile, includeSample, order])

  // ── Pre-assignment view ───────────────────────────────────────────
  if (!job) {
    return (
      <div className="space-y-4 pt-4">
        <Card className="p-6 border-border/50 bg-card/50 shadow-sm">
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Production Files</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Queue: Not assigned
              </p>
            </div>

            {/* Order info summary */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              <Badge variant="outline" className="flex items-center gap-1.5">
                <User className="h-3 w-3" />
                {order.customer_name || 'Unknown'}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5">
                <Hash className="h-3 w-3" />
                {order.order_number}
              </Badge>
              {shipTag && (
                <Badge variant="outline" className={`flex items-center gap-1.5 ${
                  shipTag === 'EXPRESS' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                  'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {shipTag === 'EXPRESS' ? <Truck className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                  {shipTag}
                </Badge>
              )}
            </div>

            <Button
              onClick={handleStartPreparation}
              disabled={isAssigning}
              className="mt-2"
            >
              <Play className="h-4 w-4 mr-2" />
              {isAssigning ? 'Assigning...' : 'Start File Preparation'}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // ── Active preparation view ───────────────────────────────────────
  const isPreparing = job.status === 'preparing'
  
  // Strict check for completeness: For now it's always false since files can't be uploaded yet
  // In the future this will check if upload_status === 'completed' for real DB files
  const canComplete = false

  return (
    <div className="space-y-4 pt-4">
      {/* Compact Header Summary */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-border/50">
        <Badge variant="outline" className={`flex items-center gap-1 px-2 py-0.5 ${
          isPreparing ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }`}>
          <span className="font-medium text-xs">{isPreparing ? 'Preparing' : 'Files Ready'}</span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5">
          <User className="h-3 w-3" />
          <span className="text-xs">{order.customer_name || 'Unknown'}</span>
        </Badge>
        <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5">
          <Tag className="h-3 w-3" />
          <span className="text-xs">{order.order_number}</span>
        </Badge>
        {shipTag && (
          <Badge variant="outline" className={`flex items-center gap-1 px-2 py-0.5 ${
            shipTag === 'EXPRESS' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
            'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}>
            {shipTag === 'EXPRESS' ? <Truck className="h-3 w-3" /> : <Package className="h-3 w-3" />}
            <span className="text-xs">{shipTag}</span>
          </Badge>
        )}
        {job.production_date && (
          <span className="text-xs text-muted-foreground ml-auto">
            {job.production_date}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Sample toggle */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-card/50 border border-border/50 shadow-sm">
            <Checkbox
              id="include-sample"
              checked={includeSample}
              onCheckedChange={(checked) => handleSampleToggle(checked === true)}
              disabled={isSampleUpdating}
            />
            <Label htmlFor="include-sample" className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <Package className="h-4 w-4 text-muted-foreground" />
              SAMPLE — Add sample pack to this order
            </Label>
          </div>

          {/* Design Files */}
          <Card className="border-border/50 bg-card/50 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 bg-muted/20">
              <h3 className="font-medium text-sm flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Design Files
              </h3>
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={addDesignFile}>
                <Plus className="h-3 w-3 mr-1" />
                Add Design File
              </Button>
            </div>
            
            <div className="p-3 space-y-2">
              {designFiles.map((df, index) => (
                <div key={df.id} className="flex flex-col gap-2 p-2.5 rounded-md border border-border/40 bg-background/50">
                  <div className="flex items-start gap-2">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-0 pt-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === 0} onClick={() => moveDesignFile(index, 'up')}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5" disabled={index === designFiles.length - 1} onClick={() => moveDesignFile(index, 'down')}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 flex flex-wrap items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                        {designFiles.length > 1 ? `File ${String(index + 1).padStart(2, '0')}` : 'File'}
                      </span>
                      
                      <div className="flex-1 min-w-[200px]">
                        <input type="file" id={`design-file-${df.id}`} className="hidden" accept="image/*,.pdf,.ai,.eps,.svg" onChange={(e) => handleDesignFileSelect(df.id, e.target.files?.[0] || null)} />
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-start px-2.5" onClick={() => document.getElementById(`design-file-${df.id}`)?.click()}>
                          <Upload className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                          <span className="truncate font-normal">{df.file ? df.file.name : 'Choose Design File'}</span>
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Length:</Label>
                        <Input type="number" min={1} step={1} placeholder="257" className="h-8 w-20 text-xs px-2" value={df.lengthInches ?? ''} onChange={(e) => {
                          const val = e.target.value ? parseInt(e.target.value, 10) : null
                          updateDesignFile(df.id, { lengthInches: val && val > 0 ? val : null })
                        }} />
                        <span className="text-xs text-muted-foreground">IN</span>
                      </div>
                      
                      {designFiles.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeDesignFile(df.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {generatedFilenames.design[index] && (
                    <div className="ml-7 pl-1">
                      <div className="px-2 py-1 rounded bg-muted/30 border border-border/40 font-mono text-[10px] text-muted-foreground truncate w-full" title={generatedFilenames.design[index]}>
                        {generatedFilenames.design[index]}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          
          {/* Preparation Details */}
          <Card className="border-border/50 bg-card/50 shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
              <h3 className="font-medium text-sm flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Preparation Details
              </h3>
            </div>
            <div className="p-3 space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{isPreparing ? 'Preparing' : 'Files Ready'}</span>
              </div>
              {job.preparation_started_by && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Prepared by</span>
                  <span className="text-right truncate max-w-[120px]">{job.staff?.display_name || job.staff?.username || username}</span>
                </div>
              )}
              {job.preparation_started_at && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Started</span>
                  <span className="text-right text-xs">{new Date(job.preparation_started_at).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              )}
              {job.completed_at && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="text-right text-xs">{new Date(job.completed_at).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Shipping Label */}
          <Card className="border-border/50 bg-card/50 shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-border/50 bg-muted/20">
              <h3 className="font-medium text-sm flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Shipping Label
              </h3>
            </div>
            <div className="p-3">
              {isPickup ? (
                <div className="flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border/40">
                  <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground leading-tight">
                    No shipping label required for pickup orders.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <input type="file" id="label-file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setLabelFile({ file: e.target.files?.[0] || null })} />
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs justify-start px-2.5" onClick={() => document.getElementById('label-file')?.click()}>
                    <Upload className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    <span className="truncate font-normal">{labelFile.file ? labelFile.file.name : 'Choose Label File'}</span>
                  </Button>
                  {labelFile.file && (
                    <div className="flex items-center justify-between pl-1 pr-0.5">
                      <span className="text-[10px] text-muted-foreground">{(labelFile.file.size / 1024 / 1024).toFixed(2)} MB</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => setLabelFile({ file: null })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {generatedFilenames.label && (
                    <div className="px-2 py-1 rounded bg-muted/30 border border-border/40 font-mono text-[10px] text-muted-foreground truncate w-full" title={generatedFilenames.label}>
                      {generatedFilenames.label}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Action Area */}
          <div className="space-y-3 pt-2">
            {isPreparing && (
              <Button onClick={handleCompletePreparation} disabled={!canComplete || isAssigning} className="w-full">
                {isAssigning ? 'Completing...' : 'Complete File Preparation'}
              </Button>
            )}
            
            {/* Storage Notice */}
            <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1" />
              <span className="text-[10px] text-amber-500/90 leading-tight">
                Storage not connected — files are previewed locally only. Upload will be available when storage is configured.
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
