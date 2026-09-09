import { getMockOrders, getMockStaff } from '@/lib/mock-data'
import { OrdersTable } from '@/components/orders/orders-table'
import { Badge } from '@/components/ui/badge'
import { getDictionary } from '@/lib/i18n/server'

export default async function DashboardPage() {
  // Use mock data for now
  const orders = getMockOrders()
  const staff = getMockStaff()
  
  const t = await getDictionary()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{t.ordersTitle}</h1>
            <Badge variant="secondary" className="text-sm font-medium">
              {orders.length}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {t.ordersDesc}
          </p>
        </div>
      </div>

      <OrdersTable data={orders} staffList={staff} />
    </div>
  )
}
