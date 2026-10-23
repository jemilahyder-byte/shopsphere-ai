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

type DeliveryMethod = "standard" | "express";

type OrderOptions = {
  deliveryMethod?: DeliveryMethod;
  paymentStatus?: "Demo paid";
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
  deliveryMethod?: DeliveryMethod;
  paymentStatus?: "Demo paid";
  estimatedDeliveryAt?: string;
  total: number;
  status: "Placed";
};

type OrderStore = {
  orders: Order[];

  placeOrder: (
    userEmail: string,
    items: OrderItem[],
    delivery: Delivery,
    couponCode?: string,
    options?: OrderOptions
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
        couponCode = "",
        options = {}
      ) => {
        if (items.length === 0) {
          throw new Error("Your cart is empty.");
        }

        const normalizedEmail = userEmail
          .trim()
          .toLowerCase();

        if (!normalizedEmail) {
          throw new Error(
            "Please sign in before ordering."
          );
        }

        const deliveryMethod =
          options.deliveryMethod ?? "standard";

        if (
          deliveryMethod !== "standard" &&
          deliveryMethod !== "express"
        ) {
          throw new Error("Invalid delivery option.");
        }

        const totals = calculateCartTotals(
          items,
          couponCode,
          deliveryMethod
        );

        if (!totals.couponValid) {
          throw new Error(
            "Invalid coupon. Return to your cart."
          );
        }

        const id = crypto.randomUUID();
        const createdAt = new Date();

        const deliveryDays =
          deliveryMethod === "express" ? 2 : 5;

        const estimatedDeliveryAt = new Date(
          createdAt.getTime() +
            deliveryDays * 24 * 60 * 60 * 1000
        ).toISOString();

        const order: Order = {
          id,
          userEmail: normalizedEmail,
          createdAt: createdAt.toISOString(),
          items: items.map((item) => ({ ...item })),
          delivery: { ...delivery },
          subtotal: totals.subtotal,
          discount: totals.discount,
          shipping: totals.shipping,
          tax: totals.tax,
          couponCode: totals.couponCode,
          deliveryMethod,
          paymentStatus: options.paymentStatus,
          estimatedDeliveryAt,
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