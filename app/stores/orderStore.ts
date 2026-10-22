                                                                                                                                                                                                                                                                                                                        "use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateCartTotals } from "./cartTotals";

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
  subtotal?: number;
  discount?: number;
  shipping?: number;
  tax?: number;
  couponCode?: string;
  total: number;
  status: "Placed";
};

type OrderStore = {
  orders: Order[];
  placeOrder: (
    userEmail: string,
    items: OrderItem[],
    delivery: Delivery,
    couponCode?: string
  ) => string;
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],

      placeOrder: (
        userEmail,
        items,
        delivery,
        couponCode = ""
      ) => {
        if (items.length === 0) {
          throw new Error("Your cart is empty.");
        }

        const normalizedEmail = userEmail
          .trim()
          .toLowerCase();

        if (!normalizedEmail) {
          throw new Error("Please sign in before ordering.");
        }

        const totals = calculateCartTotals(
          items,
          couponCode
        );

        if (!totals.couponValid) {
          throw new Error(
            "Invalid coupon. Return to your cart."
          );
        }

        const id = crypto.randomUUID();

        const order: Order = {
          id,
          userEmail: normalizedEmail,
          createdAt: new Date().toISOString(),
          items: items.map((item) => ({ ...item })),
          delivery: { ...delivery },
          subtotal: totals.subtotal,

          discount: totals.discount,
          shipping: totals.shipping,
          tax: totals.tax,
          couponCode: totals.couponCode,
          total: totals.total,
          status: "Placed",
        };

        set((state) => ({
          orders: [order, ...state.orders],
        }));

        return id;
      },
    }),
    {
      name: "shopsphere-demo-orders",
    }
  )
);                                                                             