export const ORDERS_QUERY = `
  query FetchOrders($first: Int!, $after: String, $query: String) {
    orders(first: $first, after: $after, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        cursor
        node {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          customer {
            id
            firstName
            lastName
            email
            phone
          }
          shippingAddress {
            address1
            address2
            city
            province
            country
            zip
            phone
          }
          shippingLines(first: 5) {
            edges {
              node {
                title
              }
            }
          }
          totalPriceSet { shopMoney { amount currencyCode } }
          subtotalPriceSet { shopMoney { amount currencyCode } }
          totalTaxSet { shopMoney { amount currencyCode } }
          totalDiscountsSet { shopMoney { amount currencyCode } }
          note
          tags
          lineItems(first: 50) {
            edges {
              node {
                id
                title
                variantTitle
                quantity
                sku
                originalUnitPriceSet { shopMoney { amount currencyCode } }
                discountedUnitPriceSet { shopMoney { amount currencyCode } }
                totalDiscountSet { shopMoney { amount currencyCode } }
                taxLines {
                  title
                  rate
                  priceSet { shopMoney { amount currencyCode } }
                }
                customAttributes { key value }
                image { url altText }
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`
