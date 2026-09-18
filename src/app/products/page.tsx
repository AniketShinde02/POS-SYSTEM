import Image from "next/image";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { ProductRepository, type IProduct } from "@/repositories/product.repository";
import { CategoryRepository, type ICategory } from "@/repositories/category.repository";
import { formatCurrency } from "@/lib/utils";
import { Package, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const revalidate = 60;

interface Props {
  searchParams: Promise<{ search?: string; category?: string }>;
}

export default async function PublicProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const productRepo = new ProductRepository();
  const categoryRepo = new CategoryRepository();

  let products: IProduct[] = [];
  let categories: ICategory[] = [];

  try {
    const productResult = await productRepo.paginate(
      { limit: 100, search: params.search },
      "default"
    );
    products = (productResult.items || []).filter((p) => p.isActive !== false);
    if (params.category) {
      products = products.filter((p) => p.categoryId === params.category);
    }
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
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans">
      <PublicHeader />

      <main className="flex-1 py-10">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 space-y-8">
          {/* Header & Filter Bar */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Product Catalog</h1>
              <p className="text-xs text-zinc-400 mt-1">
                Browse our live store inventory. Stock availability is updated in real time.
              </p>
            </div>

            <form action="/products" method="GET" className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  name="search"
                  defaultValue={params.search || ""}
                  placeholder="Search by product name, SKU, or barcode..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-800 bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#E85002]"
                />
              </div>

              <select
                name="category"
                defaultValue={params.category || ""}
                className="h-11 sm:w-64 rounded-xl border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 focus:outline-none focus:border-[#E85002]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-[#E85002] hover:bg-[#FF5F12] font-bold text-xs text-white shadow-lg shadow-[#E85002]/20 transition-all"
              >
                Search
              </button>
            </form>
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-dashed border-zinc-800">
              <Package className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
              <h3 className="text-base font-bold text-zinc-200">No products found</h3>
              <p className="text-xs text-zinc-400 mt-1">Try broadening your search term or selecting a different category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 flex flex-col justify-between hover:border-[#E85002] transition-all group"
                >
                  <div>
                    <div className="relative h-48 w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 mb-3 flex items-center justify-center">
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

                    <div className="space-y-1">
                      <h2 className="font-bold text-zinc-100 text-sm group-hover:text-white line-clamp-2">
                        {p.name}
                      </h2>
                      {p.sku && (
                        <p className="font-mono text-[10px] text-zinc-500">SKU: {p.sku}</p>
                      )}
                      {p.description && (
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-snug">
                          {p.description}
                        </p>
                      )}
                    </div>
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
      </main>

      <PublicFooter />
    </div>
  );
}
