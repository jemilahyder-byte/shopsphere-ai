"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "../../stores/cartStore";
import { useWishlistStore } from "../../stores/wishlistStore";

type Product = {
  id: number;
  title: string;
  description: string;
  price: number;
  rating: number;
  stock: number;
  category: string;
  thumbnail: string;
  images: string[];
};

function ProductDetailsContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [size, setSize] = useState("");
  const [colour, setColour] = useState("");

  const items = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore(
    (state) => state.toggleItem
  );

  const {
    data: product,
    isPending,
    isError,
    refetch,
  } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await fetch(
        "https://dummyjson.com/products/" + encodeURIComponent(id)
      );

      if (!response.ok) {
        throw new Error("Unable to load this product.");
      }

      return response.json();
    },
  });

  if (isPending) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p role="status">Loading product...</p>
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="mx-auto max-w-4xl p-6">
        <p role="alert">
          Product unavailable or could not be loaded.
        </p>

        <button
          type="button"
          onClick={() => void refetch()}
          className="my-4 rounded border px-4 py-2"
        >
          Try again
        </button>

        <Link href="/" className="ml-4 underline">
          Back to shop
        </Link>
      </main>
    );
  }

  const isClothing = [
    "mens-shirts",
    "womens-dresses",
    "tops",
  ].includes(product.category);

  const isFootwear = [
    "mens-shoes",
    "womens-shoes",
  ].includes(product.category);

  const sizes = isClothing
    ? ["S", "M", "L", "XL"]
    : isFootwear
      ? ["6", "7", "8", "9", "10"]
      : [];

  const colours =
    isClothing || isFootwear ? ["Black", "White", "Blue"] : [];

  const images =
    product.images?.length > 0
      ? product.images
      : [product.thumbnail];

  const inCart = items
    .filter((item) => item.id === product.id)
    .reduce((total, item) => total + item.quantity, 0);

  const available = Math.max(0, product.stock - inCart);

  const isWishlisted = wishlistItems.some(
    (item) => item.id === product.id
  );

  function addSelectedItems(): boolean {
    if (!product) return false;

    if (
      sizes.length > 0 &&
      (!sizes.includes(size) || !colours.includes(colour))
    ) {
      setMessage("Please select a size and colour.");
      return false;
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > available
    ) {
      setMessage("Choose a quantity within the available stock.");
      return false;
    }

    for (let index = 0; index < quantity; index += 1) {
      addItem({
        id: product.id,
        name: product.title,
        price: product.price,
        size: sizes.length > 0 ? size : undefined,
        colour: colours.length > 0 ? colour : undefined,
      });
    }

    return true;
  }

  function handleBuyNow() {
    if (addSelectedItems()) {
      router.push("/checkout");
    }
  }

  function handleAddToCart() {
    if (addSelectedItems()) {
      setMessage("Added " + quantity + " item(s) to cart.");
      setQuantity(1);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/" className="underline">
        Back to shop
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[imageIndex] ?? images[0]}
            alt={product.title}
            width={500}
            height={400}
            className="h-80 w-full rounded border object-contain"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            {images.map((image, index) => (
              <button
                key={image + index}
                type="button"
                onClick={() => setImageIndex(index)}
                aria-label={"View image " + (index + 1)}
                aria-pressed={imageIndex === index}
                className="rounded border p-1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="capitalize text-gray-600">
            {product.category.replaceAll("-", " ")}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {product.title}
          </h1>

          <p className="mt-4 text-xl font-semibold">
            USD ${product.price.toFixed(2)}
          </p>

          <p className="mt-3">
            Rating: {product.rating.toFixed(1)} / 5
          </p>

          <p className="mt-3">
            {product.stock > 0
              ? "In stock: " + product.stock
              : "Out of stock"}
          </p>

          <p className="mt-4">{product.description}</p>
          <p className="mt-4">Already in cart: {inCart}</p>

          <div className="mt-4 rounded border p-3">
            <h2 className="font-semibold">Available options</h2>

            {sizes.length > 0 ? (
              <>
                <p className="mt-1 text-sm text-gray-600">
                  Demo choices for this project, not supplier
                  availability.
                </p>

                <label className="mt-3 block">
                  Size
                  <select
                    value={size}
                    onChange={(event) => {
                      setSize(event.target.value);
                      setMessage("");
                    }}
                    className="mt-1 w-full rounded border bg-white p-2 text-black"
                  >
                    <option value="">Select size</option>
                    {sizes.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="mt-3 block">
                  Colour
                  <select
                    value={colour}
                    onChange={(event) => {
                      setColour(event.target.value);
                      setMessage("");
                    }}
                    className="mt-1 w-full rounded border bg-white p-2 text-black"
                  >
                    <option value="">Select colour</option>
                    {colours.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <p className="mt-1 text-sm text-gray-600">
                No size or colour options are provided for this
                product.
              </p>
            )}
          </div>

          <label
            htmlFor="quantity"
            className="mt-4 block font-semibold"
          >
            Quantity
          </label>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              id="quantity"
              type="number"
              min={1}
              max={Math.max(1, available)}
              step={1}
              value={quantity}
              disabled={available === 0}
              onChange={(event) => {
                setQuantity(event.target.valueAsNumber || 1);
                setMessage("");
              }}
              className="w-24 rounded border p-3"
            />

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={available === 0}
              className="rounded bg-blue-600 px-4 py-3 text-white disabled:opacity-50"
            >
              {available > 0 ? "Add to Cart" : "No more stock"}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={available === 0}
              className="rounded bg-green-700 px-4 py-3 text-white disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>

          <button
            type="button"
            aria-pressed={isWishlisted}
            onClick={() =>
              toggleWishlist({
                id: product.id,
                name: product.title,
                price: product.price,
                thumbnail: product.thumbnail,
              })
            }
            className="mt-4 block rounded border px-4 py-3"
          >
            {isWishlisted
              ? "Remove from Wishlist"
              : "Add to Wishlist"}
          </button>

          <p className="mt-4" role="status">
            {message}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense
      fallback={
        <p role="status" className="p-6">
          Loading product...
        </p>
      }
    >
      <ProductDetailsContent />
    </Suspense>
  );
}