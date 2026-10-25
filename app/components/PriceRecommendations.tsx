"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  getPriceRecommendations,
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

export default function PriceRecommendations() {
  const [budget, setBudget] = useState("50");

  const {
    data: products = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["recommendations", "catalog"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });

  const maxPrice = Number(budget);

  const validBudget =
    budget.trim() !== "" &&
    Number.isFinite(maxPrice) &&
    maxPrice >= 0;

  const recommendations = validBudget
    ? getPriceRecommendations(products, maxPrice)
    : [];

  return (
    <section
      aria-labelledby="price-recommendations-title"
      className="mt-10 border-t pt-6"
    >
      <h2
        id="price-recommendations-title"
        className="mb-4 text-2xl font-bold"
      >
        Recommended within your budget
      </h2>

      <label
        htmlFor="recommendation-budget"
        className="mb-2 block"
      >
        Maximum budget (USD)
      </label>

      <input
        id="recommendation-budget"
        type="number"
        min="0"
        step="0.01"
        value={budget}
        onChange={(event) =>
          setBudget(event.target.value)
        }
        aria-invalid={!validBudget}
        className="mb-4 w-full rounded border p-3"
      />

      {!validBudget ? (
        <p role="status">
          Enter a budget of zero or more.
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
          No products found within this budget.
        </p>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-600">
            Products within your budget, ranked by rating.
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