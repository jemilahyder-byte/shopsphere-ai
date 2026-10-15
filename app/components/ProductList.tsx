"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "../stores/cartStore";

type Product = {
  id: number;
  name: string;
  price: number;
};

type ApiProduct = {
  id: number;
  title: string;
  price: number;
};

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(
    "https://dummyjson.com/products?limit=100"
  );

  if (!response.ok) {
    throw new Error("Unable to load products");
  }

  const data: { products: ApiProduct[] } = await response.json();

  return data.products.map((product) => ({
    id: product.id,
    name: product.title,
    price: product.price,
  }));
}

export default function ProductList() {
  const [search, setSearch] = useState("");
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  const {
    data: products = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });

  const count = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  if (isPending) {
    return (
      <p role="status" className="mt-8">
        Loading products...
      </p>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="mt-8">
        <p>Unable to load products. Check your internet connection.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded border px-4 py-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold">Featured Products</h2>

      <p className="mt-3" aria-live="polite">
        Cart: {count} {count === 1 ? "item" : "items"}
      </p>

      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="my-4 w-full rounded border p-3"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((product) => (
          <article key={product.id} className="rounded border p-5">
            <h3 className="text-lg font-semibold">
              {product.name}
            </h3>

            <p className="mt-2">
              USD ${product.price.toFixed(2)}
            </p>

            <button
              type="button"
              onClick={() => addItem(product)}
              className="mt-3 rounded bg-blue-600 px-4 py-2 text-white"
            >
              Add to Cart
            </button>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-4" role="status">
          No products found.
        </p>
      )}
    </section>
  );
}