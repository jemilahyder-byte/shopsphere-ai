import ProductList from "./components/ProductList";

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-4xl font-bold">ShopSphere AI</h1>
      <p className="mt-3">
        Personalized Shopping, Powered by Intelligence
      </p>
      <ProductList />
    </main>
  );
}