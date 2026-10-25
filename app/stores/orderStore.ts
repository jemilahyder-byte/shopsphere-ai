"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { calculateCartTotals } from "./cartTotals";
import { useAuthStore } from "./authStore";

export const ORDER_STATUSES = [
  "Placed",
  "Processing",
  "Shipped",
  "Delivered",
] as const;

export type OrderStatus =
  (typeof ORDER_STATUSES)[number];

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
  status: OrderStatus;
  statusUpdatedAt?: string;
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

  updateOrderStatus: (
    orderId: string,
    status: OrderStatus
  ) => void;
};

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
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

      updateOrderStatus: (orderId, status) => {
        const user = useAuthStore.getState().user;

        if (!user || user.role !== "admin") {
          throw new Error(
            "Only an admin can update order status."
          );
        }

        if (!ORDER_STATUSES.includes(status)) {
          throw new Error("Invalid order status.");
        }

        const order = get().orders.find(
          (item) => item.id === orderId
        );

        if (!order) {
          throw new Error("Order not found.");
        }

        const currentIndex =
          ORDER_STATUSES.indexOf(order.status);

        const nextIndex =
          ORDER_STATUSES.indexOf(status);

        if (nextIndex === currentIndex) return;

        if (nextIndex !== currentIndex + 1) {
          throw new Error(
            "Please move the order to the next status."
          );
        }

        set((state) => ({
          orders: state.orders.map((item) =>
            item.id === orderId
              ? {
                  ...item,
                  status,
                  statusUpdatedAt:
                    new Date().toISOString(),
                }
              : item
          ),
        }));
      },
    }),
    {
      name: "shopsphere-demo-orders",
    }
  )
);