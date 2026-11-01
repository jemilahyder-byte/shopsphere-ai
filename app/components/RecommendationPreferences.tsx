"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  DEFAULT_PREFERENCES,
  usePreferenceStore,
} from "../stores/preferenceStore";

function PreferencesForm({ email }: { email: string }) {
  const preferencesByEmail = usePreferenceStore(
    (store) => store.preferencesByEmail
  );
  const savePreferences = usePreferenceStore(
    (store) => store.savePreferences
  );
  const resetPreferences = usePreferenceStore(
    (store) => store.resetPreferences
  );

  const saved =
    preferencesByEmail[email] ?? DEFAULT_PREFERENCES;

  const [enabled, setEnabled] = useState(saved.enabled);
  const [categories, setCategories] = useState(
    saved.preferredCategories.join(", ")
  );
  const [maxPrice, setMaxPrice] = useState(
    saved.maxPrice === null ? "" : String(saved.maxPrice)
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function checkAccount() {
    const user = useAuthStore.getState().user;

    if (user?.email.trim().toLowerCase() !== email) {
      throw new Error(
        "Your account changed. Refresh this page."
      );
    }
  }

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function showError(problem: unknown) {
    setError(
      problem instanceof Error
        ? problem.message
        : "Unable to update preferences."
    );
  }

  return (
    <section
      aria-labelledby="recommendation-preferences-title"
      className="mt-8 rounded border p-5"
    >
      <h2
        id="recommendation-preferences-title"
        className="text-xl font-bold"
      >
        Recommendation preferences
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        These settings control your personalized
        recommendations. Saved for your account in this
        browser.
      </p>

      <form
        className="mt-4 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          clearMessages();

          try {
            checkAccount();

            const preferredCategories = categories
              .split(",")
              .map((category) => category.trim())
              .filter(Boolean);

            const budget =
              maxPrice.trim() === ""
                ? null
                : Number(maxPrice);

            savePreferences({
              enabled,
              preferredCategories,
              maxPrice: budget,
            });

            const updated =
              usePreferenceStore.getState()
                .preferencesByEmail[email];

            setCategories(
              updated.preferredCategories.join(", ")
            );
            setMaxPrice(
              updated.maxPrice === null
                ? ""
                : String(updated.maxPrice)
            );
            setMessage("Preferences saved.");
          } catch (problem) {
            showError(problem);
          }
        }}
      >
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => {
              setEnabled(event.target.checked);
              clearMessages();
            }}
            className="h-4 w-4"
          />
          Enable personalized recommendations
        </label>

        <div>
          <label
            htmlFor="preferred-categories"
            className="block"
          >
            Preferred categories
          </label>

          <input
            id="preferred-categories"
            type="text"
            value={categories}
            maxLength={2000}
            onChange={(event) => {
              setCategories(event.target.value);
              clearMessages();
            }}
            placeholder="beauty, fragrances, furniture"
            aria-describedby="preferred-categories-help"
            className="mt-1 w-full rounded border p-3"
          />

          <p
            id="preferred-categories-help"
            className="mt-2 text-sm text-gray-600"
          >
            Enter category names separated by commas.
            Use catalog names such as beauty, fragrances,
            furniture, or mens-shoes. Leave blank for all
            categories.
          </p>
        </div>

        <div>
          <label
            htmlFor="recommendation-max-price"
            className="block"
          >
            Maximum product price (USD)
          </label>

          <input
            id="recommendation-max-price"
            type="number"
            min="0"
            step="0.01"
            value={maxPrice}
            onChange={(event) => {
              setMaxPrice(event.target.value);
              clearMessages();
            }}
            placeholder="No price limit"
            aria-describedby="recommendation-budget-help"
            className="mt-1 w-full rounded border p-3"
          />

          <p
            id="recommendation-budget-help"
            className="mt-2 text-sm text-gray-600"
          >
            Leave blank for no price limit.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded bg-blue-700 px-4 py-2 text-white"
          >
            Save preferences
          </button>

          <button
            type="button"
            onClick={() => {
              clearMessages();

              try {
                checkAccount();
                resetPreferences();

                setEnabled(DEFAULT_PREFERENCES.enabled);
                setCategories("");
                setMaxPrice("");
                setMessage("Default preferences restored.");
              } catch (problem) {
                showError(problem);
              }
            }}
            className="rounded border px-4 py-2"
          >
            Reset preferences
          </button>
        </div>
      </form>

      {message && (
        <p role="status" className="mt-4">
          {message}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}

export default function RecommendationPreferences() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const user = useAuthStore((store) => store.user);

  useEffect(() => {
    let active = true;

    async function restorePreferences() {
      try {
        if (!usePreferenceStore.persist.hasHydrated()) {
          await usePreferenceStore.persist.rehydrate();
        }

        if (!usePreferenceStore.persist.hasHydrated()) {
          throw new Error(
            "Unable to restore preferences."
          );
        }

        if (active) setReady(true);
      } catch {
        if (active) setError(true);
      }
    }

    void restorePreferences();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="mt-6">
        Unable to restore recommendation preferences.
        Refresh the page and try again.
      </p>
    );
  }

  if (!ready) {
    return (
      <p role="status" className="mt-6">
        Loading recommendation preferences...
      </p>
    );
  }

  if (!user) return null;

  const email = user.email.trim().toLowerCase();

  return <PreferencesForm key={email} email={email} />;
}