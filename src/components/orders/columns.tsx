'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Package, Truck } from 'lucide-react'
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
    accessorKey: 'financial_status',
    size: 130,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.payment || 'Payment'
    },
    cell: ({ row, table }) => {
      const status = row.getValue('financial_status') as string
      const t = (table.options.meta as any)?.t
      const translatedStatus = t?.financial?.[status] || status || t?.financial?.PENDING || 'PENDING'
      return (
        <Badge variant={status === 'PAID' ? 'default' : 'secondary'} className={status === 'PAID' ? 'bg-green-600/10 text-green-600 hover:bg-green-600/20 border-green-600/20' : ''}>
          {translatedStatus}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'fulfillment_status',
    size: 150,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.fulfillment || 'Fulfillment'
    },
    cell: ({ row, table }) => {
      const status = row.getValue('fulfillment_status') as string
      const t = (table.options.meta as any)?.t
      const translatedStatus = t?.fulfillmentStatus?.[status] || status || t?.fulfillmentStatus?.UNFULFILLED || 'UNFULFILLED'
      return (
        <Badge variant={status === 'FULFILLED' ? 'default' : 'outline'} className={status === 'FULFILLED' ? 'bg-blue-600/10 text-blue-600 hover:bg-blue-600/20 border-blue-600/20' : ''}>
          {translatedStatus}
        </Badge>
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
    cell: ({ row, table }) => {
      const method = row.getValue('shipping_method') as string
      const t = (table.options.meta as any)?.t
      
      let translatedMethod = method || t?.shippingMethod?.Standard || 'Standard'
      if (method?.includes('Express')) translatedMethod = t?.shippingMethod?.Express || 'Express'
      if (method?.includes('Pickup')) translatedMethod = t?.shippingMethod?.Pickup || 'Pickup'
      if (method?.includes('Standard')) translatedMethod = t?.shippingMethod?.Standard || 'Standard'

      return (
        <div className="flex items-center gap-2 text-sm truncate pr-4">
          {method?.includes('Pickup') ? <Package className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />}
          <span className="truncate">{translatedMethod}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'total_price',
    size: 100,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.total || 'Total'
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('total_price'))
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: row.original.currency || 'USD',
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
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
  {
    accessorKey: 'tags',
    size: 120,
    header: ({ table, column }) => {
      const t = (table.options.meta as any)?.t
      return (table.options.meta as any)?.columnNames?.[column.id] || t?.tags || 'Tags'
    },
    filterFn: (row, id, filterValue) => {
      const tags = row.getValue(id) as string[]
      if (!tags) return false
      return tags.some(tag => tag.toLowerCase().includes(filterValue.toLowerCase()))
    },
    cell: () => null,
    enableHiding: true,
  },
]
