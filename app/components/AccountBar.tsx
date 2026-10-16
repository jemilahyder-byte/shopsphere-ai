"use client";

import Link from "next/link";
import { useAuthStore } from "../stores/authStore";

export default function AccountBar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <nav
      aria-label="Main navigation"
      className="flex flex-wrap items-center justify-between gap-4 p-4"
    >
      <Link href="/" className="font-bold">
        ShopSphere AI
      </Link>

      {user ? (
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/checkout" className="underline">
            Checkout
          </Link>

          <Link href="/orders" className="underline">
            My Orders
          </Link>

          {user.role === "admin" && (
            <Link href="/admin" className="underline">
              Admin
            </Link>
          )}

          <span>{user.name}</span>

          <button
            type="button"
            onClick={logout}
            className="rounded border px-3 py-2"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/login" className="underline">
            Log in
          </Link>

          <Link href="/register" className="underline">
            Create account
          </Link>
        </div>
      )}
    </nav>
  );
}