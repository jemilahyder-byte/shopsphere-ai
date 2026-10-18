"use client";

import Link from "next/link";
import { useWishlistStore } from "../stores/wishlistStore";

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.removeItem);

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/" className="underline">
        Back to shop
      </Link>

      <h1 className="mt-6 text-3xl font-bold">My Wishlist</h1>

      <p className="mt-3" role="status">
        {items.length} {items.length === 1 ? "product" : "products"} saved
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded border p-6">
          <p>Your wishlist is empty.</p>

          <Link
            href="/"
            className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-white"
          >
            Explore products
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((product) => (
            <article
              key={product.id}
              className="min-w-0 rounded border p-5"
            >
              <Link href={"/products/" + product.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  width={300}
                  height={200}
                  loading="lazy"
                  className="mb-4 h-48 w-full rounded object-contain"
                />

                <h2 className="break-words text-lg font-semibold underline">
                  {product.name}
                </h2>
              </Link>

              <p className="mt-2">
                USD ${product.price.toFixed(2)}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={"/products/" + product.id}
                  className="rounded bg-blue-600 px-4 py-2 text-white"
                >
                  View product
                </Link>

                <button
                  type="button"
                  onClick={() => removeItem(product.id)}
                  aria-label={"Remove " + product.name + " from wishlist"}
                  className="rounded border px-4 py-2"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}