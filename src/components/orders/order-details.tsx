'use client'

import 'client-only'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrderWithDetails, Staff } from '@/lib/types'
import { StatusSelector } from './status-selector'
import { InternalNotes } from './internal-notes'
import { FilesTab } from './files-tab'
import { StatusHistory } from './status-history'
import { LineItemAttributes } from './line-item-attributes'
import { MapPin, User, Mail, Phone, Hash, Image as ImageIcon } from 'lucide-react'
import { StaffSelect } from './staff-select'
import { useTranslation } from '@/components/i18n-provider'

interface OrderDetailsProps {
  order: OrderWithDetails
  staffList: Staff[]
  username: string
  onStageChange?: (orderId: string, stageKey: string, staffName: string) => void
}

export function OrderDetails({ order, staffList, username, onStageChange }: OrderDetailsProps) {
  const { t } = useTranslation()

  return (
    <div className="p-4 space-y-4">
      <Tabs defaultValue="production" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto">
          <TabsTrigger
            value="production"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
          >
            {t.productionTracker}
          </TabsTrigger>
          <TabsTrigger
            value="items"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
          >
            {t.lineItems} ({order.line_items?.length || 0})
          </TabsTrigger>
          <TabsTrigger
            value="files"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
          >
            {t.files || 'Files'}
          </TabsTrigger>
          <TabsTrigger
            value="notes"
            className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2"
          >
            {t.internalNotes}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="production" className="pt-4 space-y-6 outline-none">
          <Card className="p-4 border-border/50 bg-card/50 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{t.productionStatus}</h3>
            </div>
            <StatusSelector
              orderId={order.id}
              currentStage={order.production_status?.stage || 'new_order'}
              staffId={order.production_status?.assigned_staff_id || undefined}
              username={username}
              onStageChange={onStageChange}
            />
          </Card>
          <Card className="p-4 border-border/50 bg-card/50 shadow-sm">
            <h3 className="font-medium mb-4">{t.activityHistory}</h3>
            <StatusHistory history={order.status_history || []} />
          </Card>
        </TabsContent>

        <TabsContent value="items" className="pt-4 space-y-4 outline-none">
          {order.line_items?.map((item) => (
            <Card key={item.id} className="p-4 border-border/50 bg-card/50 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row gap-4">
                {item.image_url ? (
                  <div className="w-16 h-16 rounded-md border border-border bg-muted overflow-hidden shrink-0">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs text-muted-foreground">{t.noImg}</span>
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      {item.variant_title && (
                        <p className="text-sm text-muted-foreground">{item.variant_title}</p>
                      )}
                      {item.sku && (
                        <p className="text-xs text-muted-foreground mt-1">{t.sku}: {item.sku}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">
                        ×{item.quantity}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-border/50">
                    <LineItemAttributes attributes={item.custom_attributes} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="files" className="pt-4 outline-none">
          <FilesTab order={order} username={username} />
        </TabsContent>

        <TabsContent value="notes" className="pt-4 outline-none">
          <Card className="p-0 border-border/50 bg-card/50 shadow-sm overflow-hidden">
            <InternalNotes orderId={order.id} notes={order.internal_notes || []} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
