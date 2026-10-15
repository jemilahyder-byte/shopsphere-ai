"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "../stores/authStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setError("");
    setBusy(true);

    try {
      const success = await login(email, password);

      if (success) {
        router.replace("/");
        return;
      }

      setError("Incorrect email or password.");
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>ShopSphere Login</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-sm">
            <p className="font-semibold">Demo accounts</p>
            <p>Customer: customer@shopsphere.demo</p>
            <p>Password: Customer123!</p>
            <p>Admin: admin@shopsphere.demo</p>
            <p>Password: Admin123!</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link href="/register" className="underline">
              Create account
            </Link>
            <Link href="/" className="underline">
              Back to shop
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}