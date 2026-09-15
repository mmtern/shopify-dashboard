import { fetchOrders } from "../src/lib/shopify/orders";

async function run() {
  try {
    const result = await fetchOrders({ first: 100, query: "fulfillment_status:unfulfilled" });
    const orders = result.orders;
    console.log(`Fetched ${orders.length} unfulfilled orders.`);
    
    // Let's count how many have 'sample' in tags
    const sampleTags = orders.filter(o => o.tags.some(t => t.toLowerCase().includes('sample')));
    console.log(`Orders with 'sample' in tags: ${sampleTags.length}`);
    
    // Let's count how many have 'sample' in line items
    const sampleItems = orders.filter(o => o.line_items.some(i => i.title.toLowerCase().includes('sample') || i.variant_title?.toLowerCase().includes('sample')));
    console.log(`Orders with 'sample' in line items: ${sampleItems.length}`);
    
    // Let's print some tags from orders that might be samples
    const allTags = new Set();
    orders.forEach(o => o.tags.forEach(t => allTags.add(t)));
    console.log("All tags among unfulfilled orders:", Array.from(allTags).join(", "));
  } catch (e) {
    console.error(e);
  }
}
run();
