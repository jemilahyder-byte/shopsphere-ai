"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useAuthStore } from "../stores/authStore";
import { useReviewStore } from "../stores/reviewStore";

export default function ProductReviews({
  productId,
}: {
  productId: number;
}) {
  const [ready, setReady] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  const user = useAuthStore((state) => state.user);
  const reviews = useReviewStore((state) => state.reviews);
  const saveReview = useReviewStore(
    (state) => state.saveReview
  );
  const deleteReview = useReviewStore(
    (state) => state.deleteReview
  );

  const email = user?.email.trim().toLowerCase();

  const productReviews = reviews
    .filter((review) => review.productId === productId)
    .sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );

  const myReview = productReviews.find(
    (review) => review.userEmail === email
  );

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    setRating(myReview?.rating ?? 5);
    setComment(myReview?.comment ?? "");
    setMessage("");
  }, [productId, email, myReview]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      saveReview(productId, rating, comment);
      setMessage("Your review has been saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your review."
      );
    }
  }

  function handleDelete(reviewId: string) {
    if (!window.confirm("Delete your review?")) {
      return;
    }

    try {
      deleteReview(reviewId);
      setMessage("Your review has been deleted.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete your review."
      );
    }
  }

  if (!ready) {
    return <p className="mt-8">Loading reviews...</p>;
  }

  const average =
    productReviews.length > 0
      ? productReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        ) / productReviews.length
      : 0;

  return (
    <section className="mt-10 border-t pt-6">
      <h2 className="text-2xl font-bold">
        Customer Reviews
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Demo reviews saved in this browser.
      </p>

      {productReviews.length > 0 ? (
        <p className="mt-3 font-semibold">
          Customer rating: {average.toFixed(1)} / 5
          {" · "}
          {productReviews.length} review(s)
        </p>
      ) : (
        <p className="mt-3">No reviews yet.</p>
      )}

      {user ? (
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 rounded border p-5"
        >
          <h3 className="text-lg font-bold">
            {myReview ? "Edit your review" : "Write a review"}
          </h3>

          <div>
            <label
              htmlFor={"review-rating-" + productId}
              className="block font-semibold"
            >
              Rating
            </label>

            <select
              id={"review-rating-" + productId}
              value={rating}
              onChange={(event) =>
                setRating(Number(event.target.value))
              }
              className="mt-2 rounded border p-2"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={"review-comment-" + productId}
              className="block font-semibold"
            >
              Your review
            </label>

            <textarea
              id={"review-comment-" + productId}
              value={comment}
              onChange={(event) =>
                setComment(event.target.value)
              }
              required
              minLength={5}
              maxLength={1000}
              rows={4}
              className="mt-2 w-full rounded border p-3"
              placeholder="Tell us about this product"
            />

            <p className="text-sm text-gray-600">
              {comment.length} / 1000 characters
            </p>
          </div>

          <button
            type="submit"
            className="rounded bg-blue-700 px-4 py-2 text-white"
          >
            {myReview ? "Update review" : "Submit review"}
          </button>
        </form>
      ) : (
        <p className="mt-5">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          to write a review.
        </p>
      )}

      <p role="status" className="mt-3">
        {message}
      </p>

      <div className="mt-6 space-y-4">
        {productReviews.map((review) => (
          <article
            key={review.id}
            className="rounded border p-5"
          >
            <h3 className="font-bold">
              {review.userName}
            </h3>

            <p className="mt-1">
              Rating: {review.rating} / 5
            </p>

            <p className="mt-2 whitespace-pre-wrap break-words">
              {review.comment}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              {new Date(
                review.updatedAt
              ).toLocaleDateString()}
              {review.updatedAt !== review.createdAt
                ? " · Edited"
                : ""}
            </p>

            {review.userEmail === email && (
              <button
                type="button"
                onClick={() => handleDelete(review.id)}
                className="mt-3 text-red-700 underline"
              >
                Delete my review
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}