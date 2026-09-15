// src/lib/production/shipping.ts
// Single source of truth for shipping classification.
// Used by BOTH the table Shipping column and the filename generator.

export type ShippingClassification = 'EXPRESS' | 'PICKUP' | 'STANDARD' | 'RUSH' | 'NEXTDAY' | 'SATURDAY' | null

/**
 * Classifies a Shopify shipping method string into a normalized category.
 * Returns the specific type (PICKUP, STANDARD, RUSH, NEXTDAY, SATURDAY)
 * or null if unrecognized.
 */
export function classifyShipping(shippingMethod: string | null): ShippingClassification {
  if (!shippingMethod) return null
  const upper = shippingMethod.toUpperCase()

  if (upper.includes('PICKUP') || upper.includes('SHOP')) return 'PICKUP'
  if (upper.includes('NEXT')) return 'NEXTDAY'
  if (upper.includes('RUSH')) return 'RUSH'
  if (upper.includes('SATURDAY')) return 'SATURDAY'
  if (upper.includes('STANDARD')) return 'STANDARD'

  return null
}

/**
 * Returns the filename tag for the shipping method.
 * RUSH, NEXTDAY, SATURDAY → EXPRESS
 * PICKUP → PICKUP
 * Everything else → null (omitted from filename)
 */
export function shippingFilenameTag(shippingMethod: string | null): 'EXPRESS' | 'PICKUP' | null {
  const classification = classifyShipping(shippingMethod)
  if (!classification) return null

  switch (classification) {
    case 'PICKUP':
      return 'PICKUP'
    case 'RUSH':
    case 'NEXTDAY':
    case 'SATURDAY':
      return 'EXPRESS'
    default:
      return null
  }
}

/**
 * Returns whether the order is a pickup order.
 */
export function isPickupOrder(shippingMethod: string | null): boolean {
  return classifyShipping(shippingMethod) === 'PICKUP'
}

/**
 * Returns whether the order is an express (expedited) order.
 */
export function isExpressOrder(shippingMethod: string | null): boolean {
  const c = classifyShipping(shippingMethod)
  return c === 'RUSH' || c === 'NEXTDAY' || c === 'SATURDAY'
}

/**
 * Get display style info for the Shipping column badge.
 * Returns label, icon key, and color classes.
 */
export interface ShippingStyle {
  label: string
  iconKey: 'package' | 'truck'
  bg: string
  text: string
  border: string
  dot: string
}

export function getShippingStyle(shippingMethod: string | null): ShippingStyle | null {
  const classification = classifyShipping(shippingMethod)
  if (!classification) return null

  const styles: Record<string, ShippingStyle> = {
    PICKUP: {
      label: 'Pickup',
      iconKey: 'package',
      bg: 'bg-slate-500/10',
      text: 'text-slate-400',
      border: 'border-slate-500/20',
      dot: 'bg-slate-400',
    },
    STANDARD: {
      label: 'Standard',
      iconKey: 'truck',
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
      dot: 'bg-sky-400',
    },
    RUSH: {
      label: 'Rush',
      iconKey: 'truck',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      dot: 'bg-amber-400',
    },
    NEXTDAY: {
      label: 'Next-Day',
      iconKey: 'truck',
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      dot: 'bg-rose-400',
    },
    SATURDAY: {
      label: 'Saturday',
      iconKey: 'truck',
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'border-violet-500/20',
      dot: 'bg-violet-400',
    },
  }

  return styles[classification] || null
}
