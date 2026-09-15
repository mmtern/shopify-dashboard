'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Package, Truck, User } from 'lucide-react'
import { OrderWithDetails, PRODUCTION_STATUSES } from '@/lib/types'
import { getShippingStyle, isPickupOrder } from '@/lib/production/shipping'

export const columns: ColumnDef<OrderWithDetails>[] = [
  {
    accessorKey: 'order_number',
    size: 100,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.order || 'Order'
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('order_number')}</div>
    ),
  },
  {
    accessorKey: 'created_at',
    size: 140,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.date || 'Date'
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return (
        <div className="flex flex-col">
          <span>{format(date, 'MMM dd, yyyy')}</span>
          <span className="text-xs text-muted-foreground">{format(date, 'HH:mm')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'customer_name',
    size: 200,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.customer || 'Customer'
    },
    cell: ({ row }) => {
      return (
        <div className="flex flex-col truncate pr-4">
          <span className="font-medium truncate">{row.getValue('customer_name') || 'Unknown'}</span>
          <span className="text-xs text-muted-foreground truncate">{row.original.customer_email || 'No email'}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'shipping_method',
    size: 180,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.shipping || 'Shipping'
    },
    cell: ({ row }) => {
      const method = (row.getValue('shipping_method') as string) || ''
      const style = getShippingStyle(method)

      if (!style) {
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 w-fit text-xs">
            <Truck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{method || 'Unknown'}</span>
          </Badge>
        )
      }

      const Icon = style.iconKey === 'package' ? Package : Truck

      return (
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 w-fit text-xs ${style.bg} ${style.text} ${style.border} hover:${style.bg}`}
        >
          <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{style.label}</span>
        </Badge>
      )
    },
  },
  {
    id: 'file_staff',
    size: 140,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.files || 'Files'
    },
    cell: ({ row }) => {
      const job = row.original.production_job
      const files = row.original.order_files || []
      
      if (!job) {
        return <span className="text-muted-foreground text-xs">—</span>
      }

      const activeFiles = files.filter(f => f.is_active)
      const isPickup = isPickupOrder(row.original.shipping_method)
      
      const designFiles = activeFiles.filter(f => f.file_type === 'design')
      const labelFiles = activeFiles.filter(f => f.file_type === 'shipping_label')
      
      let isReady = job.status === 'ready'
      const isPreparing = job.status === 'preparing'

      if (isReady) {
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 whitespace-nowrap">
            Files Ready
          </Badge>
        )
      } else if (activeFiles.length > 0) {
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 whitespace-nowrap">
            {activeFiles.length} File{activeFiles.length === 1 ? '' : 's'}
          </Badge>
        )
      } else {
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 whitespace-nowrap">
            Preparing
          </Badge>
        )
      }
    },
  },
  {
    id: 'print_staff',
    size: 120,
    header: ({ table, column }) => {
      return (table.options.meta as any)?.columnNames?.[column.id] || 'Print'
    },
    cell: ({ row, table }) => {
      const stageStaff = (table.options.meta as any)?.stageStaff || {}
      const orderId = row.original.id
      const staffName = stageStaff[orderId]?.printing || null

      if (!staffName) {
        return <span className="text-muted-foreground text-xs">—</span>
      }

      return (
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 shrink-0 text-indigo-400" />
          <span className="text-sm truncate">{staffName}</span>
        </div>
      )
    },
  },
  {
    id: 'production_status',
    size: 160,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.stage || 'Stage'
    },
    cell: ({ row, table }) => {
      const stageKey = row.original.production_status?.stage || 'new_order'
      const t = (table.options.meta as any)?.t

      const stages = [
        { key: 'new_order', label: t?.status?.new_order || 'New Order', color: 'bg-slate-400' },
        { key: 'ready_for_print', label: t?.status?.ready_for_print || 'Ready for Print', color: 'bg-violet-400' },
        { key: 'printing', label: t?.status?.printing || 'Printing', color: 'bg-indigo-400' },
        { key: 'printed', label: t?.status?.printed || 'Printed', color: 'bg-blue-400' },
        { key: 'ready_for_pickup', label: t?.status?.ready_for_pickup || 'Ready for Pickup', color: 'bg-teal-400' },
        { key: 'ready_to_ship', label: t?.status?.ready_to_ship || 'Ready to Ship', color: 'bg-green-400' },
        { key: 'shipped', label: t?.status?.shipped || 'Shipped', color: 'bg-emerald-500' },
      ]

      const currentStage = stages.find(s => s.key === stageKey) || stages[0]

      return (
        <Badge variant="outline" className="flex gap-1.5 items-center w-fit">
          <div className={`w-2 h-2 rounded-full shrink-0 ${currentStage.color}`} />
          <span className="truncate">{currentStage.label}</span>
        </Badge>
      )
    },
  },
]

