"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  getCategoryRecommendations,
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

export default function CategoryRecommendations() {
  const [selectedCategory, setSelectedCategory] =
    useState("");

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

  const categories = Array.from(
    new Set(products.map((product) => product.category))
  ).sort();

  const category = selectedCategory || categories[0] || "";

  const recommendations = getCategoryRecommendations(
    products,
    category
  );

  return (
    <section
      aria-labelledby="category-recommendations-title"
      className="mt-10 border-t pt-6"
    >
      <h2
        id="category-recommendations-title"
        className="mb-4 text-2xl font-bold"
      >
        Recommended by category
      </h2>

      {isPending ? (
        <p role="status">Loading categories...</p>
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
      ) : categories.length === 0 ? (
        <p>No categories available.</p>
      ) : (
        <>
          <label
            htmlFor="recommendation-category"
            className="mb-2 block"
          >
            Choose a category
          </label>

          <select
            id="recommendation-category"
            value={category}
            onChange={(event) =>
              setSelectedCategory(event.target.value)
            }
            className="mb-4 w-full rounded border bg-white p-3 text-black"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item.replaceAll("-", " ")}
              </option>
            ))}
          </select>

          <p className="mb-4 text-sm text-gray-600">
            Products ranked by rating in your selected category.
          </p>

          {recommendations.length === 0 ? (
            <p role="status">
              No recommendations in this category.
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
        </>
      )}
    </section>
  );
}