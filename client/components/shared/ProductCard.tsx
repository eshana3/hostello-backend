"use client";

import Image from "next/image";
import Link from "next/link";
import { MapPin, Tag, Heart } from "lucide-react";
import { Product } from "@/types";
import { cn } from "@/lib/utils";

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  new:      { label: "New",       color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" },
  like_new: { label: "Like New",  color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  good:     { label: "Good",      color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400" },
  fair:     { label: "Fair",      color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400" },
  poor:     { label: "Poor",      color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
};

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const condition = CONDITION_LABELS[product.condition] ?? CONDITION_LABELS.good;

  return (
    <Link href={`/products/${product.id}`}>
      <div
        className={cn(
          "glass-card glass-hover group cursor-pointer overflow-hidden",
          "transition-all duration-300 hover:-translate-y-1",
          className
        )}
      >
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-muted">
          {product.images?.[0] ? (
            <Image
              src={product.images[0]}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Tag className="h-10 w-10 opacity-30" />
            </div>
          )}
          {/* Condition badge */}
          <span
            className={cn(
              "absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full",
              condition.color
            )}
          >
            {condition.label}
          </span>
          {/* Wishlist */}
          <button className="absolute top-2 right-2 h-8 w-8 rounded-full glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Heart className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
              {product.title}
            </h3>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xl font-bold brand-text">
              ₹{product.price.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-muted-foreground glass px-2 py-0.5 rounded-full">
              {product.category}
            </span>
          </div>

          {product.hostelName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{product.hostelName}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ─────────────────────────────────
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card overflow-hidden", className)}>
      <div className="h-44 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton w-3/4" />
        <div className="h-4 skeleton w-1/2" />
        <div className="flex justify-between items-center">
          <div className="h-6 skeleton w-20" />
          <div className="h-5 skeleton w-16 rounded-full" />
        </div>
        <div className="h-3 skeleton w-1/3" />
      </div>
    </div>
  );
}
