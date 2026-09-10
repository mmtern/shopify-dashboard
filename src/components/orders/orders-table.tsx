'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnOrderState,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { OrderWithDetails, Staff } from '@/lib/types'
import { columns } from './columns'
import { TableToolbar } from './table-toolbar'
import { OrderDetails } from './order-details'
import { useTranslation } from '@/components/i18n-provider'

interface OrdersTableProps {
  data: OrderWithDetails[]
  staffList: Staff[]
  pageInfo: { hasNextPage: boolean; endCursor: string | null }
  currentPage: number
  username: string
  initialStageStaff?: Record<string, Record<string, string>>
}

// Per-order stage staff assignments: { [orderId]: { [stageKey]: staffName } }
type StageStaffMap = Record<string, Record<string, string>>

import { toast } from 'sonner'

const CURSOR_HISTORY_KEY = 'orders_cursor_history'

function getCursorHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(sessionStorage.getItem(CURSOR_HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

function setCursorHistory(history: string[]) {
  sessionStorage.setItem(CURSOR_HISTORY_KEY, JSON.stringify(history))
}

export function OrdersTable({ data, staffList, pageInfo, currentPage, username, initialStageStaff = {} }: OrdersTableProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [columnNames, setColumnNames] = React.useState<Record<string, string>>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Track which staff member triggered each stage per order (optimistic updates)
  const [stageStaff, setStageStaff] = React.useState<StageStaffMap>(initialStageStaff)

  const handleStageChange = React.useCallback((orderId: string, stageKey: string, staffName: string) => {
    setStageStaff(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [stageKey]: staffName,
      },
    }))
    // Refresh the server data so the table's Stage column updates
    router.refresh()
  }, [router])

  // Load preferences from localStorage on mount
  React.useEffect(() => {
    const savedVisibility = localStorage.getItem('table_visibility')
    const savedOrder = localStorage.getItem('table_order')
    const savedNames = localStorage.getItem('table_names')

    if (savedVisibility) setColumnVisibility(JSON.parse(savedVisibility))
    if (savedOrder) setColumnOrder(JSON.parse(savedOrder))
    if (savedNames) setColumnNames(JSON.parse(savedNames))
  }, [])

  // Save preferences when they change
  React.useEffect(() => {
    if (Object.keys(columnVisibility).length > 0) {
      localStorage.setItem('table_visibility', JSON.stringify(columnVisibility))
    }
  }, [columnVisibility])

  React.useEffect(() => {
    if (columnOrder.length > 0) {
      localStorage.setItem('table_order', JSON.stringify(columnOrder))
    }
  }, [columnOrder])

  React.useEffect(() => {
    if (Object.keys(columnNames).length > 0) {
      localStorage.setItem('table_names', JSON.stringify(columnNames))
    }
  }, [columnNames])

  // Reset cursor history when landing on page 1 (fresh load)
  React.useEffect(() => {
    if (currentPage === 1) {
      setCursorHistory([])
    }
  }, [currentPage])

  // Auto-refresh orders every 60 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 60000) // 60 seconds
    return () => clearInterval(interval)
  }, [router])

  const handleNextPage = () => {
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) return
    // Push current cursor to history before navigating forward
    const history = getCursorHistory()
    // The cursor that was used to load the current page (from URL or null for page 1)
    const currentCursor = new URLSearchParams(window.location.search).get('cursor') || ''
    history.push(currentCursor)
    setCursorHistory(history)
    router.push(`/?cursor=${encodeURIComponent(pageInfo.endCursor)}&page=${currentPage + 1}`)
  }

  const handlePreviousPage = () => {
    if (currentPage <= 1) return
    const history = getCursorHistory()
    const previousCursor = history.pop()
    setCursorHistory(history)
    if (!previousCursor) {
      // Going back to page 1
      router.push('/')
    } else {
      router.push(`/?cursor=${encodeURIComponent(previousCursor)}&page=${currentPage - 1}`)
    }
  }

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    getRowCanExpand: () => true,
    columnResizeMode: 'onChange',
    manualPagination: true,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
      rowSelection,
    },
    meta: {
      t,
      columnNames,
      stageStaff,
      setColumnName: (id: string, name: string) => {
        setColumnNames(prev => ({ ...prev, [id]: name }))
      },
      resetPreferences: () => {
        setColumnVisibility({})
        setColumnOrder([])
        setColumnNames({})
        localStorage.removeItem('table_visibility')
        localStorage.removeItem('table_order')
        localStorage.removeItem('table_names')
      }
    }
  })

  return (
    <div className="space-y-4">
      <TableToolbar table={table} onSync={async () => {
        router.refresh()
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success((t as any).notifications?.syncedOrders || 'Synced Orders')
      }} />
      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table style={{ tableLayout: 'fixed', width: table.getTotalSize(), minWidth: '100%' }}>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{ width: header.getSize() }}
                        className="relative group"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-border/50 group-hover:bg-border ${header.column.getIsResizing() ? 'bg-primary w-1.5' : ''
                              }`}
                          />
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow
                      data-state={row.getIsSelected() && 'selected'}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => row.toggleExpanded()}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          style={{ width: cell.column.getSize() }}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b">
                          <OrderDetails
                            order={row.original}
                            staffList={staffList}
                            username={username}
                            onStageChange={handleStageChange}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {t.noOrders}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {t.pagination.page} {currentPage}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage <= 1}
          >
            {t.pagination.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={!pageInfo.hasNextPage}
          >
            {t.pagination.next}
          </Button>
        </div>
      </div>
    </div>
  )
}

