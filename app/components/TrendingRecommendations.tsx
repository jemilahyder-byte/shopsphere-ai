"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useOrderStore } from "../stores/orderStore";
import { useProductStore } from "../stores/productStore";

type Product = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
};

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(
    "https://dummyjson.com/products?limit=100"
  );

  if (!response.ok) {
    throw new Error("Unable to load trending products.");
  }

  const data: { products: Product[] } =
    await response.json();

  return data.products;
}

function subscribeToHydration(notify: () => void) {
  const subscriptions = [
    useOrderStore.persist.onHydrate(() => notify()),
    useOrderStore.persist.onFinishHydration(() => notify()),
    useProductStore.persist.onHydrate(() => notify()),
    useProductStore.persist.onFinishHydration(() => notify()),
  ];

  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
}

function getHydrationSnapshot() {
  return (
    useOrderStore.persist.hasHydrated() &&
    useProductStore.persist.hasHydrated()
  );
}

function getServerSnapshot() {
  return false;
}

export default function TrendingRecommendations() {
  const orders = useOrderStore((state) => state.orders);

  const customProducts = useProductStore(
    (state) => state.customProducts
  );

  const overrides = useProductStore(
    (state) => state.overrides
  );

  const hiddenIds = useProductStore(
    (state) => state.hiddenIds
  );

  const ready = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerSnapshot
  );

  const {
    data: apiProducts = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["products", "trending"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });

  if (!ready || isPending) {
    return (
      <p role="status" className="mt-8">
        Loading trending products...
      </p>
    );
  }

  if (isError) {
    return (
      <section
        aria-labelledby="trending-title"
        className="mt-8 rounded border p-5"
      >
        <h2
          id="trending-title"
          className="text-2xl font-bold"
        >
          Trending products
        </h2>

        <p role="alert" className="mt-3">
          Unable to load trending products.
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded border px-4 py-2"
        >
          Retry trending products
        </button>
      </section>
    );
  }

  const catalog = new Map<number, Product>();

  for (const product of apiProducts) {
    catalog.set(
      product.id,
      overrides[product.id] ?? product
    );
  }

  for (const product of customProducts) {
    catalog.set(
      product.id,
      overrides[product.id] ?? product
    );
  }

  const purchaseCounts = new Map<number, number>();

  for (const order of orders) {
    for (const item of order.items) {
      purchaseCounts.set(
        item.id,
        (purchaseCounts.get(item.id) ?? 0) +
          item.quantity
      );
    }
  }

  const trendingProducts = [...catalog.values()]
    .filter((product) => !hiddenIds.includes(product.id))
    .sort((a, b) => {
      const purchaseDifference =
        (purchaseCounts.get(b.id) ?? 0) -
        (purchaseCounts.get(a.id) ?? 0);

      return (
        purchaseDifference ||
        b.rating - a.rating ||
        a.title.localeCompare(b.title)
      );
    })
    .slice(0, 4);

  return (
    <section
      aria-labelledby="trending-title"
      className="mt-8 rounded border p-5"
    >
      <h2
        id="trending-title"
        className="text-2xl font-bold"
      >
        Trending products
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Ranked by purchases saved in this browser,
        followed by product rating.
      </p>

      {trendingProducts.length === 0 ? (
        <p className="mt-4">
          No trending products available.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {trendingProducts.map((product) => (
            <article
              key={product.id}
              className="rounded border p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.thumbnail}
                alt={product.title}
                width={240}
                height={160}
                loading="lazy"
                className="h-40 w-full rounded object-contain"
              />

              <h3 className="mt-3 font-semibold">
                <Link
                  href={"/products/" + product.id}
                  className="underline"
                >
                  {product.title}
                </Link>
              </h3>

              <p className="mt-2 capitalize">
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
      )}
    </section>
  );
}