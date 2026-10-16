import RequireAuth from "../components/RequireAuth";

export default function AdminPage() {
  return (
    <RequireAuth adminOnly>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-4">
          Product and order management will appear here.
        </p>
      </main>
    </RequireAuth>
  );
}