"use client";

import Link from "next/link";
import RequireAuth from "../components/RequireAuth";
import { useAuthStore } from "../stores/authStore";
import { useOrderStore } from "../stores/orderStore";

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);
  const myOrders = orders.filter(
    (order) => order.userEmail === user?.email
  );

  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

        {myOrders.length === 0 ? (
          <p>
            No orders yet.{" "}
            <Link href="/" className="underline">
              Continue shopping
            </Link>
          </p>
        ) : (
          myOrders.map((order) => (
            <article
              key={order.id}
              className="mb-6 rounded border p-5"
            >
              <h2 className="break-all font-bold">
                Order: {order.id}
              </h2>
              <p>Status: {order.status}</p>
              <p>
                Date: {new Date(order.createdAt).toLocaleString()}
              </p>

              <ul className="my-4 space-y-2">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.name} × {item.quantity} — USD $
                    {(item.price * item.quantity).toFixed(2)}
                  </li>
                ))}
              </ul>

              <p className="font-bold">
                Total: USD ${order.total.toFixed(2)}
              </p>
              <p className="mt-3">
                Deliver to: {order.delivery.fullName}
              </p>
              <p>
                {order.delivery.address}, {order.delivery.city},{" "}
                {order.delivery.postalCode}
              </p>
              <p className="mt-3 text-sm">
                Demo order — no payment taken.
              </p>
            </article>
          ))
        )}
      </main>
    </RequireAuth>
  );
}