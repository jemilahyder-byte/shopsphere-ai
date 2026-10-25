"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useOrderStore } from "../stores/orderStore";
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
  const [mounted, setMounted] = useState(false);

  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const orders = useOrderStore((state) => state.orders);

  useEffect(() => {
    setMounted(true);
  }, []);

  const email = user?.email.trim().toLowerCase();

  const myOrders = email
    ? orders.filter(
        (order) =>
          order.userEmail.trim().toLowerCase() === email
      )
    : [];

  const {
    data: products = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["recommendations", "catalog"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
    enabled:
      mounted &&
      Boolean(email) &&
      items.length > 0 &&
      myOrders.length > 0,
  });

  const recommendations = getFrequentlyBoughtTogether(
    products,
    myOrders,
    items.map((item) => item.id)
  );

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

      {!mounted ? (
        <p role="status">Loading...</p>
      ) : !email ? (
        <p>Sign in to see recommendations from your orders.</p>
      ) : items.length === 0 ? (
        <p>Add a product to your cart to see matching items.</p>
      ) : myOrders.length === 0 ? (
        <p>No previous demo orders available yet.</p>
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
          No matching purchases found. Recommendations
          appear when a cart product was previously
          ordered together with another product.
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