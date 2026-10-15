"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { hashPassword } from "./password";

type User = {
  name: string;
  email: string;
  role: "customer" | "admin";
};

type Account = {
  name: string;
  email: string;
  salt: string;
  passwordHash: string;
};

type AuthStore = {
  user: User | null;
  accounts: Account[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],

      login: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();

        const demo =
          normalizedEmail === "customer@shopsphere.demo" &&
          password === "Customer123!"
            ? { name: "Demo Customer", role: "customer" as const }
            : normalizedEmail === "admin@shopsphere.demo" &&
                password === "Admin123!"
              ? { name: "Demo Admin", role: "admin" as const }
              : null;

        if (demo) {
          set({ user: { ...demo, email: normalizedEmail } });
          return true;
        }

        const account = get().accounts.find(
          (item) => item.email === normalizedEmail
        );

        if (!account) return false;

        const result = await hashPassword(password, account.salt);
        if (result !== account.passwordHash) return false;

        set({
          user: {
            name: account.name,
            email: account.email,
            role: "customer",
          },
        });
        return true;
      },

      register: async (name, email, password) => {
        const cleanName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (cleanName.length < 2) {
          throw new Error("Enter a name with at least 2 characters.");
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          throw new Error("Enter a valid email address.");
        }

        if (password.length < 8) {
          throw new Error("Password must contain at least 8 characters.");
        }

        const exists = () =>
          normalizedEmail === "customer@shopsphere.demo" ||
          normalizedEmail === "admin@shopsphere.demo" ||
          get().accounts.some((item) => item.email === normalizedEmail);

        if (exists()) {
          throw new Error("An account with this email already exists.");
        }

        const salt = crypto.randomUUID();
        const passwordHash = await hashPassword(password, salt);

        if (exists()) {
          throw new Error("An account with this email already exists.");
        }

        set((state) => ({
          accounts: [
            ...state.accounts,
            { name: cleanName, email: normalizedEmail, salt, passwordHash },
          ],
          user: {
            name: cleanName,
            email: normalizedEmail,
            role: "customer",
          },
        }));
      },

      logout: () => set({ user: null }),
    }),
    {
      name: "shopsphere-demo-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accounts: state.accounts,
      }),
      skipHydration: true,
    }
  )
);