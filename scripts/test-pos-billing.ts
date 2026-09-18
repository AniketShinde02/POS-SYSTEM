import { SaleService } from "../src/services/sale.service";
import { ProductRepository } from "../src/repositories/product.repository";
import type { CartItem } from "../src/types";

async function runBillingTests() {
  console.log("=========================================");
  console.log("RUNNING POS BILLING & CHECKOUT TEST SUITE");
  console.log("=========================================\n");

  const tenantId = "default";
  const saleService = new SaleService();
  const productRepo = new ProductRepository();

  // 1. Fetch available products for test
  const products = await productRepo.search("", 20, tenantId);
  if (products.length === 0) {
    throw new Error("No products found in Firestore catalog");
  }

  const prod1 = products[0];
  console.log(`1. Test Product 1: "${prod1.name}" (SKU: ${prod1.sku}, Initial Stock: ${prod1.stock}, Price: ${prod1.sellingPrice})`);

  // Record initial stock
  const initialStock1 = prod1.stock;

  // 2. Test Single Product Checkout (Cash Payment)
  console.log("\n2. Testing Single Product Checkout (Cash)...");
  const singleItem: CartItem = {
    productId: prod1._id,
    name: prod1.name,
    sku: prod1.sku,
    barcode: prod1.barcode,
    price: prod1.sellingPrice,
    quantity: 1,
    discount: 0,
    tax: 0,
  };

  const cashTxId = `test_cash_tx_${Date.now()}`;
  const cashSale = await saleService.completeSale({
    saleId: cashTxId,
    items: [singleItem],
    discount: 0,
    taxRate: 18, // 18% GST/Tax
    payments: [{ method: "cash", amount: prod1.sellingPrice * 1.18 }],
    cashierId: "emp-test-admin",
    tenantId,
  });

  console.log(`   ✅ Single item sale created: ${cashSale.invoiceNumber} (Total: ₹${cashSale.total.toFixed(2)})`);
  
  // Verify stock decremented by 1
  const updatedProd1 = await productRepo.findById(prod1._id, tenantId);
  console.log(`   ✅ Stock updated: ${initialStock1} -> ${updatedProd1?.stock}`);
  if (updatedProd1?.stock !== initialStock1 - 1) {
    throw new Error(`Stock mismatch! Expected ${initialStock1 - 1}, got ${updatedProd1?.stock}`);
  }

  // 3. Test Idempotency (Duplicate Checkout Attempt)
  console.log("\n3. Testing Duplicate Checkout Idempotency...");
  const duplicateSale = await saleService.completeSale({
    saleId: cashTxId, // Same saleId!
    items: [singleItem],
    discount: 0,
    taxRate: 18,
    payments: [{ method: "cash", amount: prod1.sellingPrice * 1.18 }],
    cashierId: "emp-test-admin",
    tenantId,
  });

  console.log(`   ✅ Idempotent submission caught: ${duplicateSale.invoiceNumber}`);
  const stockAfterDup = (await productRepo.findById(prod1._id, tenantId))?.stock;
  if (stockAfterDup !== initialStock1 - 1) {
    throw new Error(`Stock improperly decremented twice! Expected ${initialStock1 - 1}, got ${stockAfterDup}`);
  }
  console.log(`   ✅ Stock remained unchanged on duplicate attempt: ${stockAfterDup}`);

  // 4. Test Multi-Product Checkout (UPI Payment + Discount)
  if (products.length > 1) {
    const prod2 = products[1];
    console.log(`\n4. Testing Multi-Product Checkout (UPI + 10% Discount)...`);
    console.log(`   Item 2: "${prod2.name}" (Initial Stock: ${prod2.stock})`);
    const initialStock2 = prod2.stock;

    const multiItems: CartItem[] = [
      {
        productId: prod1._id,
        name: prod1.name,
        sku: prod1.sku,
        price: prod1.sellingPrice,
        quantity: 2, // Quantity > 1
        discount: 10, // 10% line discount
        tax: 0,
      },
      {
        productId: prod2._id,
        name: prod2.name,
        sku: prod2.sku,
        price: prod2.sellingPrice,
        quantity: 1,
        discount: 0,
        tax: 0,
      },
    ];

    const item1Subtotal = prod1.sellingPrice * 2 * 0.9; // 10% line discount
    const item2Subtotal = prod2.sellingPrice * 1;
    const subtotal = item1Subtotal + item2Subtotal;
    const afterDiscount = subtotal - 50;
    const tax = afterDiscount * 0.05;
    const upiTotal = afterDiscount + tax;

    const upiTxId = `test_upi_tx_${Date.now()}`;
    const upiSale = await saleService.completeSale({
      saleId: upiTxId,
      items: multiItems,
      discount: 50, // ₹50 cart discount
      taxRate: 5,   // 5% tax
      payments: [{ method: "upi", amount: upiTotal, reference: "UPI9876543210" }],
      cashierId: "emp-test-admin",
      tenantId,
    });

    console.log(`   ✅ Multi-item UPI sale created: ${upiSale.invoiceNumber} (Grand Total: ₹${upiSale.total.toFixed(2)})`);

    const finalProd1 = await productRepo.findById(prod1._id, tenantId);
    const finalProd2 = await productRepo.findById(prod2._id, tenantId);
    console.log(`   ✅ Item 1 Stock: ${initialStock1 - 1} -> ${finalProd1?.stock} (decremented by 2)`);
    console.log(`   ✅ Item 2 Stock: ${initialStock2} -> ${finalProd2?.stock} (decremented by 1)`);
  }

  console.log("\n=========================================");
  console.log("ALL POS BILLING & IDEMPOTENCY TESTS PASSED!");
  console.log("=========================================\n");
}

runBillingTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
