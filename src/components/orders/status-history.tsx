'use client'

import 'client-only'
import { format } from 'date-fns'
import { StatusHistoryEntry, PRODUCTION_STATUSES } from '@/lib/types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/components/i18n-provider'

import { formatDistanceToNow } from 'date-fns'

interface StatusHistoryProps {
  history: StatusHistoryEntry[]
}

export function StatusHistory({ history }: StatusHistoryProps) {
  const { t } = useTranslation()

  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground italic border rounded-md border-dashed">
        {t.noHistory}
      </div>
    )
  }

  // Sort by newest first
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  )

  const getStatusLabel = (key: string) => {
    return t.status[key as keyof typeof t.status] || key
  }

  return (
    <ScrollArea className="h-[250px] pr-4">
      <div className="relative space-y-6 before:absolute before:inset-0 before:ml-[5px] before:h-full before:w-[2px] before:bg-border/60 py-2">
        {sortedHistory.map((entry, index) => {
          const date = new Date(entry.changed_at)
          
          let actionText = ''
          if (entry.status_field === 'stage') {
             const stageLabel = getStatusLabel(entry.new_value as string)
             actionText = `${stageLabel} stage activated.`
          } else if (entry.status_field === 'assigned_staff_id') {
             actionText = entry.new_value ? `Staff assigned to ${entry.new_value}.` : `Staff unassigned.`
          } else {
             const stageLabel = getStatusLabel(entry.status_field)
             actionText = `${stageLabel} was marked as ${entry.new_value ? 'complete' : 'incomplete'}.`
          }

          const staffName = entry.staff?.display_name || entry.staff?.username || t.system
          
          // Format as "Action. - By User"
          const fullText = (
            <span>
              {actionText} <span className="text-muted-foreground ml-1">— {staffName}</span>
            </span>
          )

          return (
            <div key={entry.id} className="relative flex items-center gap-4 pl-6 group">
              <div className="absolute left-[0px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted-foreground ring-4 ring-card" />
              
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="text-sm text-foreground">
                  {fullText}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(date, { addSuffix: true })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}
