"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import RequireAuth from "../components/RequireAuth";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useOrderStore } from "../stores/orderStore";
import {
  createCheckoutDraft,
  useCheckoutStore,
} from "../stores/checkoutStore";
import { calculateCartTotals } from "../stores/cartTotals";

const fields = [
  {
    name: "fullName",
    label: "Full name",
    type: "text",
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    autoComplete: "email",
  },
  {
    name: "phone",
    label: "Phone",
    type: "tel",
    autoComplete: "tel",
  },
  {
    name: "address",
    label: "Address",
    type: "text",
    autoComplete: "street-address",
  },
  {
    name: "city",
    label: "City",
    type: "text",
    autoComplete: "address-level2",
  },
  {
    name: "postalCode",
    label: "Postal code",
    type: "text",
    autoComplete: "postal-code",
  },
] as const;

export default function CheckoutPage() {
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paymentResult, setPaymentResult] = useState("success");
  const [confirmation, setConfirmation] = useState<{
    id: string;
    email: string;
    total: number;
  } | null>(null);

  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const couponCode = useCartStore((state) => state.couponCode);

  const accountEmail = user?.email ?? "";
  const accountKey = accountEmail.trim().toLowerCase();

  const savedDraft = useCheckoutStore(
    (state) => state.drafts[accountKey]
  );
  const updateDetails = useCheckoutStore(
    (state) => state.updateDetails
  );
  const setDeliveryMethod = useCheckoutStore(
    (state) => state.setDeliveryMethod
  );
  const setStep = useCheckoutStore((state) => state.setStep);

  const draft = {
    ...createCheckoutDraft(accountEmail),
    ...savedDraft,
  };

  const detailsComplete = fields.every(
    (field) => draft[field.name].trim().length > 0
  );

  const step = detailsComplete ? draft.step : 1;

  const totals = calculateCartTotals(
    items,
    couponCode,
    draft.deliveryMethod
  );

  function goToStep(next: 1 | 2 | 3 | 4) {
    setError("");
    setStep(accountEmail, next);
  }

  async function submitOrder() {
    if (submitting.current) return;

    const currentUser = useAuthStore.getState().user;
    const cart = useCartStore.getState();

    if (
      !currentUser ||
      currentUser.email !== accountEmail ||
      cart.items.length === 0
    ) {
      setError("Please sign in and review your cart.");
      return;
    }

    const currentDraft = {
      ...createCheckoutDraft(currentUser.email),
      ...useCheckoutStore.getState().drafts[accountKey],
    };

    const delivery = {
      fullName: currentDraft.fullName.trim(),
      email: currentDraft.email.trim(),
      phone: currentDraft.phone.trim(),
      address: currentDraft.address.trim(),
      city: currentDraft.city.trim(),
      postalCode: currentDraft.postalCode.trim(),
    };

    if (
      Object.values(delivery).some((value) => !value) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(delivery.email)
    ) {
      setError("Complete your delivery details with a valid email.");
      setStep(accountEmail, 1);
      return;
    }

    if (currentDraft.step !== 4) {
      setError("Please review your order before payment.");
      return;
    }

    if (paymentResult === "declined") {
      setError(
        "Demo payment declined. Your cart and details are saved. Select Successful payment and retry."
      );
      return;
    }

    const orderItems = cart.items.map((item) => ({ ...item }));
    const orderCoupon = cart.couponCode;
    const snapshot = JSON.stringify({
      items: orderItems,
      couponCode: orderCoupon,
    });
    const draftSnapshot = JSON.stringify(currentDraft);

    submitting.current = true;
    setBusy(true);
    setError("");

    try {
      const pricing = calculateCartTotals(
        orderItems,
        orderCoupon,
        currentDraft.deliveryMethod
      );

      if (!pricing.couponValid) {
        throw new Error("Invalid coupon. Return to your cart.");
      }

      const ids = [...new Set(orderItems.map((item) => item.id))];

      await Promise.all(
        ids.map(async (id) => {
          const response = await fetch(
            "https://dummyjson.com/products/" + id,
            {
              cache: "no-store",
              signal: AbortSignal.timeout(15000),
            }
          );

          if (!response.ok) {
            throw new Error(
              "Unable to confirm stock. Please retry."
            );
          }

          const product = await response.json();

          if (
            product.id !== id ||
            !Number.isInteger(product.stock) ||
            product.stock < 0
          ) {
            throw new Error("Invalid stock information.");
          }

          const quantity = orderItems
            .filter((item) => item.id === id)
            .reduce((sum, item) => sum + item.quantity, 0);

          if (product.stock === 0 || quantity > product.stock) {
            const item = orderItems.find(
              (entry) => entry.id === id
            );

            throw new Error(
              (item?.name ?? "Product") +
                ": only " +
                product.stock +
                " available. Update your cart."
            );
          }
        })
      );

      const latestUser = useAuthStore.getState().user;
      const latestCart = useCartStore.getState();
      const latestDraft = {
        ...createCheckoutDraft(currentUser.email),
        ...useCheckoutStore.getState().drafts[accountKey],
      };

      if (latestUser?.email !== currentUser.email) {
        throw new Error("Your sign-in changed. Please retry.");
      }

      if (
        JSON.stringify({
          items: latestCart.items,
          couponCode: latestCart.couponCode,
        }) !== snapshot ||
        JSON.stringify(latestDraft) !== draftSnapshot
      ) {
        throw new Error(
          "Your cart or delivery details changed. Review and retry."
        );
      }

      const id = useOrderStore.getState().placeOrder(
        currentUser.email,
        orderItems,
        delivery,
        orderCoupon,
        {
          deliveryMethod: currentDraft.deliveryMethod,
          paymentStatus: "Demo paid",
        }
      );

      setConfirmation({
        id,
        email: accountKey,
        total: pricing.total,
      });

      useCheckoutStore.getState().clearDraft(currentUser.email);
      useCartStore.getState().clearCart();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to place order. Please retry."
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const buttonClass =
    "rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-40";

  return (
    <RequireAuth>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

        {confirmation?.email === accountKey ? (
          <section className="rounded border p-6">
            <h2 className="mb-3 text-2xl font-bold">
              Order confirmed
            </h2>
            <p className="break-all">
              Order ID: {confirmation.id}
            </p>
            <p className="mt-2 font-bold">
              Total: USD ${confirmation.total.toFixed(2)}
            </p>
            <p className="mt-3">
              Demo payment successful. No money was taken.
            </p>
            <p>Your order is saved in My Orders.</p>
            <Link
              href="/orders"
              className="mt-4 inline-block underline"
            >
              View My Orders
            </Link>
          </section>
        ) : items.length === 0 ? (
          <p>
            Your cart is empty.{" "}
            <Link href="/" className="underline">
              Continue shopping
            </Link>
          </p>
        ) : (
          <>
            <ol className="mb-6 flex flex-wrap gap-4">
              {["Details", "Delivery", "Review", "Payment"].map(
                (label, index) => (
                  <li
                    key={label}
                    aria-current={
                      step === index + 1 ? "step" : undefined
                    }
                    className={
                      step === index + 1
                        ? "font-bold text-blue-700"
                        : "text-gray-600"
                    }
                  >
                    {index + 1}. {label}
                  </li>
                )
              )}
            </ol>

            <div className="grid gap-8 md:grid-cols-2">
              <section>
                <p className="mb-4 text-sm text-gray-600">
                  Progress is saved in this browser for your
                  account. Use demo details.
                </p>

                {error && (
                  <p
                    role="alert"
                    className="mb-4 rounded border border-red-400 p-3 text-red-700"
                  >
                    {error}
                  </p>
                )}

                <fieldset disabled={busy}>
                  {step === 1 && (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => {
                        event.preventDefault();

                        if (!detailsComplete) {
                          setError("Complete every field.");
                          return;
                        }

                        goToStep(2);
                      }}
                    >
                      <h2 className="text-xl font-bold">
                        Customer and address details
                      </h2>

                      {fields.map((field) => (
                        <label
                          key={field.name}
                          className="block"
                        >
                          {field.label}
                          <input
                            name={field.name}
                            type={field.type}
                            autoComplete={field.autoComplete}
                            value={draft[field.name]}
                            required
                            onChange={(event) =>
                              updateDetails(accountEmail, {
                                [field.name]: event.target.value,
                              })
                            }
                            className="mt-1 w-full rounded border p-3"
                          />
                        </label>
                      ))}

                      <button
                        type="submit"
                        className={buttonClass}
                      >
                        Continue to Delivery
                      </button>
                    </form>
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">
                        Choose delivery
                      </h2>

                      <label className="block rounded border p-4">
                        <input
                          type="radio"
                          name="delivery"
                          checked={
                            draft.deliveryMethod === "standard"
                          }
                          onChange={() =>
                            setDeliveryMethod(
                              accountEmail,
                              "standard"
                            )
                          }
                        />{" "}
                        Standard — estimated 5 days
                        <p className="mt-2 text-sm">
                          $5, or free for products totalling
                          at least $100 after discount.
                        </p>
                      </label>

                      <label className="block rounded border p-4">
                        <input
                          type="radio"
                          name="delivery"
                          checked={
                            draft.deliveryMethod === "express"
                          }
                          onChange={() =>
                            setDeliveryMethod(
                              accountEmail,
                              "express"
                            )
                          }
                        />{" "}
                        Express — estimated 2 days
                        <p className="mt-2 text-sm">
                          Standard shipping charge plus $10.
                        </p>
                      </label>

                      <p className="text-sm">
                        Delivery estimates are for this demo.
                      </p>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => goToStep(1)}
                          className="underline"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => goToStep(3)}
                          className={buttonClass}
                        >
                          Review Order
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">
                        Review your order
                      </h2>
                      <p>{draft.fullName}</p>
                      <p>{draft.email}</p>
                      <p>{draft.phone}</p>
                      <p>
                        {draft.address}, {draft.city},{" "}
                        {draft.postalCode}
                      </p>
                      <p>
                        Delivery: {draft.deliveryMethod}
                      </p>
                      <p>
                        Check your details and the order
                        summary before continuing.
                      </p>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => goToStep(2)}
                          className="underline"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={!totals.couponValid}
                          onClick={() => goToStep(4)}
                          className={buttonClass}
                        >
                          Continue to Demo Payment
                        </button>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold">
                        Demo payment
                      </h2>
                      <p>
                        No real payment or card details are
                        required. Choose a test result.
                      </p>

                      <label className="block">
                        Test payment result
                        <select
                          value={paymentResult}
                          onChange={(event) =>
                            setPaymentResult(event.target.value)
                          }
                          className="mt-1 w-full rounded border p-3"
                        >
                          <option value="success">
                            Successful payment
                          </option>
                          <option value="declined">
                            Declined payment
                          </option>
                        </select>
                      </label>

                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => goToStep(3)}
                          className="underline"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          disabled={busy || !totals.couponValid}
                          onClick={() => void submitOrder()}
                          className={buttonClass}
                        >
                          {busy
                            ? "Checking stock..."
                            : "Pay Demo & Place Order"}
                        </button>
                      </div>
                    </div>
                  )}
                </fieldset>
              </section>

              <section className="self-start rounded border p-5">
                <h2 className="mb-4 text-xl font-bold">
                  Order summary
                </h2>

                {items.map((item) => (
                  <div
                    key={JSON.stringify([
                      item.id,
                      item.size,
                      item.colour,
                    ])}
                    className="mb-3 border-b pb-3"
                  >
                    <p className="font-semibold">
                      {item.name}
                    </p>
                    {item.size && <p>Size: {item.size}</p>}
                    {item.colour && (
                      <p>Colour: {item.colour}</p>
                    )}
                    <p>Quantity: {item.quantity}</p>
                    <p>
                      USD $
                      {(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="space-y-2">
                  <p>
                    Subtotal: USD $
                    {totals.subtotal.toFixed(2)}
                  </p>
                  <p>
                    Discount: −USD $
                    {totals.discount.toFixed(2)}
                  </p>
                  {totals.couponCode && (
                    <p>Coupon: {totals.couponCode}</p>
                  )}
                  <p>Delivery: {draft.deliveryMethod}</p>
                  <p>
                    Shipping: USD $
                    {totals.shipping.toFixed(2)}
                  </p>
                  <p>
                    Demo tax (5%): USD $
                    {totals.tax.toFixed(2)}
                  </p>
                  <p className="border-t pt-3 text-xl font-bold">
                    Total: USD ${totals.total.toFixed(2)}
                  </p>
                </div>

                {!totals.couponValid && (
                  <p role="alert" className="mt-3 text-red-700">
                    Invalid coupon. Return to your cart.
                  </p>
                )}

                <p className="mt-3 text-sm text-gray-600">
                  Demo tax applies to products after
                  discount. Express adds $10 to standard
                  shipping.
                </p>

                <Link
                  href="/cart"
                  className="mt-4 block underline"
                >
                  Back to Cart
                </Link>
              </section>
            </div>
          </>
        )}
      </main>
    </RequireAuth>
  );
}