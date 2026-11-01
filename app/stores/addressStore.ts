"use client";

import { create } from "zustand";
import {
  createJSONStorage,
  persist,
} from "zustand/middleware";
import { useAuthStore } from "./authStore";

export type AddressInput = {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type SavedAddress = AddressInput & {
  id: string;
  isDefault: boolean;
};

type AddressStore = {
  addressesByEmail: Record<string, SavedAddress[]>;

  addAddress: (input: AddressInput) => void;
  updateAddress: (id: string, input: AddressInput) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
};

function currentEmail(): string {
  const user = useAuthStore.getState().user;

  if (!user) {
    throw new Error("Sign in to manage your addresses.");
  }

  return user.email.trim().toLowerCase();
}

function validateAddress(input: AddressInput): AddressInput {
  const address: AddressInput = {
    label: input.label.trim(),
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    addressLine1: input.addressLine1.trim(),
    addressLine2: input.addressLine2.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    postalCode: input.postalCode.trim(),
    country: input.country.trim(),
  };

  if (!address.label || address.label.length > 50) {
    throw new Error(
      "Enter an address label between 1 and 50 characters."
    );
  }

  if (
    address.fullName.length < 2 ||
    address.fullName.length > 100
  ) {
    throw new Error(
      "Enter a full name between 2 and 100 characters."
    );
  }

  const phoneDigits = address.phone.replace(/\D/g, "");

  if (
    !/^\+?[\d\s()-]+$/.test(address.phone) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    throw new Error("Enter a valid phone number.");
  }

  if (
    address.addressLine1.length < 3 ||
    address.addressLine1.length > 200
  ) {
    throw new Error(
      "Enter an address between 3 and 200 characters."
    );
  }

  if (address.addressLine2.length > 200) {
    throw new Error(
      "Address line 2 must not exceed 200 characters."
    );
  }

  if (
    address.city.length < 2 ||
    address.city.length > 100
  ) {
    throw new Error("Enter a valid city.");
  }

  if (
    address.state.length < 2 ||
    address.state.length > 100
  ) {
    throw new Error("Enter a valid state or region.");
  }

  if (
    !/^[A-Za-z0-9][A-Za-z0-9 -]{1,19}$/.test(
      address.postalCode
    )
  ) {
    throw new Error("Enter a valid postal code.");
  }

  if (
    address.country.length < 2 ||
    address.country.length > 100
  ) {
    throw new Error("Enter a valid country.");
  }

  return address;
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set) => ({
      addressesByEmail: {},

      addAddress: (input) => {
        const email = currentEmail();
        const address = validateAddress(input);
        const id = crypto.randomUUID();

        set((store) => {
          const existing = store.addressesByEmail[email] ?? [];

          if (existing.length >= 20) {
            throw new Error(
              "You can save up to 20 addresses."
            );
          }

          return {
            addressesByEmail: {
              ...store.addressesByEmail,
              [email]: [
                ...existing,
                {
                  ...address,
                  id,
                  isDefault: existing.length === 0,
                },
              ],
            },
          };
        });
      },

      updateAddress: (id, input) => {
        const email = currentEmail();
        const address = validateAddress(input);

        set((store) => {
          const existing = store.addressesByEmail[email] ?? [];

          if (!existing.some((item) => item.id === id)) {
            throw new Error("Address not found.");
          }

          return {
            addressesByEmail: {
              ...store.addressesByEmail,
              [email]: existing.map((item) =>
                item.id === id
                  ? {
                      ...address,
                      id: item.id,
                      isDefault: item.isDefault,
                    }
                  : item
              ),
            },
          };
        });
      },

      removeAddress: (id) => {
        const email = currentEmail();

        set((store) => {
          const existing = store.addressesByEmail[email] ?? [];

          if (!existing.some((item) => item.id === id)) {
            throw new Error("Address not found.");
          }

          const remaining = existing.filter(
            (item) => item.id !== id
          );

          const hasDefault = remaining.some(
            (item) => item.isDefault
          );

          return {
            addressesByEmail: {
              ...store.addressesByEmail,
              [email]: remaining.map((item, index) => ({
                ...item,
                isDefault: hasDefault
                  ? item.isDefault
                  : index === 0,
              })),
            },
          };
        });
      },

      setDefaultAddress: (id) => {
        const email = currentEmail();

        set((store) => {
          const existing = store.addressesByEmail[email] ?? [];

          if (!existing.some((item) => item.id === id)) {
            throw new Error("Address not found.");
          }

          return {
            addressesByEmail: {
              ...store.addressesByEmail,
              [email]: existing.map((item) => ({
                ...item,
                isDefault: item.id === id,
              })),
            },
          };
        });
      },
    }),
    {
      name: "shopsphere-demo-addresses",
      storage: createJSONStorage(() => localStorage),
      partialize: (store) => ({
        addressesByEmail: store.addressesByEmail,
      }),
      skipHydration: true,
    }
  )
);