'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Package, Truck, User } from 'lucide-react'
import { OrderWithDetails, PRODUCTION_STATUSES } from '@/lib/types'

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
      const upper = method.toUpperCase()

      type ShippingStyle = { label: string; icon: React.ReactNode; bg: string; text: string; border: string; dot: string }

      const styles: Record<string, ShippingStyle> = {
        PICKUP: {
          label: 'Pickup',
          icon: <Package className="h-3.5 w-3.5 shrink-0" />,
          bg: 'bg-slate-500/10',
          text: 'text-slate-400',
          border: 'border-slate-500/20',
          dot: 'bg-slate-400',
        },
        STANDARD: {
          label: 'Standard',
          icon: <Truck className="h-3.5 w-3.5 shrink-0" />,
          bg: 'bg-sky-500/10',
          text: 'text-sky-400',
          border: 'border-sky-500/20',
          dot: 'bg-sky-400',
        },
        RUSH: {
          label: 'Rush',
          icon: <Truck className="h-3.5 w-3.5 shrink-0" />,
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          border: 'border-amber-500/20',
          dot: 'bg-amber-400',
        },
        NEXTDAY: {
          label: 'Next-Day',
          icon: <Truck className="h-3.5 w-3.5 shrink-0" />,
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
          border: 'border-rose-500/20',
          dot: 'bg-rose-400',
        },
        SATURDAY: {
          label: 'Saturday',
          icon: <Truck className="h-3.5 w-3.5 shrink-0" />,
          bg: 'bg-violet-500/10',
          text: 'text-violet-400',
          border: 'border-violet-500/20',
          dot: 'bg-violet-400',
        },
      }

      const matchKey = upper.includes('PICKUP') || upper.includes('SHOP') ? 'PICKUP'
        : upper.includes('NEXT') ? 'NEXTDAY'
        : upper.includes('RUSH') ? 'RUSH'
        : upper.includes('SATURDAY') ? 'SATURDAY'
        : upper.includes('STANDARD') ? 'STANDARD'
        : null

      const style = matchKey ? styles[matchKey] : null

      if (!style) {
        return (
          <Badge variant="outline" className="flex items-center gap-1.5 w-fit text-xs">
            <Truck className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{method || 'Unknown'}</span>
          </Badge>
        )
      }

      return (
        <Badge
          variant="outline"
          className={`flex items-center gap-1.5 w-fit text-xs ${style.bg} ${style.text} ${style.border} hover:${style.bg}`}
        >
          <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
          {style.icon}
          <span className="truncate">{style.label}</span>
        </Badge>
      )
    },
  },
  {
    id: 'file_staff',
    size: 120,
    header: ({ table, column }) => {
      return (table.options.meta as any)?.columnNames?.[column.id] || 'File'
    },
    cell: ({ row, table }) => {
      const stageStaff = (table.options.meta as any)?.stageStaff || {}
      const orderId = row.original.id
      const staffName = stageStaff[orderId]?.ready_for_print || null

      if (!staffName) {
        return <span className="text-muted-foreground text-xs">—</span>
      }

      return (
        <div className="flex items-center gap-1.5">
          <User className="h-3 w-3 shrink-0 text-violet-400" />
          <span className="text-sm truncate">{staffName}</span>
        </div>
      )
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

