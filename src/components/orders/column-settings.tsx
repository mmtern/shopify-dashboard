'use client'

import * as React from 'react'
import { Table } from '@tanstack/react-table'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Settings2, GripVertical, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from '@/components/i18n-provider'

interface ColumnSettingsProps<TData> {
  table: Table<TData>
}

function SortableItem({
  id,
  column,
  customName,
  onNameChange,
  onVisibilityChange,
}: {
  id: string
  column: any
  customName: string
  onNameChange: (id: string, name: string) => void
  onVisibilityChange: (id: string, visible: boolean) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 bg-background border rounded-md shadow-sm"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1">
        <Input
          value={customName}
          onChange={(e) => onNameChange(id, e.target.value)}
          className="h-8"
        />
      </div>

      <div className="flex items-center gap-2">
        {column.getIsVisible() ? (
          <Eye className="h-4 w-4 text-muted-foreground" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground opacity-50" />
        )}
        <Switch
          checked={column.getIsVisible()}
          onCheckedChange={(checked) => onVisibilityChange(id, checked)}
        />
      </div>
    </div>
  )
}

export function ColumnSettings<TData>({ table }: ColumnSettingsProps<TData>) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = React.useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const meta = table.options.meta as any
  const customNames = meta?.columnNames || {}

  const columns = table.getAllLeafColumns()

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((col) => col.id === active.id)
      const newIndex = columns.findIndex((col) => col.id === over.id)

      const newOrder = arrayMove(columns, oldIndex, newIndex).map((c) => c.id)

      table.setColumnOrder(newOrder)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">{t.columns}</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.columnSettings}</DialogTitle>
          <DialogDescription>
            {t.columnSettingsDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 pb-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((col) => col.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2 max-h-[60vh] overflow-y-auto px-1 pb-1">
                {columns.map((column) => {
                  const DEFAULT_NAMES: Record<string, string> = {
                    order_number: t.order,
                    created_at: t.date,
                    customer_name: t.customer,
                    shipping_method: t.shipping,
                    file_staff: 'File',
                    print_staff: 'Print',
                    production_status: t.stage,
                  }

                  const defaultName = DEFAULT_NAMES[column.id] || column.id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  const name = customNames[column.id] || defaultName

                  return (
                    <SortableItem
                      key={column.id}
                      id={column.id}
                      column={column}
                      customName={name}
                      onNameChange={(id, val) => meta?.setColumnName?.(id, val)}
                      onVisibilityChange={(id, visible) => {
                        column.toggleVisibility(visible)
                      }}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-4 pt-4 border-t flex justify-end items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (meta?.resetPreferences) {
                  meta.resetPreferences()
                }
              }}
            >
              {t.restoreDefaults || 'Restore Defaults'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
