async function test() {
  const res = await fetch('http://localhost:3000/api/production-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: 'gid://shopify/Order/12345' })
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
}

test();
