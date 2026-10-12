"use client";

import { useState } from "react";
import { useCartStore } from "../stores/cartStore";

const products = [
  { id: 1, name: "Wireless Headphones", price: 1499 },
  { id: 2, name: "Smart Watch", price: 2499 },
  { id: 3, name: "Laptop Backpack", price: 899 },
  { id: 4, name: "Bluetooth Speaker", price: 1299 },
];

export default function ProductList() {
  const [search, setSearch] = useState("");
  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  const count = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const filtered = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <article
            key={product.id}
            className="rounded border p-5"
          >
            <h3 className="text-lg font-semibold">
              {product.name}
            </h3>

            <p className="mt-2">₹{product.price}</p>

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

      {filtered.length === 0 && <p>No products found.</p>}
    </section>
  );
}