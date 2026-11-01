"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRecentlyViewedStore } from "../stores/recentlyViewedStore";
import { useProductStore } from "../stores/productStore";

export default function RecentlyViewed() {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const products = useRecentlyViewedStore((s) => s.products);
  const clearHistory = useRecentlyViewedStore((s) => s.clearHistory);
  const customProducts = useProductStore((s) => s.customProducts);
  const overrides = useProductStore((s) => s.overrides);
  const hiddenIds = useProductStore((s) => s.hiddenIds);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        if (!useRecentlyViewedStore.persist.hasHydrated()) {
          await useRecentlyViewedStore.persist.rehydrate();
        }

        if (!useProductStore.persist.hasHydrated()) {
          await useProductStore.persist.rehydrate();
        }

        const hydrated =
          useRecentlyViewedStore.persist.hasHydrated() &&
          useProductStore.persist.hasHydrated();

        if (active) {
          setReady(hydrated);
          setStorageError(!hydrated);
        }
      } catch {
        if (active) setStorageError(true);
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, []);

  const visibleProducts = products
    .filter((product) => !hiddenIds.includes(product.id))
    .map((product) => {
      const updated =
        customProducts.find((item) => item.id === product.id) ??
        overrides[product.id];

      return updated
        ? {
            ...product,
            name: updated.title,
            price: updated.price,
            thumbnail: updated.thumbnail,
            category: updated.category,
            rating: updated.rating,
          }
        : product;
    })
    .slice(0, 6);

  if (storageError) {
    return (
      <p role="alert" className="mt-10">
        Unable to load viewing history. Refresh to retry.
      </p>
    );
  }

  if (!ready || visibleProducts.length === 0) return null;

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
        {visibleProducts.map((product) => (
          <article key={product.id} className="rounded border p-4">
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