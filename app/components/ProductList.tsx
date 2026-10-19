"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "../stores/cartStore";

type Product = {
  id: number;
  name: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
};

type ApiProduct = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
};

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(
    "https://dummyjson.com/products?limit=100"
  );

  if (!response.ok) {
    throw new Error("Unable to load products");
  }

  const data: { products: ApiProduct[] } = await response.json();

  return data.products.map((product) => ({
    id: product.id,
    name: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
    category: product.category,
    rating: product.rating,
  }));
}

export default function ProductList() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("0");
  const [sortBy, setSortBy] = useState("default");
  const [visibleCount,setVisibleCount]=useState(20);
  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);

  const {
    data: products = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["products", "catalog"],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000,
  });

  function toggleCompare(id: number) {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 4) return current;

      return [...current, id];
    });
  }

  const count = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const categories = Array.from(
    new Set(products.map((product) => product.category))
  ).sort();

  const filtered = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    const matchesCategory =
      category === "all" || product.category === category;

    const matchesPrice =
      maxPrice === "" || product.price <= Number(maxPrice);

    const matchesRating =
      product.rating >= Number(minRating);

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesRating
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const comparedProducts = products.filter((product) =>
    compareIds.includes(product.id)
  );

  if (isPending) {
    return (
      <p role="status" className="mt-8">
        Loading products...
      </p>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="mt-8">
        <p>Unable to load products. Please try again.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-3 rounded border px-4 py-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold">
        Featured Products
      </h2>

      <p className="mt-3" aria-live="polite">
  <Link href="/cart" className="underline">
    Cart: {count} {count === 1 ? "item" : "items"}
  </Link>
</p>

      <input
        type="text"
        list="product-suggestions"
        autoComplete="off"
        aria-label="Search products"
        placeholder="Search products..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="my-4 w-full rounded border p-3"
      />

      <datalist id="product-suggestions">
        {products.map((product) => (
          <option key={product.id} value={product.name} />
        ))}
      </datalist>

      <div className="mb-4">
        <label htmlFor="category" className="mb-2 block">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded border bg-white p-3 text-black"
        >
          <option value="all">All categories</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item.replaceAll("-", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="maxPrice" className="mb-2 block">
            Maximum price (USD)
          </label>
          <input
            id="maxPrice"
            type="number"
            min="0"
            step="0.01"
            placeholder="Any price"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            className="w-full rounded border p-3"
          />
        </div>

        <div>
          <label htmlFor="minRating" className="mb-2 block">
            Minimum rating
          </label>
          <select
            id="minRating"
            value={minRating}
            onChange={(event) => setMinRating(event.target.value)}
            className="w-full rounded border bg-white p-3 text-black"
          >
            <option value="0">All ratings</option>
            <option value="3">3 and above</option>
            <option value="4">4 and above</option>
            <option value="4.5">4.5 and above</option>
          </select>
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="sortBy" className="mb-2 block">
          Sort by
        </label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="w-full rounded border bg-white p-3 text-black"
        >
          <option value="default">Default order</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest rating</option>
          <option value="name">Name: A to Z</option>
        </select>
      </div>

      <button
        type="button"
        onClick={() => {
          setSearch("");
          setCategory("all");
          setMaxPrice("");
          setMinRating("0");
          setSortBy("default");
        }}
        className="mb-4 rounded border px-4 py-2"
      >
        Reset filters
      </button>

      <p className="mb-4" role="status">
        {filtered.length} products found
      </p>

      {compareIds.length > 0 && (
        <section
          aria-labelledby="compare-title"
          className="mb-6 rounded border p-4"
        >
          <h2 id="compare-title" className="text-xl font-bold">
            Compare products ({compareIds.length}/4)
          </h2>

          <p className="mt-2" role="status">
            {compareIds.length < 2
              ? "Select at least 2 products to compare."
              : "You can compare up to 4 products."}
          </p>

          <button
            type="button"
            onClick={() => setCompareIds([])}
            className="my-3 rounded border px-3 py-2"
          >
            Clear comparison
          </button>

          {compareIds.length >= 2 && (
            <div
              className="overflow-x-auto"
              tabIndex={0}
              role="region"
              aria-label="Product comparison table"
            >
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Selected products comparison
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="border p-3">
                      Product
                    </th>
                    <th scope="col" className="border p-3">
                      Category
                    </th>
                    <th scope="col" className="border p-3">
                      Price (USD)
                    </th>
                    <th scope="col" className="border p-3">
                      Rating
                    </th>
                    <th scope="col" className="border p-3">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {comparedProducts.map((product) => (
                    <tr key={product.id}>
                      <th scope="row" className="border p-3">
                        {product.name}
                      </th>
                      <td className="border p-3 capitalize">
                        {product.category.replaceAll("-", " ")}
                      </td>
                      <td className="border p-3">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="border p-3">
                        {product.rating.toFixed(1)} / 5
                      </td>
                      <td className="border p-3">
                        <button
                          type="button"
                          onClick={() => toggleCompare(product.id)}
                          aria-label={"Remove" + product.name + "frm comparison"}
                          className="underline"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.slice(0, visibleCount).map((product) => (
          <article
            key={product.id}
            className="rounded border p-5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.thumbnail}
              alt={product.name}
              width={300}
              height={200}
              loading="lazy"
              className="mb-4 h-48 w-full rounded object-contain"
            />

            <p className="mb-2 text-sm capitalize text-gray-600">
              {product.category.replaceAll("-", " ")}
            </p>

            <h3 className="text-lg font-semibold">
              {product.name}
            </h3>

            <p className="mt-2">
              USD ${product.price.toFixed(2)}
            </p>

            <p className="mt-2">
              Rating: {product.rating.toFixed(1)} / 5
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => addItem(product)}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                Add to Cart
              </button>

              <button
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="rounded border px-4 py-2"
              >
                Quick View
              </button>
            </div>

            <label className="mt-4 flex items-center gap-2">
              <input
                type="checkbox"
                checked={compareIds.includes(product.id)}
                disabled={
                  compareIds.length >= 4 &&
                  !compareIds.includes(product.id)
                }
                onChange={() => toggleCompare(product.id)}
              />
              Compare
              <span className="sr-only">
                {" "}{product.name}
              </span>
            </label>
          </article>
        ))}
      </div>
<p className="mt-4" role="status">
  Showing {Math.min(visibleCount, sorted.length)} of{" "}
  {sorted.length} products
</p>

{visibleCount < sorted.length && (
  <button
    type="button"
    onClick={() => setVisibleCount((count) => count + 20)}
    className="mt-4 rounded border px-4 py-2"
  >
    Load More
  </button>
)}
      {filtered.length === 0 && (
        <p className="mt-4" role="status">
          No products found.
        </p>
      )}

      {selectedProduct && (
        <dialog
          ref={(dialog) => {
            if (dialog && !dialog.open) {
              dialog.showModal();
            }
          }}
          onClose={() => setSelectedProduct(null)}
          aria-labelledby="quick-view-title"
          className="fixed inset-0 m-auto max-h-[90vh] w-[90%] max-w-lg overflow-y-auto rounded bg-white p-6 text-black backdrop:bg-black/50"
        >
          <h2
            id="quick-view-title"
            className="text-xl font-bold"
          >
            {selectedProduct.name}
          </h2>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedProduct.thumbnail}
            alt={selectedProduct.name}
            width={300}
            height={200}
            className="my-4 h-48 w-full object-contain"
          />

          <p className="capitalize">
            {selectedProduct.category.replaceAll("-", " ")}
          </p>

          <p className="mt-2">
            USD ${selectedProduct.price.toFixed(2)}
          </p>

          <p className="mt-2">
            Rating: {selectedProduct.rating.toFixed(1)} / 5
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => addItem(selectedProduct)}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Add to Cart
            </button>

            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="rounded border px-4 py-2"
            >
              Close
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}