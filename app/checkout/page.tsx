"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import RequireAuth from "../components/RequireAuth";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useOrderStore } from "../stores/orderStore";

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const placeOrder = useOrderStore((state) => state.placeOrder);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

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
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!user || items.length === 0) return;

                  const form = new FormData(event.currentTarget);
                  const value = (name: string) =>
                    String(form.get(name) ?? "").trim();

                  placeOrder(user.email, items, {
                    fullName: value("fullName"),
                    email: value("email"),
                    phone: value("phone"),
                    address: value("address"),
                    city: value("city"),
                    postalCode: value("postalCode"),
                  });

                  clearCart();
                  router.push("/orders");
                }}
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
                </p>

                <button
                  type="submit"
                  className="rounded bg-blue-700 px-4 py-2 text-white"
                >
                  Place Demo Order
                </button>
              </form>
            </section>

            <section className="rounded border p-5">
              <h2 className="mb-4 text-xl font-bold">
                Order summary
              </h2>

              {items.map((item) => (
                <div key={item.id} className="mb-3 border-b pb-3">
                  <p>{item.name}</p>
                  <p>Quantity: {item.quantity}</p>
                  <p>
                    USD ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}

              <p className="mt-4 text-xl font-bold">
                Total: USD ${total.toFixed(2)}
              </p>

              <Link href="/cart" className="mt-4 block underline">
                Back to Cart
              </Link>
            </section>
          </div>
        )}
      </main>
    </RequireAuth>
  );
}
