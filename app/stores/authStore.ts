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
  profileNames: Record<string, string>;

  login: (
    email: string,
    password: string
  ) => Promise<boolean>;

  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;

  updateProfile: (name: string) => void;
  logout: () => void;
};

function validateName(name: string): string {
  const cleanName = name.trim();

  if (cleanName.length < 2 || cleanName.length > 100) {
    throw new Error(
      "Enter a name between 2 and 100 characters."
    );
  }

  return cleanName;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],
      profileNames: {},

      login: async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();

        const demo =
          normalizedEmail === "customer@shopsphere.demo" &&
          password === "Customer123!"
            ? {
                name: "Demo Customer",
                role: "customer" as const,
              }
            : normalizedEmail === "admin@shopsphere.demo" &&
                password === "Admin123!"
              ? {
                  name: "Demo Admin",
                  role: "admin" as const,
                }
              : null;

        if (demo) {
          set({
            user: {
              name:
                get().profileNames[normalizedEmail] ??
                demo.name,
              email: normalizedEmail,
              role: demo.role,
            },
          });

          return true;
        }

        const account = get().accounts.find(
          (item) => item.email === normalizedEmail
        );

        if (!account) return false;

        const result = await hashPassword(
          password,
          account.salt
        );

        if (result !== account.passwordHash) {
          return false;
        }

        const latestAccount = get().accounts.find(
          (item) => item.email === normalizedEmail
        );

        if (!latestAccount) return false;

        set({
          user: {
            name:
              get().profileNames[normalizedEmail] ??
              latestAccount.name,
            email: latestAccount.email,
            role: "customer",
          },
        });

        return true;
      },

      register: async (name, email, password) => {
        const cleanName = validateName(name);
        const normalizedEmail = email.trim().toLowerCase();

        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            normalizedEmail
          )
        ) {
          throw new Error("Enter a valid email address.");
        }

        if (password.length < 8) {
          throw new Error(
            "Password must contain at least 8 characters."
          );
        }

        const exists = () =>
          normalizedEmail === "customer@shopsphere.demo" ||
          normalizedEmail === "admin@shopsphere.demo" ||
          get().accounts.some(
            (item) => item.email === normalizedEmail
          );

        if (exists()) {
          throw new Error(
            "An account with this email already exists."
          );
        }

        const salt = crypto.randomUUID();
        const passwordHash = await hashPassword(
          password,
          salt
        );

        if (exists()) {
          throw new Error(
            "An account with this email already exists."
          );
        }

        set((state) => ({
          accounts: [
            ...state.accounts,
            {
              name: cleanName,
              email: normalizedEmail,
              salt,
              passwordHash,
            },
          ],
          user: {
            name: cleanName,
            email: normalizedEmail,
            role: "customer",
          },
        }));
      },

      updateProfile: (name) => {
        const user = get().user;

        if (!user) {
          throw new Error(
            "Sign in before updating your profile."
          );
        }

        const cleanName = validateName(name);
        const email = user.email.trim().toLowerCase();

        set((state) => ({
          user: {
            ...user,
            name: cleanName,
          },
          accounts: state.accounts.map((account) =>
            account.email === email
              ? { ...account, name: cleanName }
              : account
          ),
          profileNames: {
            ...state.profileNames,
            [email]: cleanName,
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
        profileNames: state.profileNames,
      }),
      skipHydration: true,
    }
  )
);