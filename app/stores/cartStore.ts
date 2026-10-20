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
  addItem: (product: Omit<CartItem, "quantity">) => void;
  removeItem: (
    id: number,
    size?: string,
    colour?: string
  ) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product) =>
        set((state) => {
          const matches = (item: CartItem) =>
            item.id === product.id &&
            item.size === product.size &&
            item.colour === product.colour;

          return {
            items: state.items.some(matches)
              ? state.items.map((item) =>
                  matches(item)
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                )
              : [...state.items, { ...product, quantity: 1 }],
          };
        }),

      removeItem: (id, size, colour) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.id === id &&
                item.size === size &&
                item.colour === colour
              )
          ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    { name: "shopsphere-cart" }
  )
);