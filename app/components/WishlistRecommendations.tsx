"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useWishlistStore } from "../stores/wishlistStore";
import {
  getWishlistRecommendations,
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

export default function WishlistRecommendations() {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const items = useWishlistStore((state) => state.items);

  useEffect(() => {
    let active = true;

    async function loadWishlist() {
      try {
        if (!useWishlistStore.persist.hasHydrated()) {
          await useWishlistStore.persist.rehydrate();
        }

        if (active) {
          if (useWishlistStore.persist.hasHydrated()) {
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

    void loadWishlist();

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

  const recommendations = getWishlistRecommendations(
    products,
    items.map((item) => item.id)
  );

  return (
    <section
      aria-labelledby="wishlist-recommendations-title"
      className="mt-10 border-t pt-6"
    >
      <h2
        id="wishlist-recommendations-title"
        className="mb-4 text-2xl font-bold"
      >
        Inspired by your wishlist
      </h2>

      {storageError ? (
        <p role="alert">
          Unable to load your wishlist. Refresh to retry.
        </p>
      ) : !ready ? (
        <p role="status">Loading your wishlist...</p>
      ) : items.length === 0 ? (
        <p>
          Add products to your wishlist to get
          recommendations.{" "}
          <Link href="/wishlist" className="underline">
            View wishlist
          </Link>
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
          No additional products found in your wishlist
          categories.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            More products from your wishlist categories.
            Products already saved are excluded.
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