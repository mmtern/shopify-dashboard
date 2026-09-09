const SHOPIFY_STORE_URL = process.env.SHOPIFY_STORE_URL || ''
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN || ''
const API_VERSION = '2025-04'

interface ShopifyGraphQLResponse<T> {
  data: T
  errors?: Array<{ message: string }>
  extensions?: {
    cost: {
      requestedQueryCost: number
      actualQueryCost: number
      throttleStatus: {
        maximumAvailable: number
        currentlyAvailable: number
        restoreRate: number
      }
    }
  }
}

export async function shopifyGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<ShopifyGraphQLResponse<T>> {
  if (!SHOPIFY_STORE_URL || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials not configured. Using mock data.')
  }

  const response = await fetch(
    `https://${SHOPIFY_STORE_URL}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  )

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
