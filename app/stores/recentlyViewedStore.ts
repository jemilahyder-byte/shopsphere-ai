"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewedProduct = {
  id: number;
  name: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
};

type RecentlyViewedStore = {
  products: ViewedProduct[];
  recordView: (product: ViewedProduct) => void;
  clearHistory: () => void;
};

export const useRecentlyViewedStore =
  create<RecentlyViewedStore>()(
    persist(
      (set) => ({
        products: [],

        recordView: (product) => {
          set((state) => ({
            products: [
              { ...product },
              ...state.products.filter(
                (item) => item.id !== product.id
              ),
            ].slice(0, 20),
          }));
        },

        clearHistory: () => {
          set({ products: [] });
        },
      }),
      {
        name: "shopsphere-recently-viewed",
      }
    )
  );