import { shopifyGraphQL } from "../src/lib/shopify/client";

async function run() {
  const query = `
    query {
      orders(first: 10, query: "name:53948") {
        edges {
          node {
            id
            name
            createdAt
            displayFinancialStatus
            displayFulfillmentStatus
            tags
            lineItems(first: 5) {
              edges {
                node {
                  title
                }
              }
            }
          }
        }
      }
    }
  `;
  try {
    const res = await shopifyGraphQL(query, {});
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error(err);
  }
}

run();
