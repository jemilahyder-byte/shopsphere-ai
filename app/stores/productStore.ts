"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";

export type ManagedProduct = {
  id: number;
  title: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  thumbnail: string;
  images: string[];
  rating: number;
};

export type ProductInput = Omit<ManagedProduct, "id">;

type ProductStore = {
  customProducts: ManagedProduct[];
  overrides: Record<number, ManagedProduct>;
  hiddenIds: number[];

  addProduct: (input: ProductInput) => number;
  updateProduct: (
    productId: number,
    input: ProductInput
  ) => void;
  deleteProduct: (productId: number) => void;
  restoreProduct: (productId: number) => void;
};

function requireAdmin() {
  const user = useAuthStore.getState().user;

  if (!user || user.role !== "admin") {
    throw new Error("Only an admin can manage products.");
  }
}

function validateProduct(input: ProductInput): ProductInput {
  const title = input.title.trim();
  const category = input.category.trim().toLowerCase();
  const description = input.description.trim();
  const thumbnail = input.thumbnail.trim();

  if (!title || title.length > 150) {
    throw new Error(
      "Enter a product name with 1 to 150 characters."
    );
  }

  if (!category || category.length > 80) {
    throw new Error("Enter a valid category.");
  }

  if (!description || description.length > 5000) {
    throw new Error(
      "Enter a description with 1 to 5000 characters."
    );
  }

  if (!Number.isFinite(input.price) || input.price <= 0) {
    throw new Error("Price must be greater than zero.");
  }

  if (!Number.isInteger(input.stock) || input.stock < 0) {
    throw new Error("Stock must be a whole number of zero or more.");
  }

  if (
    !Number.isFinite(input.rating) ||
    input.rating < 0 ||
    input.rating > 5
  ) {
    throw new Error("Rating must be between 0 and 5.");
  }

  try {
    const url = new URL(thumbnail);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error();
    }
  } catch {
    throw new Error("Enter a valid HTTP or HTTPS image URL.");
  }

  return {
    ...input,
    title,
    category,
    description,
    thumbnail,
    images: [thumbnail],
  };
}

export const useProductStore = create<ProductStore>()(
  persist(
    (set, get) => ({
      customProducts: [],
      overrides: {},
      hiddenIds: [],

      addProduct: (input) => {
        requireAdmin();
        const product = validateProduct(input);

        const largestId = get().customProducts.reduce(
          (largest, item) => Math.max(largest, item.id),
          0
        );

        const id = Math.max(Date.now(), largestId + 1);

        set((state) => ({
          customProducts: [
            { ...product, id },
            ...state.customProducts,
          ],
        }));

        return id;
      },

      updateProduct: (productId, input) => {
        requireAdmin();

        if (!Number.isSafeInteger(productId) || productId <= 0) {
          throw new Error("Invalid product ID.");
        }

        const product = {
          ...validateProduct(input),
          id: productId,
        };

        const isCustom = get().customProducts.some(
          (item) => item.id === productId
        );

        if (isCustom) {
          set((state) => ({
            customProducts: state.customProducts.map((item) =>
              item.id === productId ? product : item
            ),
          }));
        } else {
          set((state) => ({
            overrides: {
              ...state.overrides,
              [productId]: product,
            },
          }));
        }
      },

      deleteProduct: (productId) => {
        requireAdmin();

        if (!Number.isSafeInteger(productId) || productId <= 0) {
          throw new Error("Invalid product ID.");
        }

        set((state) => ({
          hiddenIds: state.hiddenIds.includes(productId)
            ? state.hiddenIds
            : [...state.hiddenIds, productId],
        }));
      },

      restoreProduct: (productId) => {
        requireAdmin();

        set((state) => ({
          hiddenIds: state.hiddenIds.filter(
            (id) => id !== productId
          ),
        }));
      },
    }),
    {
      name: "shopsphere-demo-products",
    }
  )
);