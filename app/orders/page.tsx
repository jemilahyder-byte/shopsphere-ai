import RequireAuth from "../components/RequireAuth";

export default function OrdersPage() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="mt-4">
          Your order history will appear here after checkout.
        </p>
      </main>
    </RequireAuth>
  );
}