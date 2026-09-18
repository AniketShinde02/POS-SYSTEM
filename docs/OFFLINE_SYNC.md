# RetailPOS — Offline Architecture & Synchronization Strategy

## 1. Single Billing Engine Principle

RetailPOS guarantees that business logic (line item price calculation, discounts, GST/tax calculation, roundoffs, and grand total) is identical regardless of network availability:

```
                  ┌──────────────────────┐
                  │    Cart & Billing    │
                  │        Engine        │
                  │  (Unified Business)  │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
       [Network Online]             [Network Offline]
              │                             │
              ▼                             ▼
      Direct Firestore              IndexedDB / Local
         Transaction                Persistence Queue
              │                             │
              ▼                             ▼
      Instant Receipt &             Instant Receipt &
        Print Output                  Print Output
                                            │
                                    (Network Returns)
                                            │
                                            ▼
                                   Idempotent Sync to
                                       Firestore
```

---

## 2. Local Persistence (IndexedDB)

When network connection drops:
1. **Catalog Cache**: The product catalog (`products`, `categories`) is synced to `IndexedDB` on load and refreshed in background.
2. **Transaction Queue (`offline_sales_queue`)**:
   - Each sale generates a deterministic transaction ID: `saleId = POS-${tenantId}-${Date.now()}-${randomKey}`.
   - The sale object includes the cart items, payment details, timestamp, and cashier identifier.
   - The receipt is printed or displayed immediately using local state.
   - The sale record is appended to the local IndexedDB table `pending_sync`.

---

## 3. Idempotent Synchronization Protocol

When the browser detects `navigator.onLine` or via periodic heartbeat:
1. The queue worker reads pending transactions from `pending_sync`.
2. For each pending transaction:
   - Call `/api/sales/sync` with payload `{ saleId, tenantId, items, paymentMethod, ... }`.
   - The server initiates a Firestore transaction:
     - Check if `tenants/{tenantId}/sales/{saleId}` exists.
     - **If already exists**: Server returns `{ status: "ALREADY_EXISTS", success: true }`. No inventory is decremented again.
     - **If new**: Write the sale document, decrement product stock atomically using `FieldValue.increment(-qty)`, and write an inventory ledger entry.
   - Upon receiving success from server, remove the transaction from IndexedDB `pending_sync`.
3. If network fails mid-batch or user clicks retry, no duplicate sales or double-decrements can occur because the `saleId` is unique and idempotent.
