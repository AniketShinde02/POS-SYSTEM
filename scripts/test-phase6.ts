export {};

async function test() {
  const sessionData = {
    uid: "admin-test-01",
    email: "admin@retailpos.com",
    name: "Admin User",
    role: "admin",
    tenantId: "default",
  };
  const cookie = "firebase_session=dev_session_" + Buffer.from(JSON.stringify(sessionData)).toString("base64");
  const headers = {
    Cookie: cookie,
    "Content-Type": "application/json",
  };

  console.log("=== Phase 6 Inventory Verification ===");

  // 1. Get first product
  const listRes = await fetch("http://localhost:3000/api/products?limit=1", { headers });
  const listJson = await listRes.json();
  const product = listJson.data?.items?.[0];
  if (!product) throw new Error("No products available to test inventory!");

  const startStock = Number(product.stock);
  console.log("Initial stock for", product.name, ":", startStock);

  // 2. Adjust Stock (+15 items)
  console.log("Adding +15 items to stock...");
  const addRes = await fetch("http://localhost:3000/api/inventory/adjust", {
    method: "POST",
    headers,
    body: JSON.stringify({
      productId: product._id,
      quantity: 15,
      type: "adjustment",
      notes: "Stock replenishment shipment #A102",
    }),
  });
  const addJson = await addRes.json();
  console.log("Adjust (+15) success:", addJson.success, "New stock:", addJson.data?.stock);

  // 3. Verify stock reflected in product get
  const verifyRes = await fetch(`http://localhost:3000/api/products/${product._id}`, { headers });
  const verifyJson = await verifyRes.json();
  console.log("Verified stock in DB:", verifyJson.data?.stock);
  if (verifyJson.data?.stock !== startStock + 15) {
    throw new Error(`Stock mismatch! Expected ${startStock + 15}, got ${verifyJson.data?.stock}`);
  }

  // 4. Adjust Stock (-5 items damage)
  console.log("Deducting -5 items (damaged)...");
  const subRes = await fetch("http://localhost:3000/api/inventory/adjust", {
    method: "POST",
    headers,
    body: JSON.stringify({
      productId: product._id,
      quantity: -5,
      type: "damage",
      notes: "Damaged during handling",
    }),
  });
  const subJson = await subRes.json();
  console.log("Adjust (-5) success:", subJson.success, "New stock:", subJson.data?.stock);

  console.log("=== Phase 6 Inventory Verification COMPLETE ===");
}

test().catch(console.error);
