/**
 * Run: npm run seed
 * Seeds admin user, settings, categories, and sample products into Firebase Firestore.
 */
import fs from "fs";
import path from "path";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));

if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const db = getFirestore();
const auth = getAuth();
const tenantId = "default";

async function seed() {
  console.log(`[Seed] Initializing standalone Firebase POS for tenant: ${tenantId}...`);

  const tenantRef = db.collection("tenants").doc(tenantId);
  await tenantRef.set(
    {
      id: tenantId,
      name: "RetailPOS Store",
      currency: "INR",
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // 1. Seed Settings
  console.log("[Seed] Seeding settings...");
  await tenantRef.collection("settings").doc("general").set({
    storeName: "RetailPOS Flagship Store",
    storeAddress: "100 Commercial Blvd, Tech City",
    storePhone: "+91 98765 43210",
    storeEmail: "contact@retailpos.local",
    currency: "INR",
    currencySymbol: "₹",
    taxRate: 18,
    taxName: "GST",
    language: "en",
    invoicePrefix: "POS-2026",
    invoiceFooter: "Thank you for shopping with us! Have a wonderful day.",
    lowStockAlert: true,
    theme: "system",
    gstin: "27AAAAA0000A1Z5",
    upiId: "merchant@upi",
    updatedAt: new Date().toISOString(),
  });

  // 2. Seed Admin User
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@pos.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";

  console.log(`[Seed] Setting up admin account (${adminEmail})...`);
  let adminUid: string;
  try {
    const existing = await auth.getUserByEmail(adminEmail);
    adminUid = existing.uid;
    await auth.updateUser(adminUid, { password: adminPassword, displayName: "System Admin" });
    console.log(`[Seed] Updated existing Auth user: ${adminEmail}`);
  } catch {
    const created = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: "System Admin",
    });
    adminUid = created.uid;
    console.log(`[Seed] Created new Auth user: ${adminEmail}`);
  }

  await tenantRef.collection("users").doc(adminUid).set({
    uid: adminUid,
    name: "System Admin",
    email: adminEmail,
    role: "admin",
    tenantId,
    isActive: true,
    updatedAt: new Date().toISOString(),
  });

  // 3. Seed Cashier User
  const cashierEmail = "cashier@pos.local";
  const cashierPassword = "Cashier@123";
  console.log(`[Seed] Setting up cashier account (${cashierEmail})...`);
  let cashierUid: string;
  try {
    const existing = await auth.getUserByEmail(cashierEmail);
    cashierUid = existing.uid;
    await auth.updateUser(cashierUid, { password: cashierPassword, displayName: "Cashier Demo" });
  } catch {
    const created = await auth.createUser({
      email: cashierEmail,
      password: cashierPassword,
      displayName: "Cashier Demo",
    });
    cashierUid = created.uid;
  }

  await tenantRef.collection("users").doc(cashierUid).set({
    uid: cashierUid,
    name: "Cashier Demo",
    email: cashierEmail,
    role: "cashier",
    tenantId,
    isActive: true,
    updatedAt: new Date().toISOString(),
  });

  // 4. Seed Categories
  console.log("[Seed] Seeding product categories...");
  const categories = [
    { id: "cat-apparel", name: "Apparel & Fashion", slug: "apparel-fashion" },
    { id: "cat-footwear", name: "Footwear", slug: "footwear" },
    { id: "cat-accessories", name: "Accessories", slug: "accessories" },
  ];

  for (const cat of categories) {
    await tenantRef.collection("categories").doc(cat.id).set({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }

  // 5. Seed Products
  console.log("[Seed] Seeding sample products with barcodes...");
  const sampleProducts = [
    {
      id: "prod-cotton-tshirt",
      name: "Classic Cotton T-Shirt",
      slug: "classic-cotton-t-shirt",
      sku: "TSH-001",
      barcode: "8901234567890",
      categoryId: "cat-apparel",
      categoryName: "Apparel & Fashion",
      costPrice: 250,
      sellingPrice: 599,
      taxRate: 12,
      stock: 45,
      lowStockThreshold: 10,
      unit: "pcs",
      images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500"],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod-denim-jeans",
      name: "Slim Fit Denim Jeans",
      slug: "slim-fit-denim-jeans",
      sku: "JNS-002",
      barcode: "8901234567891",
      categoryId: "cat-apparel",
      categoryName: "Apparel & Fashion",
      costPrice: 700,
      sellingPrice: 1499,
      taxRate: 12,
      stock: 28,
      lowStockThreshold: 5,
      unit: "pcs",
      images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod-leather-wallet",
      name: "Genuine Leather Wallet",
      slug: "genuine-leather-wallet",
      sku: "WLT-003",
      barcode: "8901234567892",
      categoryId: "cat-accessories",
      categoryName: "Accessories",
      costPrice: 350,
      sellingPrice: 899,
      taxRate: 18,
      stock: 15,
      lowStockThreshold: 4,
      unit: "pcs",
      images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=500"],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod-running-sneakers",
      name: "Athletic Running Sneakers",
      slug: "athletic-running-sneakers",
      sku: "SNK-004",
      barcode: "8901234567893",
      categoryId: "cat-footwear",
      categoryName: "Footwear",
      costPrice: 1100,
      sellingPrice: 2499,
      taxRate: 18,
      stock: 8,
      lowStockThreshold: 5,
      unit: "pair",
      images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"],
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  for (const prod of sampleProducts) {
    await tenantRef.collection("products").doc(prod.id).set(prod);
  }

  // 6. Seed Sample Customer
  console.log("[Seed] Seeding sample customer...");
  await tenantRef.collection("customers").doc("cust-demo-1").set({
    id: "cust-demo-1",
    name: "John Doe",
    phone: "9876543210",
    email: "john.doe@example.com",
    address: "24 Park Avenue",
    totalPurchases: 2,
    totalSpent: 3098,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log("✅ [Seed] Successfully seeded RetailPOS Firestore database!");
  console.log(`   Admin Credentials: ${adminEmail} / ${adminPassword}`);
  console.log(`   Cashier Credentials: ${cashierEmail} / ${cashierPassword}`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ [Seed Error]:", err);
    process.exit(1);
  });
