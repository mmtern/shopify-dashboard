'use client'

import { Table } from '@tanstack/react-table'
import { Search, RefreshCw, Columns } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { ColumnSettings } from './column-settings'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '@/components/i18n-provider'

interface TableToolbarProps<TData> {
  table: Table<TData>
  onSync: () => Promise<void>
}

export function TableToolbar<TData>({
  table,
  onSync,
}: TableToolbarProps<TData>) {
  const { t } = useTranslation()
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await onSync()
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex flex-1 items-center space-x-2 w-full sm:w-auto">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchOrders}
            value={(table.getColumn('order_number')?.getFilterValue() as string) ?? ''}
            onChange={(event) =>
              table.getColumn('order_number')?.setFilterValue(event.target.value)
            }
            className="pl-9 bg-card"
          />
        </div>
      </div>
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <Button
          variant="outline"
          size="sm"
          className="h-9 ml-auto hidden lg:flex"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {t.syncOrders}
        </Button>
        <ColumnSettings table={table} />
      </div>
    </div>
  )
}
