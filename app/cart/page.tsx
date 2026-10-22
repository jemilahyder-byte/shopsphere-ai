"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import { useCartStore } from "../stores/cartStore";
import { calculateCartTotals } from "../stores/cartTotals";

export default function CartPage() {
  const [message, setMessage] = useState("");
  const [couponInput, setCouponInput] = useState("");

  const items = useCartStore((state) => state.items);
  const savedItems = useCartStore((state) => state.savedItems);
  const couponCode = useCartStore((state) => state.couponCode);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore(
    (state) => state.updateQuantity
  );
  const saveForLater = useCartStore(
    (state) => state.saveForLater
  );
  const moveToCart = useCartStore((state) => state.moveToCart);
  const removeSavedItem = useCartStore(
    (state) => state.removeSavedItem
  );

  const totals = calculateCartTotals(items, couponCode);

  const productIds = [
    ...new Set(
      [...items, ...savedItems].map((item) => item.id)
    ),
  ];

  const stockQueries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: ["cart-stock", id],
      queryFn: async (): Promise<{
        id: number;
        stock: number;
      }> => {
        const response = await fetch(
          "https://dummyjson.com/products/" + id
        );

        if (!response.ok) {
          throw new Error("Unable to check stock.");
        }

        const product = await response.json();

        if (
          product.id !== id ||
          !Number.isInteger(product.stock) ||
          product.stock < 0
        ) {
          throw new Error("Invalid stock information.");
        }

        return {
          id: product.id,
          stock: product.stock,
        };
      },
      staleTime: 0,
    })),
  });

  function getStock(id: number): number | undefined {
    const query = stockQueries[productIds.indexOf(id)];

    if (!query?.isSuccess || query.isFetching) {
      return undefined;
    }

    return query.data.stock;
  }

  function quantityForProduct(id: number) {
    return items
      .filter((item) => item.id === id)
      .reduce((sum, item) => sum + item.quantity, 0);
  }

  function canAdd(id: number, quantity: number) {
    const stock = getStock(id);

    return (
      Number.isInteger(quantity) &&
      quantity > 0 &&
      stock !== undefined &&
      quantityForProduct(id) + quantity <= stock
    );
  }

  function stockMessage(id: number) {
    const query = stockQueries[productIds.indexOf(id)];

    if (!query || query.isPending || query.isFetching) {
      return "Checking stock...";
    }

    if (query.isError || !query.data) {
      return "Unable to check stock. Click Refresh stock.";
    }

    if (query.data.stock === 0) {
      return "Out of stock.";
    }

    if (quantityForProduct(id) > query.data.stock) {
      return (
        "Only " +
        query.data.stock +
        " available. Reduce your cart quantity."
      );
    }

    return "In stock: " + query.data.stock;
  }

  const checkingStock = stockQueries.some(
    (query) => query.isPending || query.isFetching
  );

  const canCheckout =
    items.length > 0 &&
    totals.couponValid &&
    items.every((item) => {
      const stock = getStock(item.id);

      return (
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        stock !== undefined &&
        stock > 0 &&
        quantityForProduct(item.id) <= stock
      );
    });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-4 text-3xl font-bold">
        Your Cart
      </h1>

      <Link href="/" className="underline">
        Continue shopping
      </Link>

      <p role="status" className="my-4">
        {message}
      </p>

      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          {items.map((item) => (
            <div
              key={JSON.stringify([
                item.id,
                item.size,
                item.colour,
              ])}
              className="mb-4 rounded border p-4"
            >
              <h2 className="font-bold">
                <Link
                  href={"/products/" + item.id}
                  className="underline"
                >
                  {item.name}
                </Link>
              </h2>

              {item.size && <p>Size: {item.size}</p>}
              {item.colour && (
                <p>Colour: {item.colour}</p>
              )}

              <p>Price: USD ${item.price.toFixed(2)}</p>

              <p className="mt-2 text-sm">
                {stockMessage(item.id)}
              </p>

              <div className="my-3 flex items-center gap-3">
                <span>Quantity:</span>

                <button
                  type="button"
                  aria-label={
                    "Decrease quantity of " + item.name
                  }
                  disabled={item.quantity <= 1}
                  onClick={() => {
                    updateQuantity(
                      item.id,
                      item.quantity - 1,
                      item.size,
                      item.colour
                    );
                    setMessage("");
                  }}
                  className="rounded border px-3 py-1 disabled:opacity-40"
                >
                  −
                </button>

                <span>{item.quantity}</span>

                <button
                  type="button"
                  aria-label={
                    "Increase quantity of " + item.name
                  }
                  disabled={!canAdd(item.id, 1)}
                  onClick={() => {
                    if (!canAdd(item.id, 1)) return;

                    updateQuantity(
                      item.id,
                      item.quantity + 1,
                      item.size,
                      item.colour
                    );
                    setMessage("");
                  }}
                  className="rounded border px-3 py-1 disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <p>
                Subtotal: USD $
                {(item.price * item.quantity).toFixed(2)}
              </p>

              <div className="mt-3 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => {
                    removeItem(
                      item.id,
                      item.size,
                      item.colour
                    );
                    setMessage("Item removed from cart.");
                  }}
                  className="text-red-700 underline"
                >
                  Remove
                </button>

                <button
                  type="button"
                  onClick={() => {
                    saveForLater(
                      item.id,
                      item.size,
                      item.colour
                    );
                    setMessage("Item saved for later.");
                  }}
                  className="text-blue-700 underline"
                >
                  Save for later
                </button>
              </div>
            </div>
          ))}

          <section className="my-6 rounded border p-4">
            <h2 className="mb-3 text-xl font-bold">
              Coupon
            </h2>

            <p className="mb-3 text-sm">
              Demo code SAVE10 gives 10% off products.
            </p>

            <form
              onSubmit={(event) => {
                event.preventDefault();

                const applied = applyCoupon(couponInput);

                setMessage(
                  applied
                    ? "SAVE10 applied: 10% off products."
                    : "Invalid coupon. Use SAVE10."
                );

                if (applied) {
                  setCouponInput("");
                }
              }}
              className="flex flex-wrap gap-3"
            >
              <label htmlFor="coupon" className="sr-only">
                Coupon code
              </label>

              <input
                id="coupon"
                value={couponInput}
                onChange={(event) =>
                  setCouponInput(event.target.value)
                }
                placeholder="Enter coupon code"
                required
                className="rounded border p-2"
              />

              <button
                type="submit"
                className="rounded bg-blue-700 px-4 py-2 text-white"
              >
                Apply coupon
              </button>
            </form>

            {couponCode && (
              <div className="mt-3">
                <p>Applied coupon: {couponCode}</p>

                <button
                  type="button"
                  onClick={() => {
                    removeCoupon();
                    setMessage("Coupon removed.");
                  }}
                  className="mt-2 text-red-700 underline"
                >
                  Remove coupon
                </button>
              </div>
            )}
          </section>

          <section className="mb-6 rounded border p-4">
            <h2 className="mb-3 text-xl font-bold">
              Cart summary
            </h2>

            <div className="space-y-2">
              <p>
                Subtotal: USD ${totals.subtotal.toFixed(2)}
              </p>

              <p>
                Discount: −USD ${totals.discount.toFixed(2)}
              </p>

              <p>
                Shipping: USD ${totals.shipping.toFixed(2)}
              </p>

              <p>
                Demo tax (5%): USD ${totals.tax.toFixed(2)}
              </p>

              <p className="border-t pt-3 text-xl font-bold">
                Total: USD ${totals.total.toFixed(2)}
              </p>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              Demo pricing: shipping is $5, or free when
              the product subtotal after discount is at
              least $100. Demo tax is 5% of products after
              discount.
            </p>
          </section>

          {canCheckout ? (
            <Link
              href="/checkout"
              className="inline-block rounded bg-blue-700 px-4 py-2 text-white"
            >
              Proceed to Checkout
            </Link>
          ) : (
            <div>
              <button
                type="button"
                disabled
                className="rounded bg-gray-400 px-4 py-2 text-white"
              >
                Proceed to Checkout
              </button>

              <p role="status" className="mt-2">
                Check stock and coupon messages before
                checkout.
              </p>
            </div>
          )}
        </>
      )}

      <section className="mt-8 border-t pt-6">
        <h2 className="mb-4 text-2xl font-bold">
          Saved for later
        </h2>

        {savedItems.length === 0 ? (
          <p>No saved items yet.</p>
        ) : (
          savedItems.map((item) => (
            <div
              key={JSON.stringify([
                item.id,
                item.size,
                item.colour,
              ])}
              className="mb-4 rounded border p-4"
            >
              <h3 className="font-bold">
                <Link
                  href={"/products/" + item.id}
                  className="underline"
                >
                  {item.name}
                </Link>
              </h3>

              {item.size && <p>Size: {item.size}</p>}
              {item.colour && (
                <p>Colour: {item.colour}</p>
              )}

              <p>Quantity: {item.quantity}</p>
              <p>Price: USD ${item.price.toFixed(2)}</p>

              <p className="mt-2 text-sm">
                {stockMessage(item.id)}
              </p>

              {!canAdd(item.id, item.quantity) && (
                <p className="mt-2 text-sm">
                  Enough stock must be confirmed to move
                  the full saved quantity.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-4">
                <button
                  type="button"
                  disabled={
                    !canAdd(item.id, item.quantity)
                  }
                  onClick={() => {
                    const stock = getStock(item.id);

                    if (stock === undefined) return;

                    const moved = moveToCart(
                      item.id,
                      stock,
                      item.size,
                      item.colour
                    );

                    setMessage(
                      moved
                        ? "Saved item moved to cart."
                        : "Not enough stock."
                    );
                  }}
                  className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-40"
                >
                  Move to cart
                </button>

                <button
                  type="button"
                  onClick={() => {
                    removeSavedItem(
                      item.id,
                      item.size,
                      item.colour
                    );
                    setMessage("Saved item removed.");
                  }}
                  className="text-red-700 underline"
                >
                  Remove saved item
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {productIds.length > 0 && (
        <button
          type="button"
          disabled={checkingStock}
          onClick={() => {
            stockQueries.forEach((query) => {
              void query.refetch();
            });
          }}
          className="mt-6 underline disabled:opacity-40"
        >
          {checkingStock
            ? "Checking stock..."
            : "Refresh stock"}
        </button>
      )}
    </main>
  );
}