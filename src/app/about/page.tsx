import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { Store, ShieldCheck, Zap, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 py-16">
        <div className="mx-auto max-w-4xl px-4 space-y-12 text-center">
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E85002]/10 border border-[#E85002]/20 text-[#E85002]">
              <Store className="h-7 w-7" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">About RetailPOS Store</h1>
            <p className="text-sm text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              We operate an enterprise retail store equipped with real-time point-of-sale inventory tracking, instant barcode checkout, and digital receipts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-2">
              <ShieldCheck className="h-6 w-6 text-[#E85002]" />
              <h3 className="font-bold text-white text-base">Verified Products</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">All catalog items are sourced directly from verified distributors with full quality assurance.</p>
            </div>
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-2">
              <Zap className="h-6 w-6 text-[#E85002]" />
              <h3 className="font-bold text-white text-base">Instant Billing</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Walk-in customer checkout takes under 10 seconds per order with thermal receipt printing.</p>
            </div>
            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950 space-y-2">
              <Award className="h-6 w-6 text-[#E85002]" />
              <h3 className="font-bold text-white text-base">Customer Satisfaction</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">Dedicated support staff and multi-payment support including UPI, Cards, and Cash.</p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
