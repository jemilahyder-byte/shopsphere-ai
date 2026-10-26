"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";

export type Review = {
  id: string;
  productId: number;
  userEmail: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

type ReviewStore = {
  reviews: Review[];
  saveReview: (
    productId: number,
    rating: number,
    comment: string
  ) => void;
  deleteReview: (reviewId: string) => void;
};

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],

      saveReview: (productId, rating, comment) => {
        const user = useAuthStore.getState().user;

        if (!user) {
          throw new Error("Please log in to write a review.");
        }

        if (
          !Number.isInteger(productId) ||
          productId <= 0
        ) {
          throw new Error("Invalid product.");
        }

        if (
          !Number.isInteger(rating) ||
          rating < 1 ||
          rating > 5
        ) {
          throw new Error("Choose a rating from 1 to 5.");
        }

        const text = comment.trim();

        if (text.length < 5 || text.length > 1000) {
          throw new Error(
            "Your review must contain 5 to 1000 characters."
          );
        }

        const email = user.email.trim().toLowerCase();
        const now = new Date().toISOString();

        const existing = get().reviews.find(
          (review) =>
            review.productId === productId &&
            review.userEmail === email
        );

        if (existing) {
          set((state) => ({
            reviews: state.reviews.map((review) =>
              review.id === existing.id
                ? {
                    ...review,
                    userName: user.name,
                    rating,
                    comment: text,
                    updatedAt: now,
                  }
                : review
            ),
          }));
          return;
        }

        const review: Review = {
          id: crypto.randomUUID(),
          productId,
          userEmail: email,
          userName: user.name,
          rating,
          comment: text,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          reviews: [review, ...state.reviews],
        }));
      },

      deleteReview: (reviewId) => {
        const user = useAuthStore.getState().user;

        if (!user) {
          throw new Error("Please log in.");
        }

        const review = get().reviews.find(
          (item) => item.id === reviewId
        );

        if (!review) {
          throw new Error("Review not found.");
        }

        const email = user.email.trim().toLowerCase();

        if (review.userEmail !== email) {
          throw new Error(
            "You can only delete your own review."
          );
        }

        set((state) => ({
          reviews: state.reviews.filter(
            (item) => item.id !== reviewId
          ),
        }));
      },
    }),
    {
      name: "shopsphere-demo-reviews",
    }
  )
);