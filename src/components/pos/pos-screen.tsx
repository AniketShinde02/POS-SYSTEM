"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import {
  Search,
  Barcode,
  Trash2,
  Pause,
  Play,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  Printer,
  Plus,
  Minus,
  Wifi,
  WifiOff,
  Camera,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useDebounce } from "@/hooks/use-debounce";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/lib/utils";
import { printThermalReceipt } from "@/lib/print-invoice";
import { saveOfflineSale, syncPendingSales } from "@/lib/offline-db";
import { CameraBarcodeScanner } from "@/components/pos/camera-barcode-scanner";
import { useSession } from "@/components/providers/session-provider";
import { FileText, CheckCircle2 } from "lucide-react";
import type { CartItem } from "@/types";

interface ProductResult {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  sellingPrice: number;
  stock: number;
  images?: string[];
  taxRate?: number;
}

interface StoreSettings {
  storeName?: string;
  phone?: string;
  address?: string;
  currencySymbol?: string;
  taxName?: string;
  gstin?: string;
  invoiceFooter?: string;
}

export function PosScreen() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "other">("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [cashTendered, setCashTendered] = useState<number | "">("");
  const [isOnline, setIsOnline] = useState(true);
  const [settings, setSettings] = useState<StoreSettings>({});

  const debouncedSearch = useDebounce(search);
  const barcodeBufferRef = useRef<{ code: string; lastTime: number }>({ code: "", lastTime: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    items,
    discount,
    taxRate,
    heldCarts,
    addItem,
    updateQuantity,
    setDiscount,
    clearCart,
    holdCart,
    resumeCart,
    getSubtotal,
    getTotal,
  } = useCartStore();

  const totalAmount = getTotal();

  // Load store settings on mount
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setSettings(json.data);
        }
      })
      .catch(() => {});
  }, []);

  // Monitor network status
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = async () => {
      setIsOnline(true);
      toast.success("Network restored. Syncing offline transactions...");
      const { synced } = await syncPendingSales();
      if (synced > 0) toast.success(`Synced ${synced} offline transaction(s) to Firestore!`);
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Network disconnected. Running in standalone offline mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchProducts = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const url = q ? `/api/products/search?q=${encodeURIComponent(q)}` : `/api/products?limit=24`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        const list = Array.isArray(json.data) ? json.data : (json.data?.items ?? []);
        setProducts(list);
      }
    } catch {
      // offline fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(debouncedSearch);
  }, [debouncedSearch, fetchProducts]);

  const addProductToCart = useCallback(
    (product: ProductResult) => {
      if (product.stock <= 0) {
        toast.error("Out of stock");
        return;
      }
      const item: CartItem = {
        productId: product._id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        price: product.sellingPrice,
        quantity: 1,
        discount: 0,
        tax: product.taxRate ?? 0,
        image: product.images?.[0],
      };
      addItem(item);
      setSearch("");
      toast.success(`Added ${product.name}`);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    },
    [addItem]
  );

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      try {
        const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
        const json = await res.json();
        if (json.success && json.data) {
          addProductToCart(json.data);
        } else {
          toast.error(`Barcode not found: ${barcode}`);
        }
      } catch {
        toast.error("Failed to query barcode");
      }
    },
    [addProductToCart]
  );

  // Physical hardware barcode scanner listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      const now = Date.now();
      const diff = now - barcodeBufferRef.current.lastTime;

      if (e.key === "Enter") {
        if (barcodeBufferRef.current.code.length >= 4) {
          handleBarcodeScan(barcodeBufferRef.current.code);
        }
        barcodeBufferRef.current.code = "";
      } else if (e.key.length === 1) {
        if (diff > 100) {
          barcodeBufferRef.current.code = e.key;
        } else {
          barcodeBufferRef.current.code += e.key;
        }
      }
      barcodeBufferRef.current.lastTime = now;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleBarcodeScan]);

  useKeyboardShortcuts({
    "ctrl+f": () => document.getElementById("pos-search")?.focus(),
    "ctrl+h": () => holdCart(),
    f2: () => setPaymentMethod("cash"),
    f3: () => setPaymentMethod("card"),
    f4: () => setPaymentMethod("upi"),
  });

  const completeCheckoutFlow = async (refNumber?: string, cashReceived?: number) => {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    setCheckoutLoading(true);
    const total = getTotal();
    const payments = [
      {
        method: paymentMethod,
        amount: total,
        reference: refNumber || paymentReference || (cashReceived ? `Cash: ₹${cashReceived}` : undefined),
      },
    ];

    try {
      if (!isOnline) {
        // Store offline in local IndexedDB
        const offlineId = `POS-OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await saveOfflineSale({
          transactionId: offlineId,
          items,
          discount,
          taxRate,
          payments,
          createdAt: new Date().toISOString(),
        });

        printThermalReceipt({
          storeName: settings.storeName || "RetailPOS Store",
          storeAddress: settings.address,
          storePhone: settings.phone,
          gstin: settings.gstin,
          currencySymbol: settings.currencySymbol || "₹",
          invoiceNumber: offlineId,
          date: new Date().toLocaleString(),
          cashier: "Cashier",
          items,
          subtotal: getSubtotal(),
          discount,
          tax: getSubtotal() * (taxRate / 100),
          total,
          payments,
          footer: settings.invoiceFooter,
        });

        clearCart();
        setIsUpiModalOpen(false);
        setIsCashModalOpen(false);
        setPaymentReference("");
        setCashTendered("");
        toast.success("Saved offline. Will sync automatically once online.");
        return;
      }

      // Online checkout
      const res = await fetch("/api/sales/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          discount,
          taxRate,
          payments,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Checkout failed");

      printThermalReceipt({
        storeName: settings.storeName || "RetailPOS Store",
        storeAddress: settings.address,
        storePhone: settings.phone,
        gstin: settings.gstin,
        currencySymbol: settings.currencySymbol || "₹",
        invoiceNumber: json.data.invoiceNumber,
        date: new Date().toLocaleString(),
        cashier: "Cashier",
        items,
        subtotal: getSubtotal(),
        discount,
        tax: getSubtotal() * (taxRate / 100),
        total,
        payments,
        footer: settings.invoiceFooter,
      });

      clearCart();
      setIsUpiModalOpen(false);
      setIsCashModalOpen(false);
      setPaymentReference("");
      setCashTendered("");
      toast.success("Sale completed successfully!");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckoutClick = () => {
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (paymentMethod === "upi") {
      setIsUpiModalOpen(true);
    } else if (paymentMethod === "cash") {
      setCashTendered(totalAmount);
      setIsCashModalOpen(true);
    } else {
      setIsBillPreviewOpen(true);
    }
  };

  const tenderNum = Number(cashTendered) || totalAmount;
  const changeDue = Math.max(0, tenderNum - totalAmount);

  const upiPayUrl = `upi://pay?pa=merchant@upi&pn=RetailPOS&am=${totalAmount.toFixed(2)}&cu=INR`;
  const upiQrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    upiPayUrl
  )}`;

  return (
    <div className="grid h-[calc(100vh-7.5rem)] gap-4 lg:grid-cols-3">
      {/* Product Search & Grid Column */}
      <div className="flex flex-col gap-3 lg:col-span-2">
        {/* Terminal Header */}
        <div className="flex flex-wrap items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/90 px-3.5 py-2 shadow-sm gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E85002]/20 text-[#E85002] border border-[#E85002]/30">
              <Barcode className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  {settings.storeName || "RetailPOS"}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  • {session?.user?.name || "Cashier"} ({session?.user?.role || "cashier"})
                </span>
              </div>
              <span className="text-[10px] font-semibold text-[#E85002] uppercase tracking-wider">
                EMP ID: {session?.user?.id ? session.user.id.substring(0, 8) : "EMP-0001"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-zinc-400 font-medium">
              <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 font-mono text-[9px] text-zinc-300">Ctrl+F</kbd> Search • <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 font-mono text-[9px] text-zinc-300">F2</kbd> Cash • <kbd className="rounded border border-zinc-700 bg-zinc-900 px-1 py-0.5 font-mono text-[9px] text-zinc-300">F4</kbd> UPI
            </span>
            <Badge
              variant={isOnline ? "outline" : "destructive"}
              className="flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] border-[#E85002]/40 bg-[#E85002]/10 text-[#E85002]"
            >
              {isOnline ? (
                <>
                  <Wifi className="h-3 w-3 text-[#E85002]" />
                  <span className="font-bold">Online Terminal</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>Offline Store</span>
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Search Bar + Mobile Camera Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              ref={searchInputRef}
              id="pos-search"
              placeholder="Scan barcode or search product name / SKU (Ctrl+F)"
              className="pl-10 pr-10 h-11 border-zinc-800 bg-zinc-950 text-zinc-100 placeholder:text-zinc-500 focus-visible:border-[#E85002] focus-visible:ring-[#E85002]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && search.length >= 4) {
                  handleBarcodeScan(search);
                }
              }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleBarcodeScan(search)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-[#E85002] transition-colors"
              title="Barcode Scanner"
            >
              <Barcode className="h-4 w-4" />
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-11 px-3.5 border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900 hover:border-zinc-700"
            onClick={() => setIsCameraScannerOpen(true)}
            title="Scan with Camera"
          >
            <Camera className="h-4 w-4 sm:mr-1.5 text-[#E85002]" />
            <span className="hidden sm:inline text-xs font-bold">Scan</span>
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 content-start pr-1">
          {loading && <p className="col-span-full text-center text-zinc-500 py-12 text-xs font-medium">Searching catalog...</p>}
          {products.map((product) => (
            <button
              key={product._id}
              type="button"
              onClick={() => addProductToCart(product)}
              className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950 p-3.5 text-left transition-all duration-150 hover:border-[#E85002] hover:shadow-lg hover:shadow-[#E85002]/10 focus:outline-none focus:ring-2 focus:ring-[#E85002] group"
            >
              <div>
                <span className="line-clamp-2 text-xs font-bold text-zinc-100 group-hover:text-white">{product.name}</span>
                <span className="mt-1.5 block text-sm font-black text-[#E85002] font-mono">
                  {formatCurrency(product.sellingPrice)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400">
                <Badge variant={product.stock <= 5 ? "warning" : "secondary"} className="text-[10px] px-2 py-0.5 font-bold">
                  Stock: {product.stock}
                </Badge>
                {product.barcode && <span className="font-mono text-[9px] text-zinc-500">|||</span>}
              </div>
            </button>
          ))}
          {!loading && products.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-zinc-800 p-12 text-center">
              <ShoppingBag className="mx-auto h-8 w-8 text-zinc-600 mb-2 opacity-60" />
              <p className="text-xs font-semibold text-zinc-400">No products found matching &ldquo;{search}&rdquo;.</p>
              <p className="text-[11px] text-zinc-500 mt-1">Try scanning a barcode or clearing the search query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart & Billing Column */}
      <Card className="flex flex-col border-zinc-800/80 bg-zinc-950/90 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-[#E85002]" />
            <CardTitle className="text-base font-bold text-white">
              Current Order ({items.length})
            </CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" onClick={() => holdCart()} title="Hold Cart (Ctrl+H)">
              <Pause className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/40" onClick={clearCart} title="Clear Cart">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-3 overflow-hidden p-4">
          {heldCarts.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-zinc-800">
              {heldCarts.map((h) => (
                <Button key={h.id} variant="outline" size="sm" className="h-7 text-xs border-[#E85002]/40 text-[#E85002] bg-[#E85002]/10" onClick={() => resumeCart(h.id)}>
                  <Play className="mr-1 h-3 w-3 text-[#E85002]" />
                  Resume Cart
                </Button>
              ))}
            </div>
          )}

          {/* Line Items */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex items-center justify-between rounded-xl bg-zinc-900/90 p-3 border border-zinc-800/80 shadow-inner"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="truncate text-xs font-bold text-white">{item.name}</p>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {formatCurrency(item.price)} &times; {item.quantity} = <span className="font-bold text-white">{formatCurrency(item.price * item.quantity)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-zinc-950 rounded-lg border border-zinc-800 p-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded text-zinc-300 hover:text-white"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-xs font-bold text-white font-mono">
                    {item.quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded text-zinc-300 hover:text-white"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="py-16 text-center text-zinc-500">
                <ShoppingBag className="mx-auto h-8 w-8 mb-2 text-zinc-600 opacity-60" />
                <p className="text-xs font-medium">Scan barcode or select items to populate cart</p>
              </div>
            )}
          </div>

          {/* Subtotal, Discount & Payment Buttons */}
          <div className="space-y-2.5 border-t border-zinc-800/80 pt-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400">Discount (₹):</span>
              <Input
                type="number"
                placeholder="0"
                value={discount || ""}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="h-8 text-xs w-24 ml-auto text-right bg-zinc-900 border-zinc-700 text-white font-mono font-bold"
              />
            </div>
            <div className="flex justify-between text-xs text-zinc-400 font-medium">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between items-center text-base font-extrabold text-white pt-1">
              <span>Grand Total</span>
              <span className="text-2xl font-black text-[#E85002] font-mono">{formatCurrency(totalAmount)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <Button
                type="button"
                variant={paymentMethod === "cash" ? "default" : "outline"}
                size="sm"
                className={paymentMethod === "cash" ? "bg-[#E85002] hover:bg-[#FF5F12] text-white font-bold shadow-md shadow-[#E85002]/30" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}
                onClick={() => setPaymentMethod("cash")}
              >
                <Banknote className="mr-1 h-3.5 w-3.5" />
                Cash
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "upi" ? "default" : "outline"}
                size="sm"
                className={paymentMethod === "upi" ? "bg-[#E85002] hover:bg-[#FF5F12] text-white font-bold shadow-md shadow-[#E85002]/30" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}
                onClick={() => setPaymentMethod("upi")}
              >
                <QrCode className="mr-1 h-3.5 w-3.5" />
                UPI
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "card" ? "default" : "outline"}
                size="sm"
                className={paymentMethod === "card" ? "bg-[#E85002] hover:bg-[#FF5F12] text-white font-bold shadow-md shadow-[#E85002]/30" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="mr-1 h-3.5 w-3.5" />
                Card
              </Button>
              <Button
                type="button"
                variant={paymentMethod === "other" ? "default" : "outline"}
                size="sm"
                className={paymentMethod === "other" ? "bg-[#E85002] hover:bg-[#FF5F12] text-white font-bold shadow-md shadow-[#E85002]/30" : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}
                onClick={() => setPaymentMethod("other")}
              >
                <Layers className="mr-1 h-3.5 w-3.5" />
                Other
              </Button>
            </div>

            {/* Primary Action Button */}
            <Button
              className="w-full bg-gradient-to-r from-[#E85002] via-[#F16001] to-[#C10801] hover:opacity-95 text-white font-black shadow-lg shadow-[#E85002]/30 h-12 text-sm tracking-wide"
              size="lg"
              onClick={handleCheckoutClick}
              disabled={checkoutLoading || items.length === 0}
            >
              <Printer className="mr-2 h-4 w-4" />
              {checkoutLoading ? "Completing Sale..." : `Pay ${formatCurrency(totalAmount)} & Print`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cash Tender & Change Due Modal */}
      <Dialog open={isCashModalOpen} onOpenChange={setIsCashModalOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 text-zinc-100 border border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white font-bold">
              <Banknote className="h-5 w-5 text-[#E85002]" />
              Cash Payment & Change Calculator
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Calculate cash tendered and return change due for current sale.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
              <span className="text-xs font-bold text-zinc-400">Total Payable:</span>
              <span className="text-2xl font-black text-[#E85002] font-mono">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 font-bold text-xs">Quick Tender Options</Label>
              <div className="grid grid-cols-4 gap-2">
                {[totalAmount, Math.ceil(totalAmount / 50) * 50, Math.ceil(totalAmount / 100) * 100, 500].map((amt, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs font-bold border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-[#E85002] hover:text-white"
                    onClick={() => setCashTendered(amt)}
                  >
                    ₹{amt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cash-tendered" className="text-zinc-300 font-bold text-xs">
                Cash Received from Customer (₹)
              </Label>
              <Input
                id="cash-tendered"
                type="number"
                step="1"
                value={cashTendered}
                onChange={(e) => setCashTendered(Number(e.target.value) || "")}
                className="bg-zinc-900 text-white border-zinc-700 text-lg font-black font-mono focus-visible:border-[#E85002]"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#E85002]/10 border border-[#E85002]/30">
              <span className="text-xs font-bold text-[#E85002]">Return Change Due:</span>
              <span className="text-2xl font-black text-[#E85002] font-mono">
                {formatCurrency(changeDue)}
              </span>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between border-t border-zinc-800 pt-3">
            <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => setIsCashModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E85002] to-[#C10801] hover:opacity-95 text-white font-bold"
              onClick={() => completeCheckoutFlow(undefined, tenderNum)}
              disabled={checkoutLoading || tenderNum < totalAmount}
            >
              {checkoutLoading ? "Printing..." : "Confirm & Print Bill"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPI Exact-Amount Payment Modal */}
      <Dialog open={isUpiModalOpen} onOpenChange={setIsUpiModalOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 text-zinc-100 border border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-center text-white font-bold">Scan to Pay via UPI</DialogTitle>
            <DialogDescription className="text-center text-xs text-zinc-400">
              Customer scans QR code to pay exact bill total. Enter transaction UTR number below.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-4 py-2">
            <div className="text-2xl font-black text-[#E85002] font-mono">
              {formatCurrency(totalAmount)}
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-white p-3.5 shadow-2xl">
              <img
                src={upiQrImageUrl}
                alt="UPI Payment QR"
                className="h-48 w-48 rounded-lg object-contain"
              />
            </div>
            <p className="text-center text-xs text-zinc-400 font-medium">
              Customer scans QR using any UPI app (GPay, PhonePe, Paytm, BHIM)
            </p>
            <div className="w-full space-y-1.5">
              <Label htmlFor="upi-utr" className="text-xs font-bold text-zinc-300">
                Payment Reference / UTR Number
              </Label>
              <Input
                id="upi-utr"
                placeholder="e.g. 423871928371"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="bg-zinc-900 text-white border-zinc-700 font-mono text-xs focus-visible:border-[#E85002]"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-between border-t border-zinc-800 pt-3">
            <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => setIsUpiModalOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E85002] to-[#C10801] hover:opacity-95 text-white font-bold"
              onClick={() => completeCheckoutFlow(paymentReference)}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? "Confirming..." : "Confirm & Print Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Preview Modal */}
      <Dialog open={isBillPreviewOpen} onOpenChange={setIsBillPreviewOpen}>
        <DialogContent className="sm:max-w-lg bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white font-bold text-base">
              <FileText className="h-5 w-5 text-[#E85002]" />
              Order Bill Preview & Invoice Summary
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400">
              Review itemized bill details before completing checkout and printing invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Store & Cashier Header */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-white text-sm">{settings.storeName || "RetailPOS Store"}</span>
                <span className="font-mono text-[10px] text-zinc-400">Date: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Cashier: {session?.user?.name || "Cashier"}</span>
                <span className="font-mono">Emp ID: {session?.user?.id ? session.user.id.substring(0, 8) : "EMP-0001"}</span>
              </div>
            </div>

            {/* Itemized List */}
            <div className="max-h-48 overflow-y-auto space-y-2 border-y border-zinc-800 py-3 pr-1">
              <div className="grid grid-cols-12 font-bold text-zinc-400 text-[10px] uppercase border-b border-zinc-800/80 pb-1">
                <span className="col-span-6">Item</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Price</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              {items.map((item) => (
                <div key={item.productId} className="grid grid-cols-12 items-center text-zinc-200">
                  <span className="col-span-6 font-semibold truncate">{item.name}</span>
                  <span className="col-span-2 text-center font-mono text-zinc-400">x{item.quantity}</span>
                  <span className="col-span-2 text-right font-mono text-zinc-400">{formatCurrency(item.price)}</span>
                  <span className="col-span-2 text-right font-mono font-bold text-white">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Totals Summary */}
            <div className="space-y-1.5 font-mono text-right text-xs pt-1">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal:</span>
                <span>{formatCurrency(getSubtotal())}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#E85002]">
                  <span>Discount:</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Tax ({taxRate}%):</span>
                  <span>+{formatCurrency(getSubtotal() * (taxRate / 100))}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-white pt-2 border-t border-zinc-800">
                <span>Grand Total:</span>
                <span className="text-[#E85002]">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 capitalize">
                <span>Payment Method:</span>
                <span className="font-bold text-white">{paymentMethod}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:justify-between border-t border-zinc-800 pt-3">
            <Button variant="outline" className="border-zinc-700 text-zinc-300" onClick={() => setIsBillPreviewOpen(false)}>
              Cancel / Edit
            </Button>
            <Button
              className="bg-gradient-to-r from-[#E85002] to-[#C10801] hover:opacity-95 text-white font-bold"
              onClick={() => {
                setIsBillPreviewOpen(false);
                completeCheckoutFlow();
              }}
              disabled={checkoutLoading}
            >
              <Printer className="mr-2 h-4 w-4" />
              {checkoutLoading ? "Finalizing..." : "Confirm Payment & Print"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Camera Barcode Scanner Modal */}
      <CameraBarcodeScanner
        open={isCameraScannerOpen}
        onOpenChange={setIsCameraScannerOpen}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}
