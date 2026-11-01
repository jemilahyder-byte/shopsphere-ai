"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useAuthStore } from "../stores/authStore";
import {
  useReviewStore,
  type Review,
} from "../stores/reviewStore";

type ReviewFormProps = {
  productId: number;
  review?: Review;
  onSave: (rating: number, comment: string) => void;
};

function ReviewForm({
  productId,
  review,
  onSave,
}: ReviewFormProps) {
  const [rating, setRating] = useState(review?.rating ?? 5);
  const [comment, setComment] = useState(
    review?.comment ?? ""
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave(rating, comment);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4 rounded border p-5"
    >
      <h3 className="text-lg font-bold">
        {review ? "Edit your review" : "Write a review"}
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
          onChange={(event) => setComment(event.target.value)}
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
        {review ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}

function ReviewsContent({
  productId,
}: {
  productId: number;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const user = useAuthStore((state) => state.user);
  const reviews = useReviewStore((state) => state.reviews);
  const saveReview = useReviewStore(
    (state) => state.saveReview
  );
  const deleteReview = useReviewStore(
    (state) => state.deleteReview
  );
  const toggleHelpful = useReviewStore(
    (state) => state.toggleHelpful
  );

  const email = user?.email.trim().toLowerCase();

  const productReviews = reviews
    .filter((review) => review.productId === productId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const myReview = productReviews.find(
    (review) =>
      review.userEmail.trim().toLowerCase() === email
  );

  function showError(problem: unknown) {
    setError(
      problem instanceof Error
        ? problem.message
        : "Unable to update reviews."
    );
  }

  function handleSave(rating: number, comment: string) {
    setMessage("");
    setError("");

    try {
      saveReview(productId, rating, comment);
      setMessage("Your review has been saved.");
    } catch (problem) {
      showError(problem);
    }
  }

  function handleDelete(reviewId: string) {
    if (!window.confirm("Delete your review?")) return;

    setMessage("");
    setError("");

    try {
      deleteReview(reviewId);
      setMessage("Your review has been deleted.");
    } catch (problem) {
      showError(problem);
    }
  }

  function handleHelpful(reviewId: string) {
    setMessage("");
    setError("");

    try {
      const review = useReviewStore
        .getState()
        .reviews.find((item) => item.id === reviewId);

      const voted = (review?.helpfulVoters ?? []).some(
        (voter) => voter.trim().toLowerCase() === email
      );

      toggleHelpful(reviewId);

      setMessage(
        voted
          ? "Your helpful vote was removed."
          : "Your helpful vote was saved."
      );
    } catch (problem) {
      showError(problem);
    }
  }

  const average =
    productReviews.length > 0
      ? productReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        ) / productReviews.length
      : 0;

  const formKey = JSON.stringify([
    myReview?.id ?? null,
    myReview?.rating ?? 5,
    myReview?.comment ?? "",
  ]);

  return (
    <section
      aria-labelledby={"reviews-title-" + productId}
      className="mt-10 border-t pt-6"
    >
      <h2
        id={"reviews-title-" + productId}
        className="text-2xl font-bold"
      >
        Customer Reviews
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Demo reviews and helpful votes saved in this browser.
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
        <ReviewForm
          key={formKey}
          productId={productId}
          review={myReview}
          onSave={handleSave}
        />
      ) : (
        <p className="mt-5">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          to write a review or vote.
        </p>
      )}

      {message && (
        <p role="status" className="mt-3">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {productReviews.map((review) => {
          const ownReview =
            review.userEmail.trim().toLowerCase() === email;

          const voters = [
            ...new Set(
              (review.helpfulVoters ?? []).map((voter) =>
                voter.trim().toLowerCase()
              )
            ),
          ];

          const voted = email
            ? voters.includes(email)
            : false;

          return (
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

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={!user || ownReview}
                  aria-pressed={voted}
                  onClick={() => handleHelpful(review.id)}
                  className="rounded border px-3 py-2 disabled:opacity-50"
                >
                  {voted ? "Helpful — voted" : "Helpful"}
                  {" ("}
                  {voters.length}
                  {")"}
                </button>

                {ownReview && (
                  <button
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    className="text-red-700 underline"
                  >
                    Delete my review
                  </button>
                )}
              </div>

              {ownReview && (
                <p className="mt-2 text-sm text-gray-600">
                  You cannot vote on your own review.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default function ProductReviews({
  productId,
}: {
  productId: number;
}) {
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);

  const email = useAuthStore((state) =>
    state.user?.email.trim().toLowerCase()
  );

  useEffect(() => {
    let active = true;

    async function restoreReviews() {
      try {
        if (!useReviewStore.persist.hasHydrated()) {
          await useReviewStore.persist.rehydrate();
        }

        if (!useReviewStore.persist.hasHydrated()) {
          throw new Error("Unable to restore reviews.");
        }

        if (active) {
          setReady(true);
        }
      } catch {
        if (active) {
          setStorageError(true);
        }
      }
    }

    void restoreReviews();

    return () => {
      active = false;
    };
  }, []);

  if (storageError) {
    return (
      <p role="alert" className="mt-8">
        Unable to restore reviews. Refresh to retry.
      </p>
    );
  }

  if (!ready) {
    return (
      <p role="status" className="mt-8">
        Loading reviews...
      </p>
    );
  }

  return (
    <ReviewsContent
      key={JSON.stringify([productId, email ?? null])}
      productId={productId}
    />
  );
}