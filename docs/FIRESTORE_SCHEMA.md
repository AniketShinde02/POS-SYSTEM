# RetailPOS — Standalone Firestore Schema

This document outlines the tenant-isolated Firestore schema for RetailPOS. The data model enforces multi-tenancy, idempotency, offline synchronization, and role-based access control.

---

## 1. Hierarchy & Tenancy Model

All business records are scoped beneath their respective tenant ID:

```
tenants/{tenantId}
  ├── users/{userId}
  ├── products/{productId}
  ├── categories/{categoryId}
  ├── inventory/{productId}
  ├── sales/{saleId}
  ├── payments/{paymentId}
  ├── customers/{customerId}
  ├── suppliers/{supplierId}
  ├── purchases/{purchaseId}
  ├── expenses/{expenseId}
  ├── sync_queue/{transactionId}
  └── settings/general
```

---

## 2. Collections & Document Specifications

### 2.1 Tenant Document (`tenants/{tenantId}`)
- `id`: string (tenant identifier, e.g. `default` or `tenant_abc123`)
- `name`: string (e.g. "Acme Retail")
- `code`: string (unique alphanumeric code)
- `currency`: string (default: `"INR"`, ISO-4217)
- `createdAt`: timestamp
- `updatedAt`: timestamp

### 2.2 Settings Document (`tenants/{tenantId}/settings/general`)
- `brandName`: string
- `logoUrl`: string (optional)
- `address`: string
- `phone`: string
- `email`: string
- `gstin`: string (optional)
- `currency`: string (e.g. `"INR"`, symbol `"₹"`)
- `taxRate`: number (default percentage, e.g. 5, 12, 18)
- `upiId`: string (e.g. `merchant@okhdfcbank` for dynamic QR)
- `invoicePrefix`: string (e.g. `"INV"`, `"POS"`)
- `receiptFooter`: string (optional)
- `updatedAt`: timestamp

### 2.3 Users Document (`tenants/{tenantId}/users/{userId}`)
- `uid`: string (Firebase Auth UID)
- `tenantId`: string
- `name`: string
- `email`: string
- `role`: `"admin" | "manager" | "cashier" | "staff"`
- `branchId`: string (optional)
- `isActive`: boolean
- `avatarUrl`: string (optional)
- `lastLoginAt`: timestamp
- `createdAt`: timestamp

### 2.4 Categories Document (`tenants/{tenantId}/categories/{categoryId}`)
- `id`: string
- `tenantId`: string
- `name`: string
- `slug`: string
- `description`: string (optional)
- `isActive`: boolean
- `createdAt`: timestamp
- `updatedAt`: timestamp

### 2.5 Products Document (`tenants/{tenantId}/products/{productId}`)
- `id`: string
- `tenantId`: string
- `name`: string
- `sku`: string (unique per tenant)
- `barcode`: string (indexed for scanner lookup)
- `categoryId`: string
- `categoryName`: string (denormalized for display)
- `price`: number (selling price)
- `costPrice`: number (cost of goods)
- `taxRate`: number (percentage, e.g. 18)
- `stock`: number (current available quantity)
- `lowStockThreshold`: number (alert threshold, default: 5)
- `imageUrl`: string (Firebase Storage URL)
- `variants`: array of:
  - `id`: string
  - `name`: string (e.g. "Size XL - Black")
  - `sku`: string
  - `barcode`: string
  - `price`: number
  - `stock`: number
- `isActive`: boolean
- `createdAt`: timestamp
- `updatedAt`: timestamp

### 2.6 Inventory Adjustments Document (`tenants/{tenantId}/inventory/{adjustmentId}`)
- `id`: string
- `tenantId`: string
- `productId`: string
- `sku`: string
- `type`: `"SALE" | "RESTOCK" | "DAMAGE" | "CORRECTION" | "RETURN"`
- `quantityDelta`: number (negative for sale/damage, positive for restock)
- `previousStock`: number
- `newStock`: number
- `referenceId`: string (saleId or purchaseId)
- `reason`: string (optional)
- `performedBy`: string (userId)
- `timestamp`: timestamp

### 2.7 Sales Document (`tenants/{tenantId}/sales/{saleId}`)
- `id`: string (deterministic for offline/idempotent sync, e.g. `POS-2026-000123`)
- `tenantId`: string
- `invoiceNumber`: string (e.g. `"INV-20260918-001"`)
- `items`: array of:
  - `productId`: string
  - `variantId`: string (optional)
  - `name`: string
  - `sku`: string
  - `barcode`: string (optional)
  - `price`: number
  - `quantity`: number
  - `discount`: number
  - `tax`: number
  - `total`: number
- `subtotal`: number
- `totalDiscount`: number
- `totalTax`: number
- `grandTotal`: number
- `paymentMethod`: `"CASH" | "UPI" | "CARD" | "OTHER"`
- `paymentReference`: string (e.g. UPI UTR or card reference)
- `customerId`: string (optional)
- `customerName`: string (optional)
- `cashierId`: string
- `cashierName`: string
- `status`: `"COMPLETED" | "REFUNDED" | "CANCELLED"`
- `isOffline`: boolean
- `syncedAt`: timestamp (if synced from offline)
- `createdAt`: timestamp

### 2.8 Customers Document (`tenants/{tenantId}/customers/{customerId}`)
- `id`: string
- `tenantId`: string
- `name`: string
- `phone`: string (indexed for quick checkout search)
- `email`: string (optional)
- `totalPurchases`: number
- `totalSpent`: number
- `createdAt`: timestamp
- `updatedAt`: timestamp

---

## 3. Idempotency & Concurrency Strategy

1. **Deterministic Sale IDs**:
   All sales created client-side or offline generate a cryptographically strong UUID or prefixed sequential identifier (`saleId = POS-${tenantId}-${Date.now()}-${random}`).
2. **Firestore Transactions / Batches**:
   When a sale is recorded:
   - Sale document `tenants/{tenantId}/sales/{saleId}` is created with `create()` or transaction `get()` check. If `saleId` already exists, the operation aborts without double-decrementing.
   - For each item in the sale, product stock is decremented in the same batch/transaction:
     `db.collection("tenants").doc(tenantId).collection("products").doc(item.productId).update({ stock: FieldValue.increment(-item.quantity) })`.
   - Inventory history records are appended with `referenceId = saleId`.
