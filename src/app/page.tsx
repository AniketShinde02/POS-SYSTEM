import Link from "next/link";
import Image from "next/image";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { ProductRepository, type IProduct } from "@/repositories/product.repository";
import { CategoryRepository, type ICategory } from "@/repositories/category.repository";
import { formatCurrency } from "@/lib/utils";
import { Package, ArrowRight, ShoppingCart, Sparkles, MapPin, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

export default async function StorefrontHomePage() {
  const productRepo = new ProductRepository();
  const categoryRepo = new CategoryRepository();

  let products: IProduct[] = [];
  let categories: ICategory[] = [];

  try {
    const productResult = await productRepo.paginate({ limit: 12 }, "default");
    products = (productResult.items || []).filter((p) => p.isActive !== false);
  } catch {
    products = [];
  }

  try {
    const categoryResult = await categoryRepo.findAll("default");
    categories = (categoryResult || []).filter((c) => c.isActive !== false);
  } catch {
    categories = [];
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-[#E85002] selection:text-white">
      <PublicHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-zinc-800/80">
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#E85002]/25 via-[#C10801]/10 to-transparent blur-3xl opacity-70" />

          <div className="mx-auto max-w-7xl px-4 lg:px-8 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E85002]/40 bg-[#E85002]/10 px-4 py-1.5 text-xs font-bold text-[#E85002] mb-6 shadow-md shadow-[#E85002]/10">
              <Sparkles className="h-3.5 w-3.5 text-[#E85002]" />
              <span>Official Retail Storefront</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
              Premium Products for Your Everyday Needs
            </h1>

            <p className="mt-4 text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Browse our live inventory catalog with real-time stock updates. Visit our retail store for instant checkout and thermal receipts.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" variant="brandGradient" className="h-12 px-8 font-bold text-sm shadow-xl shadow-[#E85002]/30">
                <Link href="/products">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Browse Products Catalog
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 border-zinc-800 bg-zinc-950 font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-white">
                <Link href="/contact">
                  <MapPin className="mr-2 h-4 w-4 text-[#E85002]" />
                  Store Location & Info
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FEATURED CATEGORIES */}
        {categories.length > 0 && (
          <section className="py-12 border-b border-zinc-800/80 bg-zinc-950/50">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Shop by Category</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Explore our wide selection of departments</p>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs text-[#E85002] hover:text-[#FF5F12]">
                  <Link href="/products">View All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.map((c) => (
                  <Link
                    key={c._id}
                    href={`/products?category=${c._id}`}
                    className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950 hover:border-[#E85002] hover:bg-zinc-900/80 transition-all text-center group"
                  >
                    <div className="mx-auto w-10 h-10 rounded-lg bg-[#E85002]/10 border border-[#E85002]/20 flex items-center justify-center text-[#E85002] mb-2.5 group-hover:scale-110 transition-transform">
                      <Package className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-white block truncate">
                      {c.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FEATURED PRODUCTS */}
        <section className="py-16 border-b border-zinc-800/80">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">Featured Products</h2>
                <p className="text-xs text-zinc-400 mt-1">Live inventory directly from our store catalog</p>
              </div>
              <Button asChild variant="brandGradient" size="sm">
                <Link href="/products">Explore Catalog</Link>
              </Button>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-dashed border-zinc-800">
                <Package className="mx-auto h-10 w-10 text-zinc-600 mb-2" />
                <p className="text-sm font-semibold text-zinc-400">Store catalog is currently updating.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <div
                    key={p._id}
                    className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 flex flex-col justify-between hover:border-[#E85002] hover:shadow-xl hover:shadow-[#E85002]/10 transition-all group"
                  >
                    <div>
                      <div className="relative h-44 w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 mb-3 flex items-center justify-center">
                        {p.images?.[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            unoptimized
                          />
                        ) : (
                          <Package className="h-10 w-10 text-zinc-700" />
                        )}
                      </div>

                      <h3 className="font-bold text-zinc-100 text-sm group-hover:text-white line-clamp-2">
                        {p.name}
                      </h3>
                      {p.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-snug">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-base font-black font-mono text-[#E85002]">
                          {formatCurrency(p.sellingPrice)}
                        </span>
                      </div>
                      <Badge variant={p.stock > 0 ? "success" : "destructive"} className="text-[10px]">
                        {p.stock > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* STORE INFO & LOCATION */}
        <section className="py-16 bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E85002]/10 border border-[#E85002]/20 flex items-center justify-center text-[#E85002]">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white text-base">Store Location</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Main Retail Market, Downtown Commercial District. Visit us for instant walk-in purchases.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E85002]/10 border border-[#E85002]/20 flex items-center justify-center text-[#E85002]">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white text-base">Store Hours</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Monday – Sunday: 9:00 AM – 9:00 PM<br />
                  Open all 7 days with live barcode checkout counters.
                </p>
              </div>

              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#E85002]/10 border border-[#E85002]/20 flex items-center justify-center text-[#E85002]">
                  <Phone className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-white text-base">Customer Support</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Phone: +91 98765 43210<br />
                  Email: support@store.local
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
