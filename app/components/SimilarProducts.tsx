"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  getSimilarProducts,
  type RecommendationProduct,
} from "../lib/recommendations";

type ApiProduct = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
};

type Props = {
  product: RecommendationProduct;
};

async function fetchCategoryProducts(
  category: string
): Promise<RecommendationProduct[]> {
  const response = await fetch(
    "https://dummyjson.com/products/category/" +
      encodeURIComponent(category) +
      "?limit=0"
  );

  if (!response.ok) {
    throw new Error("Unable to load similar products.");
  }

  const data: { products: ApiProduct[] } =
    await response.json();

  return data.products.map((product) => ({
    id: product.id,
    name: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
    category: product.category,
    rating: product.rating,
  }));
}

export default function SimilarProducts({
  product,
}: Props) {
  const {
    data: products = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "recommendations",
      "category",
      product.category,
    ],
    queryFn: () =>
      fetchCategoryProducts(product.category),
    staleTime: 5 * 60 * 1000,
  });

  const similarProducts = getSimilarProducts(
    products,
    product
  );

  return (
    <section
      aria-labelledby="similar-products-title"
      className="mt-10 border-t pt-6"
    >
      <h2
        id="similar-products-title"
        className="mb-4 text-2xl font-bold"
      >
        Similar products
      </h2>

      {isPending ? (
        <p role="status">
          Loading similar products...
        </p>
      ) : isError ? (
        <div role="alert">
          <p>Unable to load similar products.</p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded border px-4 py-2"
          >
            Try again
          </button>
        </div>
      ) : similarProducts.length === 0 ? (
        <p>No similar products available.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {similarProducts.map((item) => (
            <article
              key={item.id}
              className="rounded border p-4"
            >
              <Link href={"/products/" + item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnail}
                  alt={item.name}
                  width={240}
                  height={160}
                  loading="lazy"
                  className="mb-3 h-40 w-full object-contain"
                />

                <h3 className="font-semibold underline">
                  {item.name}
                </h3>
              </Link>

              <p className="mt-2 text-sm capitalize text-gray-600">
                {item.category.replaceAll("-", " ")}
              </p>

              <p className="mt-2">
                USD ${item.price.toFixed(2)}
              </p>

              <p className="mt-2">
                Rating: {item.rating.toFixed(1)} / 5
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}