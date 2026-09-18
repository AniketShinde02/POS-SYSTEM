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

  console.log("=== Phase 4 & 5 Verification ===");

  // 1. Create Category
  console.log("1. Creating Category...");
  const catRes = await fetch("http://localhost:3000/api/categories", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Grocery Staples",
      slug: "grocery-staples",
      description: "Daily food essentials",
    }),
  });
  const catJson = await catRes.json();
  console.log("Category created:", catJson.success, catJson.data?._id, catJson.data?.name);
  const catId = catJson.data?._id;

  // 2. Create Product
  console.log("2. Creating Product...");
  const prodRes = await fetch("http://localhost:3000/api/products", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Aashirvaad Superior MP Atta 5kg",
      sku: "ATT-5KG",
      barcode: "8901030383824",
      description: "100% pure whole wheat flour",
      categoryId: catId,
      costPrice: 240,
      sellingPrice: 280,
      stock: 25,
      taxRate: 5,
      lowStockThreshold: 5,
      unit: "bag",
    }),
  });
  const prodJson = await prodRes.json();
  console.log("Product created:", prodJson.success, prodJson.data?._id, prodJson.data?.name, "Barcode:", prodJson.data?.barcode);
  const prodId = prodJson.data?._id;

  // 3. Barcode Lookup
  console.log("3. Looking up product by barcode 8901030383824...");
  const barcodeRes = await fetch("http://localhost:3000/api/products/barcode/8901030383824", { headers });
  const barcodeJson = await barcodeRes.json();
  console.log("Barcode lookup matched:", barcodeJson.success, barcodeJson.data?.name, "SKU:", barcodeJson.data?.sku);

  // 4. Search
  console.log("4. Searching products for 'Atta'...");
  const searchRes = await fetch("http://localhost:3000/api/products/search?q=Atta", { headers });
  const searchJson = await searchRes.json();
  console.log("Search results count:", searchJson.data?.length, "First match:", searchJson.data?.[0]?.name);

  // 5. Update Product
  console.log("5. Updating product price to 295...");
  const updateRes = await fetch(`http://localhost:3000/api/products/${prodId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ sellingPrice: 295 }),
  });
  const updateJson = await updateRes.json();
  console.log("Product updated:", updateJson.success, "New price:", updateJson.data?.sellingPrice);

  // 6. Paginate Products
  console.log("6. Listing all products...");
  const listRes = await fetch("http://localhost:3000/api/products?limit=10", { headers });
  const listJson = await listRes.json();
  console.log("Total products:", listJson.data?.total, "Items returned:", listJson.data?.items?.length);

  console.log("=== Phase 4 & 5 Verification COMPLETE ===");
}

test().catch(console.error);
