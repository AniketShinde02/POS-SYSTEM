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

  console.log("=== Phase 7, 8, 9, 11 POS Checkout & Billing Verification ===");

  // 1. Get product details
  const prodListRes = await fetch("http://localhost:3000/api/products?limit=1", { headers });
  const prodListJson = await prodListRes.json();
  const product = prodListJson.data?.items?.[0];
  if (!product) throw new Error("No test product available");

  const initialStock = product.stock;
  console.log("Product:", product.name, "Price:", product.sellingPrice, "Stock:", initialStock);

  // 2. Perform POS Checkout with UPI
  const txId = `SALE-TEST-${Date.now()}`;
  const checkoutPayload = {
    transactionId: txId,
    items: [
      {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        price: product.sellingPrice,
        quantity: 2,
        discount: 0,
        tax: product.taxRate ?? 0,
      },
    ],
    discount: 0,
    taxRate: 0,
    payments: [
      {
        method: "upi",
        amount: product.sellingPrice * 2,
        reference: "UPI-UTR-991823746",
      },
    ],
  };

  console.log("1. Executing UPI checkout for 2 units...");
  const checkoutRes = await fetch("http://localhost:3000/api/sales/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify(checkoutPayload),
  });
  const checkoutJson = await checkoutRes.json();
  console.log("Checkout result:", checkoutJson.success, "Invoice:", checkoutJson.data?.invoiceNumber, "Total:", checkoutJson.data?.total);
  if (!checkoutJson.success) throw new Error("Checkout failed: " + checkoutJson.error);

  // 3. Verify stock decremented exactly once
  const verifyProdRes = await fetch(`http://localhost:3000/api/products/${product._id}`, { headers });
  const verifyProdJson = await verifyProdRes.json();
  const stockAfterSale = verifyProdJson.data?.stock;
  console.log("Stock after sale:", stockAfterSale, "(Expected:", initialStock - 2, ")");
  if (stockAfterSale !== initialStock - 2) {
    throw new Error(`Stock mismatch! Expected ${initialStock - 2}, got ${stockAfterSale}`);
  }

  // 4. Test Idempotency: Re-send same transactionId (simulating offline re-sync)
  console.log("2. Testing Idempotency (re-sending identical transaction ID)...");
  const retryRes = await fetch("http://localhost:3000/api/sales/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify(checkoutPayload),
  });
  const retryJson = await retryRes.json();
  console.log("Idempotent response invoice:", retryJson.data?.invoiceNumber);

  // Verify stock was NOT double-decremented
  const checkStockAgain = await fetch(`http://localhost:3000/api/products/${product._id}`, { headers });
  const checkStockAgainJson = await checkStockAgain.json();
  console.log("Stock after re-send:", checkStockAgainJson.data?.stock, "(Must remain:", stockAfterSale, ")");
  if (checkStockAgainJson.data?.stock !== stockAfterSale) {
    throw new Error("Double-decrement failure detected!");
  }

  // 5. Test Cash Checkout with Change
  console.log("3. Executing Cash checkout for 1 unit...");
  const cashTxId = `SALE-CASH-${Date.now()}`;
  const cashPayload = {
    transactionId: cashTxId,
    items: [
      {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        price: product.sellingPrice,
        quantity: 1,
        discount: 0,
        tax: 0,
      },
    ],
    discount: 0,
    taxRate: 0,
    payments: [
      {
        method: "cash",
        amount: product.sellingPrice,
        reference: "Cash: ₹500 (Change: ₹205)",
      },
    ],
  };

  const cashRes = await fetch("http://localhost:3000/api/sales/checkout", {
    method: "POST",
    headers,
    body: JSON.stringify(cashPayload),
  });
  const cashJson = await cashRes.json();
  console.log("Cash checkout:", cashJson.success, "Invoice:", cashJson.data?.invoiceNumber);

  // 6. Verify Sales List
  console.log("4. Fetching Sales History...");
  const salesListRes = await fetch("http://localhost:3000/api/sales", { headers });
  const salesListJson = await salesListRes.json();
  console.log("Total sales records:", salesListJson.data?.items?.length || salesListJson.data?.length);

  console.log("=== Phase 7, 8, 9, 11 Verification COMPLETE ===");
}

test().catch(console.error);
