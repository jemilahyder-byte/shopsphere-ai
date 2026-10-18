"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";

type WishlistItem = {
  id: number;
  name: string;
  price: number;
  thumbnail: string;
};

type WishlistStore = {
  items: WishlistItem[];
  toggleItem: (product: WishlistItem) => void;
  removeItem: (id: number) => void;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set) => ({
      items: [],

      toggleItem: (product) =>
        set((state) => ({
          items: state.items.some(
            (item) => item.id === product.id
          )
            ? state.items.filter(
                (item) => item.id !== product.id
              )
            : [...state.items, product],
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter(
            (item) => item.id !== id
          ),
        })),
    }),
    {
      name: "shopsphere-wishlist",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
      skipHydration: true,
    }
  )
);