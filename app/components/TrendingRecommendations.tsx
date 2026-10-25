"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useOrderStore } from "../stores/orderStore";
import {
  getTrendingRecommendations,
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

export default function TrendingRecommendations() {
  const [now, setNow] = useState<number | null>(null);
  const orders = useOrderStore((state) => state.orders);

  useEffect(() => {
    setNow(Date.now());

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => window.clearInterval(timer);
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
    enabled: now !== null && orders.length > 0,
  });

  const recommendations =
    now === null
      ? []
      : getTrendingRecommendations(
          products,
          orders,
          6,
          now
        );

  return (
    <section
      aria-labelledby="trending-title"
      className="mt-10 border-t pt-6"
    >
      <h2
        id="trending-title"
        className="mb-4 text-2xl font-bold"
      >
        Trending in demo orders
      </h2>

      <p className="mb-4 text-sm text-gray-600">
        Ranked by quantities ordered during the last
        30 days on this browser. This is demo activity,
        not live market data.
      </p>

      {now === null ? (
        <p role="status">Loading...</p>
      ) : orders.length === 0 ? (
        <p>No demo orders available yet.</p>
      ) : isPending ? (
        <p role="status">Loading trending products...</p>
      ) : isError ? (
        <div role="alert">
          <p>Unable to load trending products.</p>

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
          No matching products from demo orders in the
          last 30 days.
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