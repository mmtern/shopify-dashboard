'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { ProductionStatus, PRODUCTION_STATUSES, ProductionStatusKey } from '@/lib/types'
import { useTranslation } from '@/components/i18n-provider'

interface StatusCheckboxesProps {
  orderId: string
  status: ProductionStatus | null
}

export function StatusCheckboxes({ orderId, status }: StatusCheckboxesProps) {
  const { t } = useTranslation()
  const [localStatus, setLocalStatus] = useState<Partial<ProductionStatus>>(status || {})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})

  const handleToggle = async (key: string, checked: boolean) => {
    // Optimistic update
    setLocalStatus(prev => ({
      ...prev,
      [key]: checked,
      [`\${key}_at`]: checked ? new Date().toISOString() : null
    }))
    
    setIsLoading(prev => ({ ...prev, [key]: true }))
    
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          field: key,
          value: checked,
        }),
      })
      
      if (!res.ok) throw new Error('Failed to update status')
      
      toast.success('Status updated')
    } catch (error) {
      console.error(error)
      toast.error('Failed to update status')
      // Revert on error
      setLocalStatus(prev => ({
        ...prev,
        [key]: !checked,
      }))
    } finally {
      setIsLoading(prev => ({ ...prev, [key]: false }))
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {PRODUCTION_STATUSES.map((stage) => {
        const isChecked = !!localStatus[stage.key as keyof ProductionStatus]
        const timestampStr = localStatus[`\${stage.key}_at` as keyof ProductionStatus] as string | undefined
        const isProblem = stage.key === 'problem_hold'
        
        return (
          <div 
            key={stage.key}
            className={`
              flex flex-col p-3 rounded-lg border transition-colors
              \${isChecked 
                ? isProblem ? 'bg-red-500/10 border-red-500/30' : 'bg-primary/5 border-primary/20' 
                : 'bg-transparent border-border/50 hover:bg-muted/30'
              }
            `}
          >
            <div className="flex items-center space-x-2">
              <Checkbox 
                id={`status-\${orderId}-\${stage.key}`}
                checked={isChecked}
                disabled={isLoading[stage.key]}
                onCheckedChange={(checked) => handleToggle(stage.key, checked as boolean)}
                className={isProblem && isChecked ? 'data-[state=checked]:bg-red-500 data-[state=checked]:text-white' : ''}
              />
              <Label 
                htmlFor={`status-${orderId}-${stage.key}`}
                className={`text-sm font-medium leading-none cursor-pointer flex items-center gap-1.5 ${isProblem && isChecked ? 'text-red-500' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                {t.status[stage.key as keyof typeof t.status] || stage.label}
              </Label>
            </div>
            
            <div className="mt-2 pl-6 min-h-[1rem]">
              {isChecked && timestampStr ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger 
                      render={
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider cursor-default">
                          {format(new Date(timestampStr), 'MMM dd, HH:mm')}
                        </span>
                      } 
                    />
                    <TooltipContent>
                      <p>{format(new Date(timestampStr), 'PPpp')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
