"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import {
  useAddressStore,
  type AddressInput,
  type SavedAddress,
} from "../stores/addressStore";

const emptyAddress: AddressInput = {
  label: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

const fields: {
  key: keyof AddressInput;
  label: string;
  autoComplete: string;
  maxLength: number;
}[] = [
  {
    key: "label",
    label: "Label (Home / Work)",
    autoComplete: "off",
    maxLength: 50,
  },
  {
    key: "fullName",
    label: "Full name",
    autoComplete: "name",
    maxLength: 100,
  },
  {
    key: "phone",
    label: "Phone",
    autoComplete: "tel",
    maxLength: 30,
  },
  {
    key: "addressLine1",
    label: "Address line 1",
    autoComplete: "address-line1",
    maxLength: 200,
  },
  {
    key: "addressLine2",
    label: "Address line 2 (optional)",
    autoComplete: "address-line2",
    maxLength: 200,
  },
  {
    key: "city",
    label: "City",
    autoComplete: "address-level2",
    maxLength: 100,
  },
  {
    key: "state",
    label: "State / Region",
    autoComplete: "address-level1",
    maxLength: 100,
  },
  {
    key: "postalCode",
    label: "Postal code",
    autoComplete: "postal-code",
    maxLength: 20,
  },
  {
    key: "country",
    label: "Country",
    autoComplete: "country-name",
    maxLength: 100,
  },
];

function AddressEditor({ email }: { email: string }) {
  const [form, setForm] = useState<AddressInput>({
    ...emptyAddress,
  });
  const [editingId, setEditingId] = useState<string | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const addressesByEmail = useAddressStore(
    (store) => store.addressesByEmail
  );
  const addAddress = useAddressStore(
    (store) => store.addAddress
  );
  const updateAddress = useAddressStore(
    (store) => store.updateAddress
  );
  const removeAddress = useAddressStore(
    (store) => store.removeAddress
  );
  const setDefaultAddress = useAddressStore(
    (store) => store.setDefaultAddress
  );

  const addresses = addressesByEmail[email] ?? [];

  function resetForm() {
    setForm({ ...emptyAddress });
    setEditingId(null);
  }

  function runAction(
    action: () => void,
    success: string
  ): boolean {
    setMessage("");
    setError("");

    try {
      const user = useAuthStore.getState().user;

      if (user?.email.trim().toLowerCase() !== email) {
        throw new Error(
          "Your account changed. Refresh this page."
        );
      }

      action();
      setMessage(success);
      return true;
    } catch (problem) {
      setError(
        problem instanceof Error
          ? problem.message
          : "Unable to save address changes."
      );
      return false;
    }
  }

  function editAddress(address: SavedAddress) {
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
    });

    setEditingId(address.id);
    setMessage("");
    setError("");

    document
      .getElementById("saved-address-label")
      ?.focus();
  }

  return (
    <section
      aria-labelledby="addresses-title"
      className="mt-8 rounded border p-5"
    >
      <h2
        id="addresses-title"
        className="text-xl font-bold"
      >
        My addresses
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Saved for your account in this browser.
        Use demo contact details.
      </p>

      <h3 className="mt-5 font-semibold">
        {editingId ? "Edit address" : "Add address"}
      </h3>

      <form
        className="mt-3 grid gap-4 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();

          const saved = runAction(
            () => {
              if (editingId) {
                updateAddress(editingId, form);
              } else {
                addAddress(form);
              }
            },
            editingId
              ? "Address updated."
              : "Address added."
          );

          if (saved) resetForm();
        }}
      >
        {fields.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={"saved-address-" + field.key}
              className="block"
            >
              {field.label}
            </label>

            <input
              id={"saved-address-" + field.key}
              type={field.key === "phone" ? "tel" : "text"}
              autoComplete={field.autoComplete}
              maxLength={field.maxLength}
              required={field.key !== "addressLine2"}
              value={form[field.key]}
              onChange={(event) => {
                const value = event.target.value;

                setForm((current) => ({
                  ...current,
                  [field.key]: value,
                }));

                setMessage("");
                setError("");
              }}
              className="mt-1 w-full rounded border p-3"
            />
          </div>
        ))}

        <div className="flex flex-wrap gap-3 sm:col-span-2">
          <button
            type="submit"
            className="rounded bg-blue-700 px-4 py-2 text-white"
          >
            {editingId ? "Save changes" : "Add address"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setMessage("");
                setError("");
              }}
              className="rounded border px-4 py-2"
            >
              Cancel editing
            </button>
          )}
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

      <div className="mt-6 space-y-4">
        {addresses.length === 0 ? (
          <p>No saved addresses yet.</p>
        ) : (
          addresses.map((address) => (
            <article
              key={address.id}
              className="rounded border p-4"
            >
              <h3 className="break-words font-semibold">
                {address.label}
                {address.isDefault ? " — Default" : ""}
              </h3>

              <address className="mt-2 break-words not-italic">
                <p>{address.fullName}</p>
                <p>{address.addressLine1}</p>

                {address.addressLine2 && (
                  <p>{address.addressLine2}</p>
                )}

                <p>
                  {address.city}, {address.state}{" "}
                  {address.postalCode}
                </p>

                <p>{address.country}</p>
                <p>Phone: {address.phone}</p>
              </address>

              <div className="mt-3 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => editAddress(address)}
                  aria-label={"Edit " + address.label}
                  className="underline"
                >
                  Edit
                </button>

                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() =>
                      runAction(
                        () => setDefaultAddress(address.id),
                        "Default address updated."
                      )
                    }
                    className="underline"
                  >
                    Set as default
                  </button>
                )}

                <button
                  type="button"
                  aria-label={"Delete " + address.label}
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Delete this saved address?"
                      )
                    ) {
                      return;
                    }

                    const removed = runAction(
                      () => removeAddress(address.id),
                      "Address deleted."
                    );

                    if (
                      removed &&
                      editingId === address.id
                    ) {
                      resetForm();
                    }
                  }}
                  className="text-red-700 underline"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default function AddressManager() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const user = useAuthStore((store) => store.user);

  useEffect(() => {
    let active = true;

    async function restoreAddresses() {
      try {
        if (!useAddressStore.persist.hasHydrated()) {
          await useAddressStore.persist.rehydrate();
        }

        if (!useAddressStore.persist.hasHydrated()) {
          throw new Error("Unable to restore addresses.");
        }

        if (active) setReady(true);
      } catch {
        if (active) setError(true);
      }
    }

    void restoreAddresses();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <p role="alert" className="mt-6">
        Unable to restore saved addresses.
        Refresh the page and try again.
      </p>
    );
  }

  if (!ready) {
    return (
      <p role="status" className="mt-6">
        Loading addresses...
      </p>
    );
  }

  if (!user) return null;

  const email = user.email.trim().toLowerCase();

  return <AddressEditor key={email} email={email} />;
}