"use client";

import { useEffect, useState } from "react";
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

type ApiProduct = Omit<RecommendationProduct, "name"> & {
  title: string;
};

async function fetchProducts(): Promise<RecommendationProduct[]> {
  const response = await fetch("https://dummyjson.com/products?limit=0");
  if (!response.ok) throw new Error("Unable to load recommendations.");
  const data: { products: ApiProduct[] } = await response.json();
  return data.products.map((p) => ({
    id: p.id,
    name: p.title,
    price: p.price,
    thumbnail: p.thumbnail,
    category: p.category,
    rating: p.rating,
  }));
}

export default function FrequentlyBoughtTogether() {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const orders = useOrderStore((s) => s.orders);
  const customProducts = useProductStore((s) => s.customProducts);
  const overrides = useProductStore((s) => s.overrides);
  const hiddenIds = useProductStore((s) => s.hiddenIds);

  useEffect(() => {
    setMounted(true);
  }, []);

  const email = user?.email.trim().toLowerCase();
  const myOrders = email
    ? orders.filter((o) => o.userEmail.trim().toLowerCase() === email)
    : [];

  const { data: products = [], isPending, isError, refetch } = useQuery({
    queryKey: ["recommendations", "catalog"],
    queryFn: fetchProducts,
    staleTime: 300000,
    enabled: mounted && Boolean(email) && items.length > 0 && myOrders.length > 0,
  });

  const managed: RecommendationProduct[] = [
    ...customProducts,
    ...Object.values(overrides),
  ].map((p) => ({
    id: p.id,
    name: p.title,
    price: p.price,
    thumbnail: p.thumbnail,
    category: p.category,
    rating: p.rating,
  }));

  const managedIds = new Set(managed.map((p) => p.id));
  const catalog = [
    ...managed,
    ...products.filter((p) => !managedIds.has(p.id)),
  ].filter((p) => !hiddenIds.includes(p.id));

  const recommendations = getFrequentlyBoughtTogether(
    catalog,
    myOrders,
    items.map((p) => p.id)
  );

  let message = "";
  if (!mounted) message = "Loading...";
  else if (!email) message = "Sign in to see recommendations from your orders.";
  else if (!items.length) message = "Add a product to your cart to see matching items.";
  else if (!myOrders.length) message = "No previous demo orders available yet.";
  else if (isPending) message = "Loading recommendations...";
  else if (isError) message = "Unable to load recommendations.";
  else if (!recommendations.length) {
    message = "No matching purchases found. A cart product must have been ordered together with another product.";
  }

  return (
    <section aria-labelledby="bought-together-title" className="mt-10 border-t pt-6">
      <h2 id="bought-together-title" className="mb-4 text-2xl font-bold">
        Frequently bought together
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Based on products purchased together in your previous demo orders on this browser.
      </p>

      {message ? (
        <p role={isError ? "alert" : "status"}>{message}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((p) => (
            <article key={p.id} className="rounded border p-4">
              <Link href={"/products/" + p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.thumbnail}
                  alt={p.name}
                  width={240}
                  height={160}
                  loading="lazy"
                  className="mb-3 h-40 w-full object-contain"
                />
                <h3 className="font-semibold underline">{p.name}</h3>
              </Link>
              <p className="mt-2 capitalize">{p.category.replaceAll("-", " ")}</p>
              <p className="mt-2">USD ${p.price.toFixed(2)}</p>
              <p className="mt-2">Rating: {p.rating.toFixed(1)} / 5</p>
            </article>
          ))}
        </div>
      )}

      {mounted && email && items.length > 0 && myOrders.length > 0 && isError && (
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