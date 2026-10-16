import RequireAuth from "../components/RequireAuth";

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-4">
          Your delivery details and order summary will appear here.
        </p>
      </main>
    </RequireAuth>
  );
}