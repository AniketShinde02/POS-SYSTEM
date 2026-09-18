import Link from "next/link";
import { Store, ShieldCheck, Truck, Headphones, Clock } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-zinc-800/80 bg-zinc-950 text-zinc-400 text-xs">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-white text-base">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E85002] text-white">
                <Store className="h-4 w-4" />
              </div>
              <span>RetailPOS</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Enterprise Point of Sale & Multi-Tenant Retail Platform. Complete stock control, billing, barcode scanning & instant receipts.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-zinc-300">Quick Links</h4>
            <ul className="space-y-1.5 font-medium">
              <li><Link href="/" className="hover:text-[#E85002] transition-colors">Storefront Home</Link></li>
              <li><Link href="/products" className="hover:text-[#E85002] transition-colors">Browse Catalog</Link></li>
              <li><Link href="/about" className="hover:text-[#E85002] transition-colors">About Our Store</Link></li>
              <li><Link href="/contact" className="hover:text-[#E85002] transition-colors">Contact & Location</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-zinc-300">Store Services</h4>
            <ul className="space-y-1.5 font-medium">
              <li className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-[#E85002]" /> In-Store Pickup</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-[#E85002]" /> Authentic Products</li>
              <li className="flex items-center gap-2"><Headphones className="h-3.5 w-3.5 text-[#E85002]" /> Customer Care</li>
              <li className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[#E85002]" /> Open Daily 9 AM - 9 PM</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider text-zinc-300">Terminal Access</h4>
            <p className="text-zinc-400 text-xs">
              Authorized cashiers and store managers can log in to access POS billing and inventory tools.
            </p>
            <div className="pt-2">
              <Link href="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#E85002] hover:underline">
                Terminal Login →
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} RetailPOS Terminal System. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 font-medium">Powered by Next.js & Cloud Firestore</p>
        </div>
      </div>
    </footer>
  );
}
