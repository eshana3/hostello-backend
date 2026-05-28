"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/shared/ProductCard";
import { ErrorMessage } from "@/components/shared/ErrorMessage";
import { useAuthStore } from "@/store/authStore";
import { productsApi } from "@/lib/api";
import { Product, Category } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

const CATEGORIES: (Category | "All")[] = [
  "All", "Electronics", "Books", "Clothes", "Furniture",
  "Sports", "Stationery", "Food", "Appliances", "Vehicles", "Other",
];

function HomeContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const { isLoggedIn } = useAuthStore();

  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeCategory, setCategory] = useState<string>("All");

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (q) params.q = q;
      if (activeCategory !== "All") params.category = activeCategory;
      const { data } = await productsApi.list(params);
      setProducts(data.products ?? []);
    } catch {
      setError("Failed to load products. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [q, activeCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Hero – only when not searching */}
      {!q && (
        <section className="glass-card p-8 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

          <div className="relative space-y-4 max-w-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Hostel Marketplace
            </div>
            <h1 className="text-4xl sm:text-5xl font-black leading-tight">
              Buy & Sell within <br />
              <span className="brand-text">your hostel</span>
            </h1>
            <p className="text-muted-foreground">
              Find second-hand goods from your neighbours. Safe, easy, and
              community-driven.
            </p>
            {isLoggedIn ? (
              <Button variant="gradient" size="lg" asChild>
                <Link href="/products/new" className="gap-2">
                  <Plus className="h-5 w-5" /> List something
                </Link>
              </Button>
            ) : (
              <Button variant="gradient" size="lg" asChild>
                <Link href="/login">Get started</Link>
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Search result header */}
      {q && (
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">
            Results for "<span className="brand-text">{q}</span>"
          </h2>
          <span className="text-sm text-muted-foreground glass px-2 py-0.5 rounded-full">
            {products.length} found
          </span>
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-md"
                : "glass glass-hover text-muted-foreground hover:text-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {error ? (
        <ErrorMessage message={error} onRetry={fetchProducts} />
      ) : loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-3">
          <div className="text-5xl">🏪</div>
          <h3 className="font-bold text-lg">No listings yet</h3>
          <p className="text-muted-foreground text-sm">
            {q ? `No results for "${q}". Try a different search.` : "Be the first to list something in your hostel!"}
          </p>
          {isLoggedIn && (
            <Button variant="gradient" asChild>
              <Link href="/products/new">
                <Plus className="h-4 w-4 mr-1" /> List an item
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
