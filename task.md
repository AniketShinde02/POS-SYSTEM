# RetailPOS Autonomous Ralph Loop Task Tracker

## 1. Authentication & Security
- [x] Fix `Cannot read properties of undefined (reading 'split')` in session route & auth-helpers
  Verified root cause: undefined emailStr fallback in route.ts line 70 and auth-helpers.ts line 82; safely guarded.
- [x] Password visibility toggle (Eye/EyeOff) with accessibility labels
  Added Eye/EyeOff toggle buttons with aria labels and keyboard accessibility.
- [x] Google Authentication integration with `GoogleAuthProvider`
  Implemented `signInWithPopup(auth, provider)` with `select_account` prompt and official SVG button.
- [x] Configurable tenant authorization check for Google accounts (prevent unauthorized entry)
  Server-side check against Firestore tenant users with active/disabled status validation and safe first-admin bootstrapping.
- [x] Isolate dev bypass strictly to `process.env.NODE_ENV !== "production"`
  Explicitly gated to development mode with amber shield badge; disallowed in production.
- [x] Modernize Login UI with professional retail POS branding and accessible UX
  Sleek card design with emerald brand accents, inline error alerts, and clean typography.

## 2. Dashboard Stabilization & Real Data
- [x] Resilient `DashboardService` fallback (no crashes on offline/uninitialized Firestore)
  Wrapped `getOverview` and `getSalesChart` in safe handlers returning clean zero metrics instead of 500s.
- [x] Configurable currency formatting (₹ for Indian retail / configurable from settings)
  Updated `formatCurrency` to default to `INR` (`₹`) with locale `en-IN` and environment override.
- [x] Rich modern dashboard widgets (Today's Sales, Transactions, AOV, Low Stock, Recent Sales)
  Added operational action bar (Open POS, Add Product, Sales), Indian Rupee icons, and high-density cards.
- [x] Sidebar navigation redesign with logical groupings (SELL, CATALOG, CUSTOMERS, OPERATIONS, ANALYTICS, ADMIN) and role-based filtering
  Reorganized into exact required sections with Lucide icons and cashier/admin role filtering.

## 3. Real POS Engine & Checkout Flow
- [x] Instant exact-amount UPI QR modal with payment reference/UTR entry
  Dynamic UPI URL generation (`upi://pay?pa=...`) with QR code image and UTR confirmation.
- [x] Keyboard barcode scanner listener with auto-focus recovery
  Hardware stream barcode listener (< 100ms key intervals) with auto-focus recovery on scanner input.
- [x] IndexedDB offline sales queue with deterministic transaction IDs
  Offline sales cached in browser IndexedDB with `POS-OFFLINE-*` IDs when disconnected.
- [x] Idempotent `/api/sales/sync` offline background synchronizer
  Automatic background sync on `online` event preventing duplicate inventory decrements.
- [x] Modern, fast POS UI with dense checkout layout, quick +/- quantity, and search
  Header register status, instant search/barcode filter, quick +/- quantity buttons, and payment method selectors.

## 4. Product, Inventory & Category Modules
- [x] Firestore repository layer with active/inactive filtering and atomic stock updates
- [x] Product form validation with barcode, SKU, price, tax, and category
- [x] Product image uploads via Firebase Storage
- [x] Lightweight CSV batch import

## 5. Billing & Invoicing
- [x] Multi-format thermal printer receipt formatting (58mm/80mm ESC/POS)
- [x] GSTIN/tax calculation and collision-free invoice numbering

## 6. Code Quality & Build Gates
- [x] Typecheck (`npx tsc --noEmit`) - PASS (0 errors)
- [x] ESLint check (`npm run lint`) - PASS (0 errors)
- [x] Production build (`npm run build`) - PASS (47/47 routes generated and statically optimized)
- [x] Runtime smoke test across major routes (`/login` 200, `/dashboard` 200, `/pos` 200)
