"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RequireAuth from "../components/RequireAuth";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useOrderStore } from "../stores/orderStore";
import { calculateCartTotals } from "../stores/cartTotals";

export default function CheckoutPage() {
  const router = useRouter();
  const submitting = useRef(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);

  const totals = calculateCartTotals(items, couponCode);

  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-6 text-2xl font-bold">
          Checkout
        </h1>

        {items.length === 0 ? (
          <p>
            Your cart is empty.{" "}
            <Link href="/" className="underline">
              Continue shopping
            </Link>
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="mb-4 text-xl font-bold">
                Delivery details
              </h2>

              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();

                  if (submitting.current) return;

                  const currentUser =
                    useAuthStore.getState().user;
                  const cart = useCartStore.getState();

                  if (!currentUser || cart.items.length === 0) {
                    setError(
                      "Please sign in and add items to your cart."
                    );
                    return;
                  }

                  const form = new FormData(event.currentTarget);
                  const value = (name: string) =>
                    String(form.get(name) ?? "").trim();

                  const delivery = {
                    fullName: value("fullName"),
                    email: value("email"),
                    phone: value("phone"),
                    address: value("address"),
                    city: value("city"),
                    postalCode: value("postalCode"),
                  };

                  if (
                    Object.values(delivery).some(
                      (field) => field.length === 0
                    )
                  ) {
                    setError("Please complete every delivery field.");
                    return;
                  }

                  const orderItems = cart.items.map(
                    (item) => ({ ...item })
                  );
                  const orderCoupon = cart.couponCode;
                  const cartSnapshot = JSON.stringify({
                    items: orderItems,
                    couponCode: orderCoupon,
                  });

                  submitting.current = true;
                  setPlacingOrder(true);
                  setError("");

                  try {
                    const pricing = calculateCartTotals(
                      orderItems,
                      orderCoupon
                    );

                    if (!pricing.couponValid) {
                      throw new Error(
                        "Invalid coupon. Return to your cart."
                      );
                    }

                    const productIds = [
                      ...new Set(orderItems.map((item) => item.id)),
                    ];

                    await Promise.all(
                      productIds.map(async (id) => {
                        const response = await fetch(
                          "https://dummyjson.com/products/" + id,
                          { cache: "no-store" }
                        );

                        if (!response.ok) {
                          throw new Error(
                            "Unable to confirm stock. Return to your cart and retry."
                          );
                        }

                        const product = await response.json();

                        if (
                          product.id !== id ||
                          !Number.isInteger(product.stock) ||
                          product.stock < 0
                        ) {
                          throw new Error(
                            "Invalid stock information. Please retry."
                          );
                        }

                        const quantity = orderItems
                          .filter((item) => item.id === id)
                          .reduce(
                            (sum, item) => sum + item.quantity,
                            0
                          );

                        if (
                          product.stock === 0 ||
                          quantity > product.stock
                        ) {
                          const item = orderItems.find(
                            (entry) => entry.id === id
                          );

                          throw new Error(
                            (item?.name ?? "A product") +
                              ": only " +
                              product.stock +
                              " available. Update your cart."
                          );
                        }
                      })
                    );

                    const latestCart = useCartStore.getState();
                    const latestUser =
                      useAuthStore.getState().user;

                    if (
                      latestUser?.email !== currentUser.email
                    ) {
                      throw new Error(
                        "Your sign-in changed. Please retry."
                      );
                    }

                    if (
                      JSON.stringify({
                        items: latestCart.items,
                        couponCode: latestCart.couponCode,
                      }) !== cartSnapshot
                    ) {
                      throw new Error(
                        "Your cart changed. Review the updated total and retry."
                      );
                    }

                    useOrderStore.getState().placeOrder(
                      currentUser.email,
                      orderItems,
                      delivery,
                      orderCoupon
                    );

                    useCartStore.getState().clearCart();
                    router.push("/orders");
                  } catch (caught) {
                    setError(
                      caught instanceof Error
                        ? caught.message
                        : "Unable to place your order. Please retry."
                    );
                  } finally {
                    submitting.current = false;
                    setPlacingOrder(false);
                  }
                }}
              >
                <fieldset
                  disabled={placingOrder}
                  className="space-y-4"
                >
                  <label className="block">
                    Full name
                    <input
                      name="fullName"
                      autoComplete="name"
                      required
                      className="mt-1 w-full rounded border p-3"
                    />
                  </label>

                  <label className="block">
                    Email
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      defaultValue={user?.email ?? ""}
                      required
                      className="mt-1 w-full rounded border p-3"
                    />
                  </label>

                  <label className="block">
                    Phone
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      required
                      className="mt-1 w-full rounded border p-3"
                    />
                  </label>

                  <label className="block">
                    Address
                    <textarea
                      name="address"
                      autoComplete="street-address"
                      required
                      className="mt-1 w-full rounded border p-3"
                    />
                  </label>

                  <label className="block">
                    City
                    <input
                      name="city"
                      autoComplete="address-level2"
                      required
                      className="mt-1 w-full rounded border p-3"
                    />
                  </label>

                  <label className="block">
                    Postal code
                    <input
                      name="postalCode"
                      autoComplete="postal-code"
                      required
                      className="mt-1 w-full rounded border p-3"
                    />
                  </label>

                  <p className="text-sm">
                    Demo checkout — no payment will be taken.
                    Stock is checked before placing your order.
                  </p>

                  {error && (
                    <p role="alert" className="text-red-700">
                      {error}
                    </p>
                  )}

                  {!totals.couponValid && (
                    <p role="alert" className="text-red-700">
                      Invalid coupon. Return to your cart
                      and remove it.
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      placingOrder || !totals.couponValid
                    }
                    className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-40"
                  >
                    {placingOrder
                      ? "Checking stock..."
                      : "Place Demo Order"}
                  </button>
                </fieldset>
              </form>
            </section>

            <section className="self-start rounded border p-5">
              <h2 className="mb-4 text-xl font-bold">
                Order summary
              </h2>

              {items.map((item) => (
                <div
                  key={JSON.stringify([
                    item.id,
                    item.size,
                    item.colour,
                  ])}
                  className="mb-3 border-b pb-3"
                >
                  <p className="font-semibold">
                    {item.name}
                  </p>

                  {item.size && <p>Size: {item.size}</p>}
                  {item.colour && (
                    <p>Colour: {item.colour}</p>
                  )}

                  <p>Quantity: {item.quantity}</p>
                  <p>
                    USD $
                    {(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="space-y-2">
                <p>
                  Subtotal: USD $
                  {totals.subtotal.toFixed(2)}
                </p>

                <p>
                  Discount: −USD $
                  {totals.discount.toFixed(2)}
                </p>

                {totals.couponCode && (
                  <p>Coupon: {totals.couponCode}</p>
                )}

                <p>
                  Shipping: USD $
                  {totals.shipping.toFixed(2)}
                </p>

                <p>
                  Demo tax (5%): USD $
                  {totals.tax.toFixed(2)}
                </p>

                <p className="border-t pt-3 text-xl font-bold">
                  Total: USD ${totals.total.toFixed(2)}
                </p>
              </div>

              <p className="mt-3 text-sm text-gray-600">
                Demo pricing: shipping is $5, or free
                when products after discount total at
                least $100. Demo tax is 5% of products
                after discount.
              </p>

              <Link
                href="/cart"
                className="mt-4 block underline"
              >
                Back to Cart
              </Link>
            </section>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}