"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DeliveryDetails = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

export type DeliveryMethod = "standard" | "express";
export type CheckoutStep = 1 | 2 | 3 | 4;

export type CheckoutDraft = DeliveryDetails & {
  deliveryMethod: DeliveryMethod;
  step: CheckoutStep;
};

type CheckoutStore = {
  drafts: Record<string, CheckoutDraft>;

  updateDetails: (
    userEmail: string,
    details: Partial<DeliveryDetails>
  ) => void;

  setDeliveryMethod: (
    userEmail: string,
    method: DeliveryMethod
  ) => void;

  setStep: (
    userEmail: string,
    step: CheckoutStep
  ) => void;

  clearDraft: (userEmail: string) => void;
};

export function createCheckoutDraft(
  userEmail: string
): CheckoutDraft {
  return {
    fullName: "",
    email: userEmail.trim(),
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    deliveryMethod: "standard",
    step: 1,
  };
}

export const useCheckoutStore = create<CheckoutStore>()(
  persist(
    (set) => ({
      drafts: {},

      updateDetails: (userEmail, details) =>
        set((state) => {
          const key = userEmail.trim().toLowerCase();

          if (!key) return state;

          const draft = {
            ...createCheckoutDraft(userEmail),
            ...state.drafts[key],
          };

          return {
            drafts: {
              ...state.drafts,
              [key]: {
                ...draft,
                ...details,
                step: 1,
              },
            },
          };
        }),

      setDeliveryMethod: (userEmail, method) =>
        set((state) => {
          const key = userEmail.trim().toLowerCase();

          if (
            !key ||
            (method !== "standard" && method !== "express")
          ) {
            return state;
          }

          const draft = {
            ...createCheckoutDraft(userEmail),
            ...state.drafts[key],
          };

          return {
            drafts: {
              ...state.drafts,
              [key]: {
                ...draft,
                deliveryMethod: method,
                step: 2,
              },
            },
          };
        }),

      setStep: (userEmail, step) =>
        set((state) => {
          const key = userEmail.trim().toLowerCase();

          if (
            !key ||
            !Number.isInteger(step) ||
            step < 1 ||
            step > 4
          ) {
            return state;
          }

          const draft = {
            ...createCheckoutDraft(userEmail),
            ...state.drafts[key],
          };

          return {
            drafts: {
              ...state.drafts,
              [key]: {
                ...draft,
                step,
              },
            },
          };
        }),

      clearDraft: (userEmail) =>
        set((state) => {
          const key = userEmail.trim().toLowerCase();
          const drafts = { ...state.drafts };

          delete drafts[key];

          return { drafts };
        }),
    }),
    {
      name: "shopsphere-checkout",
    }
  )
);