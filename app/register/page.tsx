"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../stores/authStore";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await register(name, email, password);
      router.replace("/");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Registration failed."
      );
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "mt-1 w-full rounded border p-3";

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-4 text-2xl font-bold">Create account</h1>
      <p className="mb-6 text-sm">
        Demo account saved in this browser. Use a test password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password">Password (at least 8 characters)</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            minLength={8}
            required
            className={inputClass}
          />
        </div>

        {error && <p role="alert" className="text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-blue-600 p-3 text-white disabled:opacity-50"
        >
          {busy ? "Creating account..." : "Create account"}
        </button>
      </form>

      <Link href="/login" className="mt-6 inline-block underline">
        Already have an account? Log in
      </Link>
    </main>
  );
}