import type {
  Staff,
  OrderWithDetails,
  LineItem,
  ProductionStatus,
  ShippingAddress,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

const STAFF: Staff[] = [
  {
    id: 'staff-001',
    username: 'admin_alex',
    display_name: 'Alex Rivera',
    role: 'admin',
    created_at: '2025-01-10T08:00:00Z',
  },
  {
    id: 'staff-002',
    username: 'printer_jordan',
    display_name: 'Jordan Lee',
    role: 'staff',
    created_at: '2025-02-15T09:30:00Z',
  },
  {
    id: 'staff-003',
    username: 'qc_sam',
    display_name: 'Sam Patel',
    role: 'staff',
    created_at: '2025-03-01T10:00:00Z',
  },
];

export function getMockStaff(): Staff[] {
  return STAFF;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeId(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(4, '0')}`;
}

function makeProductionStatus(
  orderId: string,
  overrides: Partial<ProductionStatus> = {},
): ProductionStatus {
  const now = new Date().toISOString();
  return {
    id: `ps-${orderId}`,
    order_id: orderId,
    stage: 'new_order',
    stage_updated_at: now,
    assigned_staff_id: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

function makeLineItem(
  orderId: string,
  index: number,
  data: {
    title: string;
    variant?: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    imageSlug?: string;
    hasTransparency?: boolean;
    actualHeight?: string;
  },
): LineItem {
  const id = `li-${orderId}-${index}`;
  const discount = data.discount ?? 0;
  return {
    id,
    order_id: orderId,
    title: data.title,
    variant_title: data.variant ?? null,
    sku: data.sku ?? null,
    quantity: data.quantity,
    unit_price: data.unitPrice,
    discounted_price: data.unitPrice - discount,
    total_discount: discount * data.quantity,
    tax_lines: [{ title: 'Tax', rate: 0.08, amount: +(data.unitPrice * data.quantity * 0.08).toFixed(2) }],
    custom_attributes: [
      { key: 'Preview', value: `https://cdn.example.com/previews/${data.imageSlug ?? id}.jpg` },
      { key: 'Edit', value: `https://app.example.com/editor/${data.imageSlug ?? id}` },
      { key: '_Admin Edit', value: `https://admin.example.com/editor/${data.imageSlug ?? id}` },
      { key: '_Print Ready File', value: `https://cdn.example.com/print-files/${data.imageSlug ?? id}.pdf` },
      { key: 'upload', value: `https://cdn.example.com/uploads/${data.imageSlug ?? id}-original.png` },
      { key: 'thumbnail', value: `https://cdn.example.com/thumbs/${data.imageSlug ?? id}-thumb.jpg` },
      { key: '_Has Transparency', value: data.hasTransparency ? 'true' : 'false' },
      { key: '_Actual Height', value: data.actualHeight ?? '24' },
    ],
    image_url: `https://cdn.example.com/thumbs/${data.imageSlug ?? id}-thumb.jpg`,
    synced_at: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Address presets
// ---------------------------------------------------------------------------

const ADDRESSES: ShippingAddress[] = [
  { address1: '123 Main St', address2: 'Apt 4B', city: 'New York', province: 'NY', country: 'US', zip: '10001', phone: '+1-212-555-0101' },
  { address1: '456 Oak Ave', address2: null, city: 'Los Angeles', province: 'CA', country: 'US', zip: '90012', phone: '+1-323-555-0202' },
  { address1: '789 Pine Rd', address2: 'Suite 200', city: 'Chicago', province: 'IL', country: 'US', zip: '60601', phone: '+1-312-555-0303' },
  { address1: '321 Elm Blvd', address2: null, city: 'Houston', province: 'TX', country: 'US', zip: '77001', phone: '+1-713-555-0404' },
  { address1: '654 Maple Dr', address2: 'Unit 12', city: 'Phoenix', province: 'AZ', country: 'US', zip: '85001', phone: '+1-602-555-0505' },
  { address1: '987 Cedar Ln', address2: null, city: 'Philadelphia', province: 'PA', country: 'US', zip: '19101', phone: '+1-215-555-0606' },
  { address1: '147 Birch Way', address2: 'Floor 3', city: 'San Antonio', province: 'TX', country: 'US', zip: '78201', phone: '+1-210-555-0707' },
  { address1: '258 Walnut St', address2: null, city: 'San Diego', province: 'CA', country: 'US', zip: '92101', phone: '+1-619-555-0808' },
  { address1: '369 Spruce Ct', address2: null, city: 'Dallas', province: 'TX', country: 'US', zip: '75201', phone: '+1-214-555-0909' },
  { address1: '480 Willow Pl', address2: 'Apt 7', city: 'Seattle', province: 'WA', country: 'US', zip: '98101', phone: '+1-206-555-1010' },
];

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export function getMockOrders(): OrderWithDetails[] {
  const now = new Date();

  const orders: OrderWithDetails[] = [
    // ── Order #1001 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 1),
      order_number: '#1001',
      created_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
      customer_name: 'Emily Thompson',
      customer_email: 'emily.thompson@email.com',
      customer_phone: '+1-212-555-0101',
      financial_status: 'PAID',
      fulfillment_status: 'UNFULFILLED',
      shipping_method: 'Standard Shipping',
      subtotal: 149.99,
      total_tax: 12.0,
      total_discounts: 0,
      total_price: 161.99,
      currency: 'USD',
      note: 'Please handle with care — this is a gift.',
      tags: ['gift', 'rush'],
      shipping_address: ADDRESSES[0],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 1), 1, {
          title: 'Custom Canvas Print 24x36',
          variant: '24×36 / Matte',
          sku: 'CNV-2436-MAT',
          quantity: 1,
          unitPrice: 89.99,
          imageSlug: 'canvas-sunset-2436',
          hasTransparency: false,
          actualHeight: '36',
        }),
        makeLineItem(makeId('ord', 1), 2, {
          title: 'Metal Photo Print 8x10',
          variant: '8×10 / Gloss',
          sku: 'MTL-0810-GLS',
          quantity: 2,
          unitPrice: 29.99,
          imageSlug: 'metal-family-0810',
          hasTransparency: false,
          actualHeight: '10',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 1)),
      internal_notes: [],
      status_history: [],
    },

    // ── Order #1002 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 2),
      order_number: '#1002',
      created_at: new Date(now.getTime() - 1.5 * 86400000).toISOString(),
      customer_name: 'Marcus Chen',
      customer_email: 'marcus.chen@email.com',
      customer_phone: '+1-323-555-0202',
      financial_status: 'PAID',
      fulfillment_status: 'UNFULFILLED',
      shipping_method: 'Express Shipping',
      subtotal: 219.99,
      total_tax: 17.6,
      total_discounts: 10.0,
      total_price: 227.59,
      currency: 'USD',
      note: null,
      tags: ['rush'],
      shipping_address: ADDRESSES[1],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 2), 1, {
          title: 'Acrylic Print 12x12',
          variant: '12×12 / Standard',
          sku: 'ACR-1212-STD',
          quantity: 1,
          unitPrice: 119.99,
          discount: 10.0,
          imageSlug: 'acrylic-abstract-1212',
          hasTransparency: true,
          actualHeight: '12',
        }),
        makeLineItem(makeId('ord', 2), 2, {
          title: 'Canvas Print 16x20',
          variant: '16×20 / Glossy',
          sku: 'CNV-1620-GLS',
          quantity: 1,
          unitPrice: 99.99,
          imageSlug: 'canvas-landscape-1620',
          hasTransparency: false,
          actualHeight: '20',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 2)),
      internal_notes: [],
      status_history: [],
    },

    // ── Order #1003 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 3),
      order_number: '#1003',
      created_at: new Date(now.getTime() - 1 * 86400000).toISOString(),
      customer_name: 'Sarah Mitchell',
      customer_email: 'sarah.m@email.com',
      customer_phone: '+1-312-555-0303',
      financial_status: 'PAID',
      fulfillment_status: 'UNFULFILLED',
      shipping_method: 'Standard Shipping',
      subtotal: 64.99,
      total_tax: 5.2,
      total_discounts: 0,
      total_price: 70.19,
      currency: 'USD',
      note: 'Second floor, ring buzzer 200.',
      tags: [],
      shipping_address: ADDRESSES[2],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 3), 1, {
          title: 'Photo Poster 18x24',
          variant: '18×24 / Semi-Gloss',
          sku: 'PST-1824-SGL',
          quantity: 1,
          unitPrice: 34.99,
          imageSlug: 'poster-pet-1824',
          hasTransparency: false,
          actualHeight: '24',
        }),
        makeLineItem(makeId('ord', 3), 2, {
          title: 'Mini Canvas 5x7',
          variant: '5×7 / Matte',
          sku: 'CNV-0507-MAT',
          quantity: 1,
          unitPrice: 29.99,
          imageSlug: 'canvas-portrait-0507',
          hasTransparency: false,
          actualHeight: '7',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 3)),
      internal_notes: [],
      status_history: [],
    },

    // ── Order #1004 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 4),
      order_number: '#1004',
      created_at: new Date(now.getTime() - 0.8 * 86400000).toISOString(),
      customer_name: 'David Kowalski',
      customer_email: 'dkowalski@email.com',
      customer_phone: '+1-713-555-0404',
      financial_status: 'PARTIALLY_PAID',
      fulfillment_status: 'UNFULFILLED',
      shipping_method: 'Local Pickup',
      subtotal: 349.99,
      total_tax: 28.0,
      total_discounts: 25.0,
      total_price: 352.99,
      currency: 'USD',
      note: 'Will pick up after 5 PM on Friday.',
      tags: ['local', 'vip'],
      shipping_address: ADDRESSES[3],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 4), 1, {
          title: 'Large Format Canvas 36x48',
          variant: '36×48 / Gallery Wrap',
          sku: 'CNV-3648-GAL',
          quantity: 1,
          unitPrice: 249.99,
          discount: 25.0,
          imageSlug: 'canvas-cityscape-3648',
          hasTransparency: false,
          actualHeight: '48',
        }),
        makeLineItem(makeId('ord', 4), 2, {
          title: 'Metal Photo Print 16x20',
          variant: '16×20 / Brushed',
          sku: 'MTL-1620-BRS',
          quantity: 1,
          unitPrice: 99.99,
          imageSlug: 'metal-nature-1620',
          hasTransparency: false,
          actualHeight: '20',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 4)),
      internal_notes: [],
      status_history: [],
    },

    // ── Order #1005 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 5),
      order_number: '#1005',
      created_at: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
      customer_name: 'Lisa Nakamura',
      customer_email: 'lisa.nakamura@email.com',
      customer_phone: '+1-602-555-0505',
      financial_status: 'PAID',
      fulfillment_status: 'PARTIALLY_FULFILLED',
      shipping_method: 'Express Shipping',
      subtotal: 179.97,
      total_tax: 14.4,
      total_discounts: 0,
      total_price: 194.37,
      currency: 'USD',
      note: null,
      tags: ['repeat-customer'],
      shipping_address: ADDRESSES[4],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 5), 1, {
          title: 'Acrylic Print 16x20',
          variant: '16×20 / HD Clear',
          sku: 'ACR-1620-HDC',
          quantity: 1,
          unitPrice: 139.99,
          imageSlug: 'acrylic-ocean-1620',
          hasTransparency: true,
          actualHeight: '20',
        }),
        makeLineItem(makeId('ord', 5), 2, {
          title: 'Photo Print 4x6',
          variant: '4×6 / Lustre',
          sku: 'PHT-0406-LUS',
          quantity: 3,
          unitPrice: 12.99,
          imageSlug: 'photo-wedding-0406',
          hasTransparency: false,
          actualHeight: '6',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 5)),
      internal_notes: [],
      status_history: [],
    },

    // ── Order #1006 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 6),
      order_number: '#1006',
      created_at: new Date(now.getTime() - 0.3 * 86400000).toISOString(),
      customer_name: 'Robert Garcia',
      customer_email: 'rgarcia@email.com',
      customer_phone: '+1-215-555-0606',
      financial_status: 'REFUNDED',
      fulfillment_status: 'UNFULFILLED',
      shipping_method: 'Standard Shipping',
      subtotal: 44.99,
      total_tax: 3.6,
      total_discounts: 0,
      total_price: 48.59,
      currency: 'USD',
      note: 'Customer requested refund — wrong image uploaded.',
      tags: ['refund'],
      shipping_address: ADDRESSES[5],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 6), 1, {
          title: 'Canvas Print 11x14',
          variant: '11×14 / Matte',
          sku: 'CNV-1114-MAT',
          quantity: 1,
          unitPrice: 44.99,
          imageSlug: 'canvas-wrong-1114',
          hasTransparency: false,
          actualHeight: '14',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 6), {
        stage: 'new_order',
        stage_updated_at: new Date(now.getTime() - 0.2 * 86400000).toISOString(),
      }),
      internal_notes: [],
      status_history: [],
    },

    // ── Order #1007 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 7),
      order_number: '#1007',
      created_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
      customer_name: 'Angela Williams',
      customer_email: 'awilliams@email.com',
      customer_phone: '+1-210-555-0707',
      financial_status: 'PAID',
      fulfillment_status: 'FULFILLED',
      shipping_method: 'Standard Shipping',
      subtotal: 199.98,
      total_tax: 16.0,
      total_discounts: 15.0,
      total_price: 200.98,
      currency: 'USD',
      note: null,
      tags: ['wholesale'],
      shipping_address: ADDRESSES[6],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 7), 1, {
          title: 'Metal Photo Print 24x36',
          variant: '24×36 / High Gloss',
          sku: 'MTL-2436-HGL',
          quantity: 1,
          unitPrice: 149.99,
          discount: 15.0,
          imageSlug: 'metal-skyline-2436',
          hasTransparency: false,
          actualHeight: '36',
        }),
        makeLineItem(makeId('ord', 7), 2, {
          title: 'Photo Print 8x10',
          variant: '8×10 / Glossy',
          sku: 'PHT-0810-GLS',
          quantity: 2,
          unitPrice: 24.99,
          imageSlug: 'photo-grad-0810',
          hasTransparency: false,
          actualHeight: '10',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 7), {
        stage: 'shipped',
        stage_updated_at: new Date(now.getTime() - 0.5 * 86400000).toISOString(),
        assigned_staff_id: 'staff-002',
      }),
      internal_notes: [],
      status_history: [],
    },

    // ── Order #1008 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 8),
      order_number: '#1008',
      created_at: new Date(now.getTime() - 0.1 * 86400000).toISOString(),
      customer_name: 'James O\'Brien',
      customer_email: 'jobrien@email.com',
      customer_phone: '+1-619-555-0808',
      financial_status: 'PAID',
      fulfillment_status: 'UNFULFILLED',
      shipping_method: 'Express Shipping',
      subtotal: 399.97,
      total_tax: 32.0,
      total_discounts: 0,
      total_price: 431.97,
      currency: 'USD',
      note: 'Urgent — needed for gallery opening on Saturday.',
      tags: ['rush', 'gallery'],
      shipping_address: ADDRESSES[7],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 8), 1, {
          title: 'Acrylic Print 24x36',
          variant: '24×36 / Face Mount',
          sku: 'ACR-2436-FM',
          quantity: 1,
          unitPrice: 199.99,
          imageSlug: 'acrylic-gallery-2436',
          hasTransparency: true,
          actualHeight: '36',
        }),
        makeLineItem(makeId('ord', 8), 2, {
          title: 'Acrylic Print 12x16',
          variant: '12×16 / Face Mount',
          sku: 'ACR-1216-FM',
          quantity: 1,
          unitPrice: 129.99,
          imageSlug: 'acrylic-gallery-1216',
          hasTransparency: true,
          actualHeight: '16',
        }),
        makeLineItem(makeId('ord', 8), 3, {
          title: 'Photo Print 5x7',
          variant: '5×7 / Metallic',
          sku: 'PHT-0507-MET',
          quantity: 5,
          unitPrice: 13.99,
          imageSlug: 'photo-gallery-0507',
          hasTransparency: false,
          actualHeight: '7',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 8)),
      internal_notes: [],
      status_history: [],
    },

    // ── Order #1009 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 9),
      order_number: '#1009',
      created_at: new Date(now.getTime() - 4 * 86400000).toISOString(),
      customer_name: 'Priya Sharma',
      customer_email: 'priya.sharma@email.com',
      customer_phone: '+1-214-555-0909',
      financial_status: 'PAID',
      fulfillment_status: 'UNFULFILLED',
      shipping_method: 'Standard Shipping',
      subtotal: 74.99,
      total_tax: 6.0,
      total_discounts: 5.0,
      total_price: 75.99,
      currency: 'USD',
      note: null,
      tags: ['coupon'],
      shipping_address: ADDRESSES[8],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 9), 1, {
          title: 'Canvas Print 12x16',
          variant: '12×16 / Glossy',
          sku: 'CNV-1216-GLS',
          quantity: 1,
          unitPrice: 74.99,
          discount: 5.0,
          imageSlug: 'canvas-flowers-1216',
          hasTransparency: false,
          actualHeight: '16',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 9), {
        stage: 'printing',
        stage_updated_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
        assigned_staff_id: 'staff-003',
      }),
      internal_notes: [],
      status_history: [],
    },

    // ── Order #1010 ──────────────────────────────────────────────────────
    {
      id: makeId('ord', 10),
      order_number: '#1010',
      created_at: new Date(now.getTime() - 0.05 * 86400000).toISOString(),
      customer_name: 'Olivia Fernandez',
      customer_email: 'olivia.f@email.com',
      customer_phone: '+1-206-555-1010',
      financial_status: 'PAID',
      fulfillment_status: 'UNFULFILLED',
      shipping_method: 'Local Pickup',
      subtotal: 59.99,
      total_tax: 4.8,
      total_discounts: 0,
      total_price: 64.79,
      currency: 'USD',
      note: 'Call before pickup — flexible schedule.',
      tags: ['local'],
      shipping_address: ADDRESSES[9],
      synced_at: now.toISOString(),
      line_items: [
        makeLineItem(makeId('ord', 10), 1, {
          title: 'Metal Photo Print 8x8',
          variant: '8×8 / Satin',
          sku: 'MTL-0808-SAT',
          quantity: 1,
          unitPrice: 59.99,
          imageSlug: 'metal-pet-0808',
          hasTransparency: false,
          actualHeight: '8',
        }),
      ],
      production_status: makeProductionStatus(makeId('ord', 10)),
      internal_notes: [],
      status_history: [],
    },
  ];

  return orders;
}
