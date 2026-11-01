"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useOrderStore } from "../stores/orderStore";
import { useProductStore } from "../stores/productStore";
import {
  getFrequentlyBoughtTogether,
  type RecommendationProduct,
} from "../lib/recommendations";

type ApiProduct = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
};

function subscribeToHydration(
  notify: () => void
): () => void {
  const subscriptions = [
    useAuthStore.persist.onHydrate(() => notify()),
    useAuthStore.persist.onFinishHydration(() => notify()),
    useCartStore.persist.onHydrate(() => notify()),
    useCartStore.persist.onFinishHydration(() => notify()),
    useOrderStore.persist.onHydrate(() => notify()),
    useOrderStore.persist.onFinishHydration(() => notify()),
    useProductStore.persist.onHydrate(() => notify()),
    useProductStore.persist.onFinishHydration(() => notify()),
  ];

  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
}

function getHydrationSnapshot(): boolean {
  return (
    useAuthStore.persist.hasHydrated() &&
    useCartStore.persist.hasHydrated() &&
    useOrderStore.persist.hasHydrated() &&
    useProductStore.persist.hasHydrated()
  );
}

function getServerSnapshot(): boolean {
  return false;
}

async function fetchProducts(): Promise<
  RecommendationProduct[]
> {
  const response = await fetch(
    "https://dummyjson.com/products?limit=0"
  );

  if (!response.ok) {
    throw new Error("Unable to load recommendations.");
  }

  const data: { products: ApiProduct[] } =
    await response.json();

  return data.products.map((product) => ({
    id: product.id,
    name: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
    category: product.category,
    rating: product.rating,
  }));
}

export default function FrequentlyBoughtTogether() {
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
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

  const email = user?.email.trim().toLowerCase();

  const myOrders = email
    ? orders.filter(
        (order) =>
          order.userEmail.trim().toLowerCase() === email
      )
    : [];

  const canRequest =
    ready &&
    Boolean(email) &&
    items.length > 0 &&
    myOrders.length > 0;

  const {
    data: products = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["recommendations", "catalog"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
    enabled: canRequest,
  });

  const catalogById = new Map<
    number,
    RecommendationProduct
  >();

  for (const product of products) {
    catalogById.set(product.id, product);
  }

  for (const product of Object.values(overrides)) {
    catalogById.set(product.id, {
      id: product.id,
      name: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      category: product.category,
      rating: product.rating,
    });
  }

  for (const product of customProducts) {
    catalogById.set(product.id, {
      id: product.id,
      name: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      category: product.category,
      rating: product.rating,
    });
  }

  for (const id of hiddenIds) {
    catalogById.delete(id);
  }

  const recommendations = getFrequentlyBoughtTogether(
    Array.from(catalogById.values()),
    myOrders,
    items.map((item) => item.id)
  );

  let message = "";

  if (!ready) {
    message = "Loading...";
  } else if (!email) {
    message =
      "Sign in to see recommendations from your orders.";
  } else if (items.length === 0) {
    message =
      "Add a product to your cart to see matching items.";
  } else if (myOrders.length === 0) {
    message = "No previous demo orders available yet.";
  } else if (isPending) {
    message = "Loading recommendations...";
  } else if (isError) {
    message = "Unable to load recommendations.";
  } else if (recommendations.length === 0) {
    message =
      "No matching purchases found. A cart product must " +
      "have been ordered together with another product.";
  }

  const showError = canRequest && isError;

  return (
    <section
      aria-labelledby="bought-together-title"
      className="mt-10 border-t pt-6"
    >
      <h2
        id="bought-together-title"
        className="mb-4 text-2xl font-bold"
      >
        Frequently bought together
      </h2>

      <p className="mb-4 text-sm text-gray-600">
        Based on products purchased together in your
        previous demo orders on this browser.
      </p>

      {message ? (
        <p role={showError ? "alert" : "status"}>
          {message}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((product) => (
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

      {showError && (
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded border px-4 py-2"
        >
          Try again
        </button>
      )}
    </section>
  );
}