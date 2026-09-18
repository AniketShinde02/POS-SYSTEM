import { adminDb, adminAuth } from '../src/lib/firebase/admin';

async function seedCashier() {
  const tenantId = 'default';
  const email = 'cashier@pos.local';
  const password = 'Cashier@123';
  
  let uid: string;
  try {
    const existing = await adminAuth.getUserByEmail(email);
    uid = existing.uid;
    console.log('✅ Cashier Auth user exists:', uid);
  } catch {
    const created = await adminAuth.createUser({ email, password, displayName: 'Cashier Demo' });
    uid = created.uid;
    console.log('✅ Created cashier Auth user:', uid);
  }

  await adminAuth.setCustomUserClaims(uid, { role: 'cashier', tenantId });

  await adminDb.collection('tenants').doc(tenantId).collection('users').doc(uid).set({
    uid,
    name: 'Cashier Demo',
    email,
    role: 'cashier',
    tenantId,
    status: 'active',
    isActive: true,
    employeeId: 'EMP-0002',
    permissions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  console.log(`✅ Firestore profile: tenants/${tenantId}/users/${uid}`);
  console.log('✅ DONE — cashier@pos.local / Cashier@123');
}

seedCashier().then(() => process.exit(0)).catch((e) => { console.error('❌', e); process.exit(1); });
