"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "../stores/cartStore";
import { useProductStore } from "../stores/productStore";
import {
  getCartRecommendations,
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

export default function CartRecommendations() {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const items = useCartStore((state) => state.items);

  useEffect(() => {
    let active = true;

    async function loadCart() {
      try {
        if (!useCartStore.persist.hasHydrated()) {
          await useCartStore.persist.rehydrate();
        }

        if (active) {
          if (useCartStore.persist.hasHydrated()) {
            setReady(true);
          } else {
            setStorageError(true);
          }
        }
      } catch {
        if (active) {
          setStorageError(true);
        }
      }
    }

    void loadCart();

    return () => {
      active = false;
    };
  }, []);

  const {
    data: products = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["recommendations", "catalog"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
    enabled: ready && items.length > 0,
  });

  const customProducts = useProductStore(
    (state) => state.customProducts
  );
  const overrides = useProductStore(
    (state) => state.overrides
  );
  const hiddenIds = useProductStore(
    (state) => state.hiddenIds
  );

  const managedProducts = [
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

  const recommendations = getCartRecommendations(
    catalog,
    items.map((item) => item.id)
  );

  return (
    <section
      aria-labelledby="cart-recommendations-title"
      className="mt-10 border-t pt-6"
    >
      <h2
        id="cart-recommendations-title"
        className="mb-4 text-2xl font-bold"
      >
        Inspired by your cart
      </h2>

      {storageError ? (
        <p role="alert">
          Unable to load your cart. Refresh to retry.
        </p>
      ) : !ready ? (
        <p role="status">Loading your cart...</p>
      ) : items.length === 0 ? (
        <p>
          Add products to your cart to get recommendations.
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
          No additional products found in your cart
          categories.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            More products from your cart categories.
            Products already in your cart are excluded.
          </p>

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
        </>
      )}
    </section>
  );
}