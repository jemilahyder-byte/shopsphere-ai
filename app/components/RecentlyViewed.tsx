"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRecentlyViewedStore } from "../stores/recentlyViewedStore";

export default function RecentlyViewed() {
  const [mounted, setMounted] = useState(false);

  const products = useRecentlyViewedStore(
    (state) => state.products
  );
  const clearHistory = useRecentlyViewedStore(
    (state) => state.clearHistory
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || products.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="recently-viewed-title"
      className="mt-10 border-t pt-6"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="recently-viewed-title"
          className="text-2xl font-bold"
        >
          Recently viewed
        </h2>

        <button
          type="button"
          onClick={clearHistory}
          className="text-red-700 underline"
        >
          Clear viewing history
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.slice(0, 6).map((product) => (
          <article
            key={product.id}
            className="rounded border p-4"
          >
            <Link href={"/products/" + product.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.thumbnail}
                alt={product.name}
                width={240}
                height={160}
                loading="lazy"
                className="mb-3 h-40 w-full object-contain"
              />

              <h3 className="font-semibold underline">
                {product.name}
              </h3>
            </Link>

            <p className="mt-2 text-sm capitalize text-gray-600">
              {product.category.replaceAll("-", " ")}
            </p>

            <p className="mt-2">
              USD ${product.price.toFixed(2)}
            </p>

            <p className="mt-2">
              Rating: {product.rating.toFixed(1)} / 5
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}