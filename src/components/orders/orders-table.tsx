'use client'

import * as React from 'react'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
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
}

import { toast } from 'sonner'

export function OrdersTable({ data, staffList }: OrdersTableProps) {
  const { t } = useTranslation()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    financial_status: false,
    fulfillment_status: false,
    total_price: false,
  })
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [columnNames, setColumnNames] = React.useState<Record<string, string>>({})
  const [rowSelection, setRowSelection] = React.useState({})

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

  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: 50 })

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowCanExpand: () => true,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      columnOrder,
      rowSelection,
      pagination,
    },
    meta: {
      t,
      columnNames,
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
        await new Promise(resolve => setTimeout(resolve, 1500))
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
                            className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-border/50 group-hover:bg-border ${
                              header.column.getIsResizing() ? 'bg-primary w-1.5' : ''
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
                          <OrderDetails order={row.original} staffList={staffList} />
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
          {table.getFilteredSelectedRowModel().rows.length} {t.pagination.selected}{' '}
          {table.getFilteredRowModel().rows.length} {t.pagination.rowsSelected}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t.pagination.previous}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t.pagination.next}
          </Button>
        </div>
      </div>
    </div>
  )
}
