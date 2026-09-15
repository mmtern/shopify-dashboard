import { fetchOrders } from "../src/lib/shopify/orders";

async function run() {
  let hasNextPage = true;
  let cursor = null;
  let count = 0;
  let found = false;

  const query = "financial_status:paid fulfillment_status:unfulfilled -tag:ready-for-pickup";

  while (hasNextPage) {
    const result = await fetchOrders({
      first: 50,
      after: cursor,
      query,
    });

    const orders = result.orders;
    count += orders.length;

    console.log(`Fetched ${orders.length} orders. Oldest in this batch: ${orders[orders.length - 1]?.created_at}`);

    const target = orders.find(o => o.order_number === "#53948");
    if (target) {
      console.log(`Found #53948 on page ${count / 50}!`);
      found = true;
      break;
    }

    hasNextPage = result.pageInfo.hasNextPage;
    cursor = result.pageInfo.endCursor;

    if (count > 1000) {
      console.log("Reached 1000 orders, stopping.");
      break;
    }
  }

  console.log(`Total checked: ${count}. Found: ${found}`);
}

run();
