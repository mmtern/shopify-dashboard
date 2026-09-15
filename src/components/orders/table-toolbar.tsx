'use client'

import { Table } from '@tanstack/react-table'
import { Search, RefreshCw, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ColumnSettings } from './column-settings'
import { useTranslation } from '@/components/i18n-provider'
import { useState, useRef, useCallback, useEffect } from 'react'

interface TableToolbarProps<TData> {
  table: Table<TData>
  onSync: () => Promise<void>
  onSearch: (query: string) => void
  initialSearch?: string
}

export function TableToolbar<TData>({
  table,
  onSync,
  onSearch,
  initialSearch = '',
}: TableToolbarProps<TData>) {
  const { t } = useTranslation()
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchValue, setSearchValue] = useState(initialSearch)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await onSync()
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onSearch(value.trim())
    }, 500)
  }, [onSearch])

  const clearSearch = useCallback(() => {
    setSearchValue('')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onSearch('')
  }, [onSearch])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex flex-1 items-center space-x-2 w-full sm:w-auto">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchOrders}
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (debounceRef.current) clearTimeout(debounceRef.current)
                onSearch(searchValue.trim())
              }
            }}
            className="pl-9 pr-9 bg-card"
          />
          {searchValue && (
            <button
              onClick={clearSearch}
              className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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

