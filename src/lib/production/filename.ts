// src/lib/production/filename.ts
// Pure utility for generating production filenames.
// No UI or database dependencies.

import { shippingFilenameTag } from './shipping'

export interface FilenameParams {
  queueNumber: number | null
  shippingMethod: string | null
  includeSample: boolean
  customerName: string | null
  orderNumber: string       // e.g. "#58939" — the # will be stripped
  designLengthInches?: number
  fileSequence?: number     // 1-based, only set when totalDesignFiles > 1
  totalDesignFiles?: number
  fileType: 'design' | 'shipping_label' | 'other'
  originalExtension: string // e.g. ".png", ".pdf"
}

/**
 * Sanitizes a customer name for use in a filename.
 * Uppercases, replaces spaces with hyphens, strips unsafe chars.
 */
function sanitizeCustomerName(name: string | null): string {
  if (!name) return 'UNKNOWN'
  return name
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/[^A-Z0-9\-]/g, '')   // strip everything except A-Z, 0-9, hyphen
    .replace(/-{2,}/g, '-')        // collapse multiple hyphens
    .replace(/^-|-$/g, '')         // trim leading/trailing hyphens
    || 'UNKNOWN'
}

/**
 * Strips the leading # from an order number and returns just the digits.
 */
function sanitizeOrderNumber(orderNumber: string): string {
  return orderNumber.replace(/^#/, '').trim()
}

/**
 * Normalizes a file extension: ensures it starts with a dot, lowercased.
 */
function normalizeExtension(ext: string): string {
  const cleaned = ext.replace(/^\.+/, '').toLowerCase().trim()
  return cleaned ? `.${cleaned}` : '.bin'
}

/**
 * Generates a production filename according to the naming convention:
 *
 * QUEUE_[EXPRESS]_[PICKUP]_[SAMPLE]_CUSTOMER-NAME_ORDER-NO_LENGTH[-FILE-SEQUENCE].EXT
 *
 * Conditional segments are only included when applicable.
 * No double underscores, no empty placeholders.
 */
export function generateProductionFilename(params: FilenameParams): string {
  const parts: string[] = []

  // 1. Queue number — zero-padded to 3 digits (omit if null)
  if (params.queueNumber != null) {
    parts.push(String(params.queueNumber).padStart(3, '0'))
  }

  // 2. Shipping tag (EXPRESS or PICKUP, if applicable)
  const shipTag = shippingFilenameTag(params.shippingMethod)
  if (shipTag) {
    parts.push(shipTag)
  }

  // 3. SAMPLE (if enabled)
  if (params.includeSample) {
    parts.push('SAMPLE')
  }

  // 4. Customer name
  parts.push(sanitizeCustomerName(params.customerName))

  // 5. Order number (without #)
  parts.push(sanitizeOrderNumber(params.orderNumber))

  // 6. Type-specific suffix
  if (params.fileType === 'design') {
    // Length + optional sequence
    const lengthStr = `${params.designLengthInches || 0}IN`
    const totalFiles = params.totalDesignFiles || 1
    if (totalFiles > 1 && params.fileSequence) {
      parts.push(`${lengthStr}-${String(params.fileSequence).padStart(2, '0')}`)
    } else {
      parts.push(lengthStr)
    }
  } else if (params.fileType === 'shipping_label') {
    parts.push('LABEL')
  } else {
    // 'other' — just use the original filename concept
    parts.push('OTHER')
  }

  // 7. Join with underscores and add extension
  const ext = normalizeExtension(params.originalExtension)
  return parts.join('_') + ext
}

/**
 * Extracts the file extension from a filename.
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  if (lastDot === -1 || lastDot === filename.length - 1) return ''
  return filename.substring(lastDot)
}
