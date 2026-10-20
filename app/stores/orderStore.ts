"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string;
colour?: string;
};

type Delivery = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

type Order = {
  id: string;
  userEmail: string;
  createdAt: string;
  items: OrderItem[];
  delivery: Delivery;
  total: number;
  status: "Placed";
};

type OrderStore = {
  orders: Order[];
  placeOrder: (
    userEmail: string,
    items: OrderItem[],
    delivery: Delivery
  ) => string;
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],

      placeOrder: (userEmail, items, delivery) => {
        if (items.length === 0) {
          throw new Error("Your cart is empty.");
        }

        const id = crypto.randomUUID();

        const order: Order = {
          id,
          userEmail: userEmail.trim().toLowerCase(),
          createdAt: new Date().toISOString(),
          items: items.map((item) => ({ ...item })),
          delivery: { ...delivery },
          total: items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
          status: "Placed",
        };

        set((state) => ({
          orders: [order, ...state.orders],
        }));

        return id;
      },
    }),
    { name: "shopsphere-demo-orders" }
  )
);