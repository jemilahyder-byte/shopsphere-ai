"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useWishlistStore } from "../stores/wishlistStore";
import { useOrderStore } from "../stores/orderStore";
import { useRecentlyViewedStore } from "../stores/recentlyViewedStore";
import { useProductStore } from "../stores/productStore";
import {
  getPersonalizedRecommendations,
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

async function fetchProducts(): Promise<RecommendationProduct[]> {
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

export default function PersonalizedRecommendations() {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const user = useAuthStore((state) => state.user);
  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore(
    (state) => state.items
  );
  const orders = useOrderStore((state) => state.orders);
  const viewedProducts = useRecentlyViewedStore(
    (state) => state.products
  );
  const customProducts = useProductStore(
    (state) => state.customProducts
  );
  const overrides = useProductStore(
    (state) => state.overrides
  );
  const hiddenIds = useProductStore(
    (state) => state.hiddenIds
  );

  useEffect(() => {
    let active = true;

    async function loadPreferences() {
      try {
        if (!useWishlistStore.persist.hasHydrated()) {
          await useWishlistStore.persist.rehydrate();
        }

        if (!useCartStore.persist.hasHydrated()) {
          await useCartStore.persist.rehydrate();
        }

        if (!useOrderStore.persist.hasHydrated()) {
          await useOrderStore.persist.rehydrate();
        }

        if (!useRecentlyViewedStore.persist.hasHydrated()) {
          await useRecentlyViewedStore.persist.rehydrate();
        }

        if (!useProductStore.persist.hasHydrated()) {
          await useProductStore.persist.rehydrate();
        }

        const hydrated =
          useWishlistStore.persist.hasHydrated() &&
          useCartStore.persist.hasHydrated() &&
          useOrderStore.persist.hasHydrated() &&
          useRecentlyViewedStore.persist.hasHydrated() &&
          useProductStore.persist.hasHydrated();

        if (active) {
          setReady(hydrated);
          setStorageError(!hydrated);
        }
      } catch {
        if (active) {
          setStorageError(true);
        }
      }
    }

    void loadPreferences();

    return () => {
      active = false;
    };
  }, []);

  const email = user?.email.trim().toLowerCase();

  const myOrders = email
    ? orders.filter(
        (order) =>
          order.userEmail.trim().toLowerCase() === email
      )
    : [];

  const hasActivity =
    viewedProducts.length > 0 ||
    wishlistItems.length > 0 ||
    cartItems.length > 0 ||
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
    enabled: ready && hasActivity,
  });

  const managedProducts: RecommendationProduct[] = [
    ...customProducts,
    ...Object.values(overrides),
  ].map((item) => ({
    id: item.id,
    name: item.title,
    price: item.price,
    thumbnail: item.thumbnail,
    category: item.category,
    rating: item.rating,
  }));

  const managedIds = new Set(
    managedProducts.map((item) => item.id)
  );

  const catalog = [
    ...managedProducts,
    ...products.filter((item) => !managedIds.has(item.id)),
  ].filter((item) => !hiddenIds.includes(item.id));

  const recommendations = getPersonalizedRecommendations(
    catalog,
    {
      viewedIds: viewedProducts.map((item) => item.id),
      wishlistIds: wishlistItems.map((item) => item.id),
      cartIds: cartItems.map((item) => item.id),
      orders: myOrders,
    }
  );

  return (
    <section
      aria-labelledby="personalized-title"
      className="mt-10 border-t pt-6"
    >
      <h2
        id="personalized-title"
        className="mb-4 text-2xl font-bold"
      >
        Recommended for you
      </h2>

      <p className="mb-4 text-sm text-gray-600">
        Based on browsing, wishlist and cart activity
        on this browser, plus your signed-in account&apos;s
        demo orders.
      </p>

      {storageError ? (
        <p role="alert">
          Unable to load saved preferences. Refresh to retry.
        </p>
      ) : !ready ? (
        <p role="status">Loading your preferences...</p>
      ) : !hasActivity ? (
        <p>
          View products or add favourites to get
          personalized recommendations.
        </p>
      ) : isPending ? (
        <p role="status">Loading recommendations...</p>
      ) : isError ? (
        <div role="alert">
          <p>Unable to load recommendations.</p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded border px-4 py-2"
          >
            Try again
          </button>
        </div>
      ) : recommendations.length === 0 ? (
        <p role="status">
          No new matching products yet. Explore more
          categories to discover recommendations.
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
      )}
    </section>
  );
}