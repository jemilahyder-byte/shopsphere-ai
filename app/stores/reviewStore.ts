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
  helpfulVoters?: string[];
};

type ReviewStore = {
  reviews: Review[];

  saveReview: (
    productId: number,
    rating: number,
    comment: string
  ) => void;

  deleteReview: (reviewId: string) => void;
  toggleHelpful: (reviewId: string) => void;
};

function requireEmail(): string {
  const user = useAuthStore.getState().user;

  if (!user) {
    throw new Error("Please log in.");
  }

  return user.email.trim().toLowerCase();
}

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],

      saveReview: (productId, rating, comment) => {
        const user = useAuthStore.getState().user;

        if (!user) {
          throw new Error(
            "Please log in to write a review."
          );
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
          throw new Error(
            "Choose a rating from 1 to 5."
          );
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
            review.userEmail.trim().toLowerCase() === email
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
          helpfulVoters: [],
        };

        set((state) => ({
          reviews: [review, ...state.reviews],
        }));
      },

      deleteReview: (reviewId) => {
        const email = requireEmail();

        const review = get().reviews.find(
          (item) => item.id === reviewId
        );

        if (!review) {
          throw new Error("Review not found.");
        }

        if (
          review.userEmail.trim().toLowerCase() !== email
        ) {
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

      toggleHelpful: (reviewId) => {
        const email = requireEmail();

        set((state) => {
          const target = state.reviews.find(
            (review) => review.id === reviewId
          );

          if (!target) {
            throw new Error("Review not found.");
          }

          if (
            target.userEmail.trim().toLowerCase() === email
          ) {
            throw new Error(
              "You cannot vote on your own review."
            );
          }

          const voters = [
            ...new Set(
              (target.helpfulVoters ?? []).map(
                (voter) => voter.trim().toLowerCase()
              )
            ),
          ];

          const nextVoters = voters.includes(email)
            ? voters.filter((voter) => voter !== email)
            : [...voters, email];

          return {
            reviews: state.reviews.map((review) =>
              review.id === reviewId
                ? {
                    ...review,
                    helpfulVoters: nextVoters,
                  }
                : review
            ),
          };
        });
      },
    }),
    {
      name: "shopsphere-demo-reviews",
    }
  )
);