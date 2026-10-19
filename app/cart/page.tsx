"use client";

import Link from "next/link";
import { useCartStore } from "../stores/cartStore";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-6 text-3xl font-bold">Your Cart</h1>

      {items.length === 0 ? (
        <p>
          Your cart is empty.{" "}
          <Link href="/" className="underline">
            Continue shopping
          </Link>
        </p>
      ) : (
        <>
          {items.map((item) => (
            <div key={item.id} className="mb-4 rounded border p-4">
              <h2 className="font-bold">{item.name}</h2>
              <p>Price: {item.price.toFixed(2)}</p>
              <p>Quantity: {item.quantity}</p>
              <p>
                Subtotal: {(item.price * item.quantity).toFixed(2)}
              </p>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="mt-2 text-red-700 underline"
              >
                Remove
              </button>
            </div>
          ))}

          <p className="mb-4 text-xl font-bold">
            Total: {total.toFixed(2)}
          </p>
          <Link
            href="/checkout"
            className="inline-block rounded bg-blue-700 px-4 py-2 text-white"
          >
            Proceed to Checkout
          </Link>
        </>
      )}
    </main>
  );
}