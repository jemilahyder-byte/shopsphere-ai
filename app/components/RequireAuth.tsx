"use client";

import {
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../stores/authStore";

function subscribeToHydration(
  notify: () => void
): () => void {
  const unsubscribeStart =
    useAuthStore.persist.onHydrate(() => notify());

  const unsubscribeFinish =
    useAuthStore.persist.onFinishHydration(() => notify());

  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
}

function getHydrationSnapshot(): boolean {
  return useAuthStore.persist.hasHydrated();
}

function getServerSnapshot(): boolean {
  return false;
}

export default function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const ready = useSyncExternalStore(
    subscribeToHydration,
    getHydrationSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <p role="status" className="p-6">
        Checking login...
      </p>
    );
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">
          Access denied
        </h1>

        <p className="mt-3">
          This page is available to admins only.
        </p>

        <Link
          href="/"
          className="mt-4 inline-block underline"
        >
          Back to shop
        </Link>
      </main>
    );
  }

  return <>{children}</>;
}