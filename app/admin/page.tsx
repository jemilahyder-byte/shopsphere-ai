"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "../components/RequireAuth";
import {
  ORDER_STATUSES,
  useOrderStore,
  type OrderStatus,
} from "../stores/orderStore";

function AdminContent() {
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  const orders = useOrderStore((state) => state.orders);
  const updateOrderStatus = useOrderStore(
    (state) => state.updateOrderStatus
  );

  useEffect(() => {
    setReady(true);
  }, []);

  function changeStatus(
    orderId: string,
    status: OrderStatus
  ) {
    try {
      updateOrderStatus(orderId, status);
      setMessage("Order status updated to " + status + ".");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update order."
      );
    }
  }

  if (!ready) {
    return <p role="status">Loading dashboard...</p>;
  }

  const totalSales = orders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const customerCount = new Set(
    orders.map((order) =>
      order.userEmail.trim().toLowerCase()
    )
  ).size;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <Link href="/" className="underline">
        Back to shop
      </Link>

      <h1 className="mt-4 text-3xl font-bold">
        Admin Dashboard
      </h1>

      <p className="mt-3 text-gray-600">
        Demo orders saved on this browser.
        Sales totals include shipping and tax.
        Status updates simulate delivery progress.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <section className="rounded border p-4">
          <h2 className="font-semibold">Orders</h2>
          <p className="mt-2 text-2xl">{orders.length}</p>
        </section>

        <section className="rounded border p-4">
          <h2 className="font-semibold">
            Customers with orders
          </h2>
          <p className="mt-2 text-2xl">{customerCount}</p>
        </section>

        <section className="rounded border p-4">
          <h2 className="font-semibold">Demo sales total</h2>
          <p className="mt-2 text-2xl">
            USD ${totalSales.toFixed(2)}
          </p>
        </section>
      </div>

      <h2 className="mt-8 text-2xl font-bold">
        Order management
      </h2>

      <p role="status" className="mt-3">
        {message}
      </p>

      {orders.length === 0 ? (
        <p className="mt-4">No demo orders yet.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {orders.map((order) => {
            const currentIndex =
              ORDER_STATUSES.indexOf(order.status);

            const nextStatus =
              currentIndex >= 0
                ? ORDER_STATUSES[currentIndex + 1]
                : undefined;

            return (
              <article
                key={order.id}
                className="rounded border p-4"
              >
                <h3 className="break-all font-semibold">
                  Order: {order.id}
                </h3>

                <p className="mt-2 break-all">
                  Customer: {order.userEmail}
                </p>

                <p className="mt-2">
                  Placed:{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </p>

                <p className="mt-2 font-semibold">
                  Status: {order.status}
                </p>

                {order.statusUpdatedAt && (
                  <p className="mt-2">
                    Last updated:{" "}
                    {new Date(
                      order.statusUpdatedAt
                    ).toLocaleString()}
                  </p>
                )}

                <p className="mt-2 capitalize">
                  Delivery:{" "}
                  {order.deliveryMethod ?? "standard"}
                </p>

                <ul className="mt-3 list-disc space-y-1 pl-5">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.name} × {item.quantity}
                      {item.size
                        ? " — Size: " + item.size
                        : ""}
                      {item.colour
                        ? " — Colour: " + item.colour
                        : ""}
                    </li>
                  ))}
                </ul>

                <p className="mt-3 font-semibold">
                  Total: USD ${order.total.toFixed(2)}
                </p>

                {nextStatus && (
                  <button
                    type="button"
                    onClick={() =>
                      changeStatus(order.id, nextStatus)
                    }
                    aria-label={
                      "Mark order " +
                      order.id +
                      " as " +
                      nextStatus
                    }
                    className="mt-4 rounded bg-blue-600 px-4 py-2 text-white"
                  >
                    Mark as {nextStatus}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <AdminContent />
    </RequireAuth>
  );
}