"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";
import { useAuthStore } from "./authStore";

export type RecommendationPreferences = {
  enabled: boolean;
  preferredCategories: string[];
  maxPrice: number | null;
};

type PreferenceStore = {
  preferencesByEmail: Record<
    string,
    RecommendationPreferences
  >;

  savePreferences: (
    preferences: RecommendationPreferences
  ) => void;

  resetPreferences: () => void;
};

export const DEFAULT_PREFERENCES: RecommendationPreferences = {
  enabled: true,
  preferredCategories: [],
  maxPrice: null,
};

function currentEmail(): string {
  const user = useAuthStore.getState().user;

  if (!user) {
    throw new Error(
      "Sign in to manage recommendation preferences."
    );
  }

  return user.email.trim().toLowerCase();
}

export const usePreferenceStore = create<PreferenceStore>()(
  persist(
    (set) => ({
      preferencesByEmail: {},

      savePreferences: (preferences) => {
        const email = currentEmail();

        if (typeof preferences.enabled !== "boolean") {
          throw new Error(
            "Choose a valid recommendation setting."
          );
        }

        if (
          !Array.isArray(preferences.preferredCategories) ||
          preferences.preferredCategories.some(
            (category) =>
              typeof category !== "string" ||
              !category.trim() ||
              category.trim().length > 100
          )
        ) {
          throw new Error("Choose valid categories.");
        }

        const categories = [
          ...new Set(
            preferences.preferredCategories.map(
              (category) => category.trim().toLowerCase()
            )
          ),
        ];

        if (categories.length > 50) {
          throw new Error(
            "Choose no more than 50 categories."
          );
        }

        const maxPrice = preferences.maxPrice;

        if (
          maxPrice !== null &&
          (
            typeof maxPrice !== "number" ||
            !Number.isFinite(maxPrice) ||
            maxPrice < 0
          )
        ) {
          throw new Error(
            "Enter a valid maximum price."
          );
        }

        const cleaned: RecommendationPreferences = {
          enabled: preferences.enabled,
          preferredCategories: categories,
          maxPrice,
        };

        set((store) => ({
          preferencesByEmail: {
            ...store.preferencesByEmail,
            [email]: cleaned,
          },
        }));
      },

      resetPreferences: () => {
        const email = currentEmail();

        set((store) => {
          const next = { ...store.preferencesByEmail };
          delete next[email];

          return {
            preferencesByEmail: next,
          };
        });
      },
    }),
    {
      name: "shopsphere-demo-preferences",
      storage: createJSONStorage(() => localStorage),
      partialize: (store) => ({
        preferencesByEmail: store.preferencesByEmail,
      }),
      skipHydration: true,
    }
  )
);