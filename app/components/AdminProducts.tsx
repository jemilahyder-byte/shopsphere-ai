"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useProductStore,
  type ManagedProduct,
  type ProductInput,
} from "../stores/productStore";

const emptyForm = {
  title: "",
  description: "",
  price: "",
  stock: "",
  category: "",
  thumbnail: "",
};

export default function AdminProducts() {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRating, setEditingRating] = useState(0);
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [message, setMessage] = useState("");

  const customProducts = useProductStore(
    (state) => state.customProducts
  );
  const overrides = useProductStore(
    (state) => state.overrides
  );
  const hiddenIds = useProductStore(
    (state) => state.hiddenIds
  );
  const addProduct = useProductStore(
    (state) => state.addProduct
  );
  const updateProduct = useProductStore(
    (state) => state.updateProduct
  );
  const deleteProduct = useProductStore(
    (state) => state.deleteProduct
  );
  const restoreProduct = useProductStore(
    (state) => state.restoreProduct
  );

  const { data, isPending, isError, refetch } = useQuery<
    ManagedProduct[]
  >({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const response = await fetch(
        "https://dummyjson.com/products?limit=0"
      );

      if (!response.ok) {
        throw new Error("Unable to load products.");
      }

      const result = await response.json();
      return result.products;
    },
    staleTime: 5 * 60 * 1000,
  });

  const products = [
    ...customProducts,
    ...(data ?? []).map(
      (product) => overrides[product.id] ?? product
    ),
  ];

  const matchingProducts = products.filter((product) => {
    const hidden = hiddenIds.includes(product.id);
    const text = (
      product.title +
      " " +
      product.category
    ).toLowerCase();

    return (
      hidden === showHidden &&
      text.includes(search.trim().toLowerCase())
    );
  });

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setEditingRating(0);
  }

  function editProduct(product: ManagedProduct) {
    setEditingId(product.id);
    setEditingRating(product.rating);

    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      category: product.category,
      thumbnail: product.thumbnail,
    });

    setMessage("Editing: " + product.title);
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (!form.price.trim() || !form.stock.trim()) {
        throw new Error("Enter a price and stock quantity.");
      }

      const input: ProductInput = {
        title: form.title,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        category: form.category,
        thumbnail: form.thumbnail,
        images: [form.thumbnail],
        rating: editingRating,
      };

      if (editingId === null) {
        addProduct(input);
        setMessage("Product added.");
      } else {
        updateProduct(editingId, input);
        setMessage("Product updated.");
      }

      resetForm();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save product."
      );
    }
  }

  function hideProduct(product: ManagedProduct) {
    if (
      !window.confirm(
        "Hide " + product.title + " from the shop?"
      )
    ) {
      return;
    }

    try {
      deleteProduct(product.id);

      if (editingId === product.id) {
        resetForm();
      }

      setMessage("Product hidden. You can restore it below.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to hide product."
      );
    }
  }

  function restore(productId: number) {
    try {
      restoreProduct(productId);
      setMessage("Product restored.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to restore product."
      );
    }
  }

  return (
    <section className="mt-10 border-t pt-6">
      <h2 className="text-2xl font-bold">
        Product management
      </h2>

      <p className="mt-3 text-sm text-gray-600">
        Demo product changes are saved in this browser.
        Removing a product hides it and allows restoration.
      </p>

      <form
        onSubmit={submitProduct}
        className="mt-5 space-y-4 rounded border p-5"
      >
        <h3 className="text-xl font-bold">
          {editingId === null ? "Add product" : "Edit product"}
        </h3>

        <label className="block">
          Product name
          <input
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            required
            maxLength={150}
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <label className="block">
          Description
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm({
                ...form,
                description: event.target.value,
              })
            }
            required
            maxLength={5000}
            rows={3}
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            Price (USD)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={form.price}
              onChange={(event) =>
                setForm({ ...form, price: event.target.value })
              }
              required
              className="mt-1 w-full rounded border p-2"
            />
          </label>

          <label className="block">
            Stock
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={(event) =>
                setForm({ ...form, stock: event.target.value })
              }
              required
              className="mt-1 w-full rounded border p-2"
            />
          </label>
        </div>

        <label className="block">
          Category
          <input
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            required
            maxLength={80}
            placeholder="For example: furniture"
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <label className="block">
          Image URL
          <input
            type="url"
            value={form.thumbnail}
            onChange={(event) =>
              setForm({
                ...form,
                thumbnail: event.target.value,
              })
            }
            required
            className="mt-1 w-full rounded border p-2"
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded bg-blue-700 px-4 py-2 text-white"
          >
            {editingId === null ? "Add product" : "Save changes"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded border px-4 py-2"
            >
              Cancel editing
            </button>
          )}
        </div>
      </form>

      <p role="status" className="mt-3">
        {message}
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <label className="block">
          Search products
          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            className="mt-1 block rounded border p-2"
          />
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(event) =>
              setShowHidden(event.target.checked)
            }
          />
          Show hidden products
        </label>
      </div>

      {isPending && (
        <p className="mt-4">Loading supplier products...</p>
      )}

      {isError && (
        <div className="mt-4">
          <p>Supplier products could not be loaded.</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 rounded border px-3 py-2"
          >
            Try again
          </button>
        </div>
      )}

      <p className="mt-4">
        {matchingProducts.length} matching product(s).
        Showing up to 20. Use search to find others.
      </p>

      <div className="mt-4 space-y-3">
        {matchingProducts.slice(0, 20).map((product) => (
          <article
            key={product.id}
            className="rounded border p-4"
          >
            <h3 className="font-bold">{product.title}</h3>
            <p>{product.category}</p>
            <p>USD ${product.price.toFixed(2)}</p>
            <p>Stock: {product.stock}</p>

            <div className="mt-3 flex flex-wrap gap-4">
              {showHidden ? (
                <button
                  type="button"
                  onClick={() => restore(product.id)}
                  className="underline"
                >
                  Restore product
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => editProduct(product)}
                    className="underline"
                  >
                    Edit product
                  </button>

                  <button
                    type="button"
                    onClick={() => hideProduct(product)}
                    className="text-red-700 underline"
                  >
                    Hide product
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}