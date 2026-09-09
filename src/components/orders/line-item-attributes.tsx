'use client'
import 'client-only'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CustomAttribute, URL_ATTRIBUTE_KEYS, META_ATTRIBUTE_KEYS } from '@/lib/types'
import { Eye, Pencil, Settings, FileDown, Upload, Image as ImageIcon, Link as LinkIcon, Check, X } from 'lucide-react'
import { useTranslation } from '@/components/i18n-provider'

interface LineItemAttributesProps {
  attributes: CustomAttribute[] | null
}

export function LineItemAttributes({ attributes }: LineItemAttributesProps) {
  const { t } = useTranslation()

  if (!attributes || attributes.length === 0) return null

  const getIconForUrlKey = (key: string) => {
    switch (key) {
      case 'Preview': return <Eye className="w-3 h-3 mr-1" />
      case 'Edit': return <Pencil className="w-3 h-3 mr-1" />
      case '_Admin Edit': return <Settings className="w-3 h-3 mr-1" />
      case '_Print Ready File': return <FileDown className="w-3 h-3 mr-1" />
      case 'upload': return <Upload className="w-3 h-3 mr-1" />
      case 'thumbnail': return <ImageIcon className="w-3 h-3 mr-1" />
      default: return <LinkIcon className="w-3 h-3 mr-1" />
    }
  }

  const formatKeyName = (key: string) => {
    return key.replace(/^_/, '') // Remove leading underscore
  }

  const urlAttributes = attributes.filter(
    attr => URL_ATTRIBUTE_KEYS.includes(attr.key as any) && attr.value.startsWith('http')
  )

  const metaAttributes = attributes.filter(
    attr => META_ATTRIBUTE_KEYS.includes(attr.key as any)
  )

  const otherAttributes = attributes.filter(
    attr => !URL_ATTRIBUTE_KEYS.includes(attr.key as any) && !META_ATTRIBUTE_KEYS.includes(attr.key as any)
  )

  return (
    <div className="space-y-3">
      {urlAttributes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urlAttributes.map((attr, i) => (
            <a
              key={i}
              href={attr.value}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 h-7 gap-1 px-2.5 text-[0.8rem] bg-primary/10 text-primary hover:bg-primary/20 border-primary/20"
            >
              {getIconForUrlKey(attr.key)}
              {formatKeyName(attr.key)}
            </a>
          ))}
        </div>
      )}

      {metaAttributes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {metaAttributes.map((attr, i) => {
            if (attr.key === '_Has Transparency') {
              const isTransparent = attr.value.toLowerCase() === 'true'
              return (
                <Badge key={i} variant="outline" className="text-xs bg-background">
                  {isTransparent ? <Check className="w-3 h-3 text-emerald-500 mr-1" /> : <X className="w-3 h-3 text-muted-foreground mr-1" />}
                  {isTransparent ? t.transparent : t.opaque}
                </Badge>
              )
            }
            if (attr.key === '_Actual Height') {
              return (
                <Badge key={i} variant="outline" className="text-xs bg-background">
                  ↕ {attr.value}" {t.height}
                </Badge>
              )
            }
            return null
          })}
        </div>
      )}

      {otherAttributes.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {otherAttributes.map((attr, i) => (
            <div key={i} className="flex gap-1.5">
              <span className="text-muted-foreground">{formatKeyName(attr.key)}:</span>
              <span className="font-medium truncate max-w-[200px]" title={attr.value}>{attr.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
