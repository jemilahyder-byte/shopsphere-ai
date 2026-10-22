import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  colour?: string;
};

type CartStore = {
  items: CartItem[];
  savedItems: CartItem[];
  couponCode: string;

  addItem: (product: Omit<CartItem, "quantity">) => void;

  removeItem: (
    id: number,
    size?: string,
    colour?: string
  ) => void;

  updateQuantity: (
    id: number,
    quantity: number,
    size?: string,
    colour?: string
  ) => void;

  saveForLater: (
    id: number,
    size?: string,
    colour?: string
  ) => void;

  moveToCart: (
    id: number,
    stock: number,
    size?: string,
    colour?: string
  ) => boolean;

  removeSavedItem: (
    id: number,
    size?: string,
    colour?: string
  ) => void;

  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  clearCart: () => void;
};

function matchesItem(
  item: CartItem,
  id: number,
  size?: string,
  colour?: string
) {
  return (
    item.id === id &&
    item.size === size &&
    item.colour === colour
  );
}

function mergeItem(
  items: CartItem[],
  product: CartItem
): CartItem[] {
  const matches = (item: CartItem) =>
    matchesItem(
      item,
      product.id,
      product.size,
      product.colour
    );

  return items.some(matches)
    ? items.map((item) =>
        matches(item)
          ? {
              ...item,
              quantity: item.quantity + product.quantity,
            }
          : item
      )
    : [...items, { ...product }];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      savedItems: [],
      couponCode: "",

      addItem: (product) =>
        set((state) => ({
          items: mergeItem(state.items, {
            ...product,
            quantity: 1,
          }),
        })),

      removeItem: (id, size, colour) =>
        set((state) => ({
          items: state.items.filter(
            (item) => !matchesItem(item, id, size, colour)
          ),
        })),

      updateQuantity: (id, quantity, size, colour) =>
        set((state) => {
          if (!Number.isInteger(quantity) || quantity < 1) {
            return state;
          }

          return {
            items: state.items.map((item) =>
              matchesItem(item, id, size, colour)
                ? { ...item, quantity }
                : item
            ),
          };
        }),

      saveForLater: (id, size, colour) =>
        set((state) => {
          const product = state.items.find((item) =>
            matchesItem(item, id, size, colour)
          );

          if (!product) return state;

          return {
            items: state.items.filter(
              (item) => !matchesItem(item, id, size, colour)
            ),
            savedItems: mergeItem(state.savedItems, product),
          };
        }),

      moveToCart: (id, stock, size, colour) => {
        const state = get();

        const product = state.savedItems.find((item) =>
          matchesItem(item, id, size, colour)
        );

        if (
          !product ||
          !Number.isInteger(product.quantity) ||
          product.quantity < 1 ||
          !Number.isInteger(stock) ||
          stock < 1
        ) {
          return false;
        }

        const inCart = state.items
          .filter((item) => item.id === id)
          .reduce((sum, item) => sum + item.quantity, 0);

        if (inCart + product.quantity > stock) {
          return false;
        }

        set({
          items: mergeItem(state.items, product),
          savedItems: state.savedItems.filter(
            (item) => !matchesItem(item, id, size, colour)
          ),
        });

        return true;
      },

      removeSavedItem: (id, size, colour) =>
        set((state) => ({
          savedItems: state.savedItems.filter(
            (item) => !matchesItem(item, id, size, colour)
          ),
        })),

      applyCoupon: (code) => {
        const normalizedCode = code.trim().toUpperCase();

        if (
          normalizedCode !== "SAVE10" ||
          get().items.length === 0
        ) {
          return false;
        }

        set({ couponCode: normalizedCode });
        return true;
      },

      removeCoupon: () => set({ couponCode: "" }),

      clearCart: () =>
        set({
          items: [],
          couponCode: "",
        }),
    }),
    { name: "shopsphere-cart" }
  )
);