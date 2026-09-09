'use client'
import 'client-only'
import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Staff } from '@/lib/types'
import { toast } from 'sonner'
import { UserPlus } from 'lucide-react'
import { useTranslation } from '@/components/i18n-provider'

interface StaffSelectProps {
  orderId: string
  currentStaffId: string | null
  staffList: Staff[]
}

export function StaffSelect({ orderId, currentStaffId, staffList }: StaffSelectProps): React.JSX.Element {
  const { t } = useTranslation()
  const [value, setValue] = useState<string>(currentStaffId || 'unassigned')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleChange = async (newValue: string | null) => {
    if (!newValue) return
    setValue(newValue)
    setIsUpdating(true)
    
    try {
      const staffId = newValue === 'unassigned' ? null : newValue
      
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          field: 'assigned_staff_id',
          value: staffId,
        }),
      })

      if (!res.ok) throw new Error('Failed to assign staff')
      
      if (staffId) {
        const staff = staffList.find(s => s.id === staffId)
        toast.success(`${t.assigned} - ${staff?.display_name || staff?.username}`)
      } else {
        toast.success(t.unassignedStaff)
      }
    } catch (error) {
      console.error(error)
      toast.error((t as any).notifications?.assignmentFailed || 'Failed to update assignment')
      setValue(currentStaffId || 'unassigned') // Revert on error
    } finally {
      setIsUpdating(false)
    }
  }

  // Find current staff for the trigger display
  const currentStaff = value !== 'unassigned' 
    ? staffList.find(s => s.id === value) 
    : null

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">{t.assignStaff}:</span>
      <Select value={value} onValueChange={handleChange} disabled={isUpdating}>
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue>
            {currentStaff ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {currentStaff.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{currentStaff.display_name || currentStaff.username}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserPlus className="h-4 w-4" />
                <span>{t.unassignedStaff}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="unassigned" className="text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>{t.unassignedStaff}</span>
            </div>
          </SelectItem>
          {staffList.map((staff) => (
            <SelectItem key={staff.id} value={staff.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {staff.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{staff.display_name || staff.username}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
