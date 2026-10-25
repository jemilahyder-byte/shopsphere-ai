"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import RequireAuth from "../components/RequireAuth";
import { useAuthStore } from "../stores/authStore";
import { useOrderStore } from "../stores/orderStore";

function DashboardContent() {
  const [ready, setReady] = useState(false);

  const user = useAuthStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || !user) {
    return <p className="p-6">Loading dashboard...</p>;
  }

  const email = user.email.trim().toLowerCase();

  const myOrders = orders
    .filter(
      (order) =>
        order.userEmail.trim().toLowerCase() === email
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  const totalSpent = myOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const activeOrders = myOrders.filter(
    (order) => order.status !== "Delivered"
  ).length;

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/" className="underline">
        Back to shop
      </Link>

      <h1 className="mt-6 text-3xl font-bold">
        My Dashboard
      </h1>

      <section className="mt-6 rounded border p-5">
        <h2 className="text-xl font-bold">
          Welcome, {user.name}
        </h2>
        <p className="mt-2 break-all">{user.email}</p>
      </section>

      <p className="mt-4 text-sm text-gray-600">
        Demo orders saved in this browser.
        Spending includes shipping and tax.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <section className="rounded border p-5">
          <h2 className="font-semibold">My orders</h2>
          <p className="mt-2 text-2xl">
            {myOrders.length}
          </p>
        </section>

        <section className="rounded border p-5">
          <h2 className="font-semibold">Active orders</h2>
          <p className="mt-2 text-2xl">
            {activeOrders}
          </p>
        </section>

        <section className="rounded border p-5">
          <h2 className="font-semibold">
            Demo spending
          </h2>
          <p className="mt-2 text-2xl">
            USD ${totalSpent.toFixed(2)}
          </p>
        </section>
      </div>

      <nav
        aria-label="My account"
        className="mt-6 flex flex-wrap gap-5"
      >
        <Link href="/orders" className="underline">
          My Orders and Tracking
        </Link>

        <Link href="/wishlist" className="underline">
          Wishlist
        </Link>
      </nav>

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-bold">
          Recent orders
        </h2>

        {myOrders.length === 0 ? (
          <p>No orders yet. Start shopping!</p>
        ) : (
          myOrders.slice(0, 3).map((order) => (
            <article
              key={order.id}
              className="mb-4 rounded border p-5"
            >
              <h3 className="break-all font-semibold">
                Order: {order.id}
              </h3>

              <p className="mt-2">
                Date:{" "}
                {new Date(
                  order.createdAt
                ).toLocaleDateString()}
              </p>

              <p>Status: {order.status}</p>

              <p>
                Total: USD ${order.total.toFixed(2)}
              </p>

              <Link
                href="/orders"
                className="mt-3 inline-block underline"
              >
                View orders and tracking
              </Link>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}