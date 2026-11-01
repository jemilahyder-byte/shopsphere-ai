"use client";

import {
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import RequireAuth from "../components/RequireAuth";
import AddressManager from "../components/AddressManager";
import RecommendationPreferences from "../components/RecommendationPreferences";
import { useAuthStore } from "../stores/authStore";
import { useOrderStore } from "../stores/orderStore";

function subscribeToHydration(
  notify: () => void
): () => void {
  const subscriptions = [
    useOrderStore.persist.onHydrate(() => notify()),
    useOrderStore.persist.onFinishHydration(() => notify()),
  ];

  return () => {
    subscriptions.forEach((unsubscribe) => unsubscribe());
  };
}

function getHydrationSnapshot(): boolean {
  return useOrderStore.persist.hasHydrated();
}

function getServerSnapshot(): boolean {
  return false;
}

function ProfileForm() {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore(
    (state) => state.updateProfile
  );

  const [name, setName] = useState(user?.name ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!user) return null;

  return (
    <section className="mt-6 rounded border p-5">
      <h2 className="text-xl font-bold">
        My profile
      </h2>

      <p className="mt-2 break-all">
        Email: {user.email}
      </p>

      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          setMessage("");
          setError("");

          try {
            updateProfile(name);
            setName(name.trim());
            setMessage("Profile updated.");
          } catch (problem) {
            setError(
              problem instanceof Error
                ? problem.message
                : "Unable to update profile."
            );
          }
        }}
      >
        <label
          htmlFor="profile-name"
          className="block"
        >
          Name
        </label>

        <input
          id="profile-name"
          autoComplete="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setMessage("");
            setError("");
          }}
          minLength={2}
          maxLength={100}
          required
          className="w-full rounded border p-3"
        />

        <button
          type="submit"
          className="rounded bg-blue-700 px-4 py-2 text-white"
        >
          Save profile
        </button>

        {message && (
          <p role="status">{message}</p>
        )}

        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);

  const ready = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerSnapshot
  );

  if (!ready || !user) {
    return (
      <p role="status" className="p-6">
        Loading dashboard...
      </p>
    );
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

      <p className="mt-4 text-xl">
        Welcome, {user.name}
      </p>

      <ProfileForm key={email} />

      <AddressManager />

      <RecommendationPreferences />

      <p className="mt-4 text-sm text-gray-600">
        Demo orders saved in this browser.
        Spending includes shipping and tax.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <section className="rounded border p-5">
          <h2 className="font-semibold">
            My orders
          </h2>

          <p className="mt-2 text-2xl">
            {myOrders.length}
          </p>
        </section>

        <section className="rounded border p-5">
          <h2 className="font-semibold">
            Active orders
          </h2>

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