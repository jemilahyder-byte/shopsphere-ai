"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type User = {
  name: string;
  email: string;
  role: "customer" | "admin";
};

type AuthStore = {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,

      login: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (
          normalizedEmail === "customer@shopsphere.demo" &&
          password === "Customer123!"
        ) {
          set({
            user: {
              name: "Demo Customer",
              email: normalizedEmail,
              role: "customer",
            },
          });
          return true;
        }

        if (
          normalizedEmail === "admin@shopsphere.demo" &&
          password === "Admin123!"
        ) {
          set({
            user: {
              name: "Demo Admin",
              email: normalizedEmail,
              role: "admin",
            },
          });
          return true;
        }

        return false;
      },

      logout: () => set({ user: null }),
    }),
    {
      name: "shopsphere-demo-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user }),
      skipHydration: true,
    }
  )
);