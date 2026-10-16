"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../stores/authStore";

export default function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setReady(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setReady(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return <p role="status" className="p-6">Checking login...</p>;
  }

  if (adminOnly && user.role !== "admin") {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="mt-3">This page is available to admins only.</p>
        <Link href="/" className="mt-4 inline-block underline">
          Back to shop
        </Link>
      </main>
    );
  }
  return<>{children}</>;
}