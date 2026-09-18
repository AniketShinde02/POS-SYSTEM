// Loaded via --env-file=.env.local
import { adminDb } from '../src/lib/firebase/admin';
import { ProductRepository } from '../src/repositories/product.repository';
import { SaleRepository } from '../src/repositories/sale.repository';
import { hasPermission } from '../src/lib/permissions';
import type { Permission } from '../src/types';

async function main() {
  console.log('----------------------------------------------------');
  console.log('EXECUTION: END-TO-END BACKEND & FIRESTORE TEST SUITE');
  console.log('----------------------------------------------------');

  const tenantId = 'default';

  // 1. Verify User / Profile resolution
  console.log('1. Testing User Profiles in tenants/default/users...');
  const usersSnap = await adminDb.collection('tenants').doc(tenantId).collection('users').get();
  if (usersSnap.empty) {
    throw new Error('No users found in tenants/default/users');
  }
  console.log(`   Found ${usersSnap.size} user profiles in Firestore.`);
  let adminUser: (Record<string, unknown> & { id: string; name?: string }) | null = null;
  let cashierUser: (Record<string, unknown> & { id: string; name?: string }) | null = null;
  usersSnap.forEach((doc) => {
    const data = doc.data();
    console.log(`   - UID: ${doc.id} | Email: ${data.email} | Role: ${data.role} | Name: ${data.name}`);
    if (data.role === 'admin') adminUser = { id: doc.id, ...data };
    if (data.role === 'cashier') cashierUser = { id: doc.id, ...data };
  });

  if (!adminUser) throw new Error('No admin user found!');
  if (!cashierUser) throw new Error('No cashier user found!');

  // 2. Permission enforcement test
  console.log('\n2. Testing Strict Role Permissions...');
  const adminPermissions: Permission[] = ['pos.access', 'products.manage', 'sales.manage', 'reports.view', 'settings.manage'];
  for (const perm of adminPermissions) {
    const allowed = hasPermission('admin', perm);
    if (!allowed) throw new Error(`Admin failed permission check for ${perm}`);
  }
  console.log('   Admin role passed all permission checks.');

  const cashierAllowedPos = hasPermission('cashier', 'pos.access');
  const cashierAllowedSettings = hasPermission('cashier', 'settings.manage');
  const cashierAllowedReports = hasPermission('cashier', 'reports.view');
  if (!cashierAllowedPos) throw new Error('Cashier should have pos.access');
  if (cashierAllowedSettings) throw new Error('Cashier must NOT have settings.manage');
  if (cashierAllowedReports) throw new Error('Cashier must NOT have reports.view');
  console.log('   Cashier role correctly restricted (has pos.access, blocked from settings & reports).');

  // 3. Test Products Repository against real Firestore
  console.log('\n3. Testing ProductRepository...');
  const prodRepo = new ProductRepository();
  const prodPage = await prodRepo.paginate({ limit: 10 }, tenantId);
  console.log(`   Fetched ${prodPage.items.length} products from live Firestore.`);
  if (prodPage.items.length === 0) throw new Error('ProductRepository returned 0 products');
  const testProduct = prodPage.items[0];
  console.log(`   Sample product: "${testProduct.name}" (ID: ${testProduct.id}, Stock: ${testProduct.stock}, Price: ${testProduct.sellingPrice})`);

  // 4. Test Low Stock Query against real Firestore
  console.log('\n4. Testing ProductRepository.lowStock()...');
  const lowStock = await prodRepo.lowStock(10, tenantId);
  console.log(`   Low stock items found in live Firestore: ${lowStock.length}`);

  // 5. Test Settings Document in real Firestore
  console.log('\n5. Testing Settings Document in live Firestore...');
  const settingsSnap = await adminDb.collection('tenants').doc(tenantId).collection('settings').doc('general').get();
  if (!settingsSnap.exists) {
    throw new Error('Settings document tenants/default/settings/general does not exist');
  }
  console.log('   Settings fetched successfully from live Firestore:', settingsSnap.data()?.storeName);

  // 6. Test Sales Repository (getRevenueStats, recent)
  console.log('\n6. Testing SaleRepository against live Firestore...');
  const saleRepo = new SaleRepository();
  const stats = await saleRepo.getRevenueStats(undefined, undefined, undefined, tenantId);
  console.log('   Revenue Stats from live Firestore:', stats);
  const recentSales = await saleRepo.recent(5, tenantId);
  console.log(`   Recent sales count in live Firestore: ${recentSales.length}`);

  // 7. Test POS Checkout Transaction & Inventory Decrement
  console.log('\n7. Testing POS Checkout & Stock Adjustment against live Firestore...');
  const initialStock = testProduct.stock;
  const quantityToBuy = 1;

  const saleRecord = await saleRepo.create({
    invoiceNumber: `INV-${Date.now()}`,
    items: [
      {
        productId: testProduct.id,
        name: testProduct.name,
        sku: testProduct.sku || 'SKU-TEST',
        quantity: quantityToBuy,
        price: testProduct.sellingPrice,
        discount: 0,
        tax: 0,
        subtotal: testProduct.sellingPrice * quantityToBuy,
      },
    ],
    subtotal: testProduct.sellingPrice * quantityToBuy,
    discount: 0,
    tax: 0,
    total: testProduct.sellingPrice * quantityToBuy,
    payments: [{ method: 'cash', amount: testProduct.sellingPrice * quantityToBuy }],
    cashierId: (cashierUser as { id: string; name?: string }).id,
    cashierName: (cashierUser as { id: string; name?: string }).name,
    customerName: 'Walk-in Customer',
    status: 'completed',
  }, tenantId);

  console.log(`   Sale created in live Firestore: ${saleRecord.id}, Invoice: ${saleRecord.invoiceNumber}`);

  // Adjust product stock
  await prodRepo.updateStock(testProduct.id, -quantityToBuy, tenantId);
  console.log(`   Inventory decremented by ${quantityToBuy}.`);

  // Verify stock persisted in Firestore
  const recheckProduct = await prodRepo.findById(testProduct.id, tenantId);
  console.log(`   Verified Firestore persisted stock: ${recheckProduct?.stock}`);
  if (recheckProduct?.stock !== initialStock - quantityToBuy) {
    throw new Error(`Stock mismatch: expected ${initialStock - quantityToBuy}, got ${recheckProduct?.stock}`);
  }

  // Verify updated revenue stats
  const updatedStats = await saleRepo.getRevenueStats(undefined, undefined, undefined, tenantId);
  console.log('   Updated Revenue Stats:', updatedStats);
  if (updatedStats.totalSales === 0) {
    throw new Error('Total sales count should be > 0 after checkout');
  }

  // 8. Test Employee Creation in Firestore
  console.log('\n8. Testing Employee Provisioning in live Firestore...');
  const testEmpUid = `emp-test-${Date.now()}`;
  const empRef = adminDb.collection('tenants').doc(tenantId).collection('users').doc(testEmpUid);
  await empRef.set({
    uid: testEmpUid,
    name: 'Test Cashier User',
    email: `cashier-test-${Date.now()}@pos.local`,
    role: 'cashier',
    tenantId,
    status: 'active',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const readEmp = await empRef.get();
  if (!readEmp.exists) throw new Error('Created employee does not exist in Firestore');
  console.log(`   Provisioned Employee Profile: ${readEmp.data()?.name} [${readEmp.data()?.role}] at ${empRef.path}`);

  // Clean up test employee
  await empRef.delete();
  console.log('   Cleaned up test employee profile.');

  console.log('\n====================================================');
  console.log('ALL BACKEND & FIRESTORE INTEGRATION TESTS PASSED!');
  console.log('====================================================');
}

main().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
