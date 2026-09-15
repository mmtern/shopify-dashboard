'use client'
import 'client-only'
import { useState } from 'react'
import { PRODUCTION_STATUSES, ProductionStatusKey } from '@/lib/types'
import { toast } from 'sonner'
import { useTranslation } from '@/components/i18n-provider'

interface StatusSelectorProps {
  orderId: string
  currentStage: string
  staffId?: string
  username?: string
  onStageChange?: (orderId: string, stageKey: string, staffName: string) => void
}

export function StatusSelector({ orderId, currentStage, staffId, username, onStageChange }: StatusSelectorProps): React.JSX.Element {
  const { t } = useTranslation()
  const [activeStage, setActiveStage] = useState<string>(currentStage || 'new_order')
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleStatusChange = async (stageKey: string) => {
    // If it's already the active stage, do nothing
    if (activeStage === stageKey) return

    setIsUpdating(stageKey)
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          field: 'stage',
          value: stageKey,
          staffId,
        }),
      })

      if (!res.ok) throw new Error('Failed to update status')

      setActiveStage(stageKey)
      // Record who triggered this stage
      if (onStageChange && username) {
        onStageChange(orderId, stageKey, username)
      }
      const stageName = t.status[stageKey as keyof typeof t.status] || stageKey
      toast.success(stageName + ' ' + ((t as any).notifications?.statusUpdated || 'stage activated'))
    } catch (error) {
      console.error(error)
      toast.error((t as any).notifications?.statusFailed || 'Failed to update status')
    } finally {
      setIsUpdating(null)
    }
  }

  const activeIndex = PRODUCTION_STATUSES.findIndex(s => s.key === activeStage)

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-start justify-between min-w-[700px] w-full p-4 py-8">
        {PRODUCTION_STATUSES.map(({ key, label, color }, index) => {
          const isActive = activeStage === key
          const isPast = index < activeIndex
          const isPending = isUpdating === key
          const isLast = index === PRODUCTION_STATUSES.length - 1
          const translatedLabel = t.status[key as keyof typeof t.status] || label

          return (
            <div key={key} className="relative flex flex-col items-center flex-1 group">
              {/* Connecting Line */}
              {!isLast && (
                <div 
                  className={`absolute top-3 left-[50%] w-full h-[2px] z-0 transition-colors duration-300 ${isPast ? 'bg-green-600/50' : 'bg-border'}`} 
                />
              )}
              
              {/* Dot */}
              <button
                onClick={() => handleStatusChange(key)}
                disabled={isUpdating !== null}
                className={`
                  relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-200 z-10 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                  ${isActive 
                    ? 'bg-green-600 border-green-600 ring-4 ring-green-600/20' 
                    : isPast 
                      ? 'bg-green-600 border-green-600' 
                      : 'bg-background border-muted-foreground/30 hover:border-muted-foreground'
                  }
                  ${isUpdating !== null && !isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isPast && !isPending && (
                  <div className="w-2 h-2 bg-background rounded-full" />
                )}
              </button>
              
              {/* Clickable Label */}
              <button
                onClick={() => handleStatusChange(key)}
                disabled={isUpdating !== null}
                className={`
                  mt-4 text-[13px] font-medium px-4 py-2 border rounded-md transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap
                  ${isActive 
                    ? 'bg-green-600/10 border-green-600/30 text-green-600 ring-1 ring-green-600/20' 
                    : 'bg-card border-border text-muted-foreground hover:bg-accent hover:text-foreground'
                  }
                  ${isUpdating !== null && !isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {translatedLabel}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
