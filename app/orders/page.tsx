"use client";

import Link from "next/link";
import RequireAuth from "../components/RequireAuth";
import { useAuthStore } from "../stores/authStore";
import {
  ORDER_STATUSES,
  useOrderStore,
} from "../stores/orderStore";

export default function OrdersPage() {
  const user = useAuthStore((state) => state.user);
  const orders = useOrderStore((state) => state.orders);

  const userEmail = user?.email.trim().toLowerCase();

  const myOrders = orders.filter(
    (order) =>
      order.userEmail.trim().toLowerCase() === userEmail
  );

  return (
    <RequireAuth>
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="mb-6 text-3xl font-bold">
          My Orders
        </h1>

        <Link
          href="/"
          className="mb-6 inline-block underline"
        >
          Continue shopping
        </Link>

        {myOrders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          myOrders.map((order) => (
            <article
              key={order.id}
              className="mb-6 rounded border p-5"
            >
              <h2 className="break-all font-bold">
                Order: {order.id}
              </h2>

              <p className="mt-2">
                Status: {order.status}
              </p>

              <p>
                Date:{" "}
                {new Date(order.createdAt).toLocaleString()}
              </p>

              <section className="mt-5">
                <h3 className="mb-3 text-lg font-bold">
                  Products
                </h3>

                <ul className="space-y-3">
                  {order.items.map((item) => (
                    <li
                      key={JSON.stringify([
                        item.id,
                        item.size,
                        item.colour,
                      ])}
                      className="border-b pb-3"
                    >
                      <Link
                        href={"/products/" + item.id}
                        className="font-semibold underline"
                      >
                        {item.name}
                      </Link>

                      <p>Quantity: {item.quantity}</p>

                      {item.size && (
                        <p>Size: {item.size}</p>
                      )}

                      {item.colour && (
                        <p>Colour: {item.colour}</p>
                      )}

                      <p>
                        Subtotal: USD $
                        {(
                          item.price * item.quantity
                        ).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-5 space-y-2">
                <h3 className="text-lg font-bold">
                  Order totals
                </h3>

                {typeof order.subtotal === "number" && (
                  <p>
                    Subtotal: USD $
                    {order.subtotal.toFixed(2)}
                  </p>
                )}

                {typeof order.discount === "number" && (
                  <p>
                    Discount: −USD $
                    {order.discount.toFixed(2)}
                  </p>
                )}

                {order.couponCode && (
                  <p>Coupon: {order.couponCode}</p>
                )}

                {typeof order.shipping === "number" && (
                  <p>
                    Shipping: USD $
                    {order.shipping.toFixed(2)}
                  </p>
                )}

                {typeof order.tax === "number" && (
                  <p>
                    Demo tax: USD $
                    {order.tax.toFixed(2)}
                  </p>
                )}

                <p className="border-t pt-3 text-xl font-bold">
                  Total: USD ${order.total.toFixed(2)}
                </p>
              </section>

              <section className="mt-5">
                <h3 className="mb-2 text-lg font-bold">
                  Delivery details
                </h3>

                <p>{order.delivery.fullName}</p>
                <p>{order.delivery.email}</p>
                <p>{order.delivery.phone}</p>
                <p>{order.delivery.address}</p>
                <p>
                  {order.delivery.city},{" "}
                  {order.delivery.postalCode}
                </p>

                {order.deliveryMethod && (
                  <p className="mt-3">
                    Delivery option:{" "}
                    {order.deliveryMethod === "express"
                      ? "Express"
                      : "Standard"}
                  </p>
                )}

                {order.estimatedDeliveryAt && (
                  <p>
                    Estimated delivery:{" "}
                    {new Date(
                      order.estimatedDeliveryAt
                    ).toLocaleDateString()}
                  </p>
                )}
              </section>

              <section className="mt-5 rounded border p-4">
                <h3 className="mb-2 text-lg font-bold">
                  Payment
                </h3>

                <p>
                  {order.paymentStatus === "Demo paid"
                    ? "Demo payment successful"
                    : "Demo order — payment status not recorded"}
                </p>

                <p className="mt-2 text-sm text-gray-600">
                  No real money was taken.
                </p>
              </section>

              <section className="mt-5 rounded border p-4">
                <h3 className="mb-3 text-lg font-bold">
                  Demo delivery tracking
                </h3>

                <ol className="space-y-2">
  {ORDER_STATUSES.map((status, index) => {
    const currentIndex = ORDER_STATUSES.indexOf(
      order.status
    );

    const isComplete = index < currentIndex;
    const isCurrent = index === currentIndex;

    return (
      <li
        key={status}
        aria-current={isCurrent ? "step" : undefined}
        className={
          isCurrent
            ? "font-semibold text-blue-700"
            : isComplete
              ? "text-green-700"
              : "text-gray-600"
        }
      >
        {index + 1}. {status} —{" "}
        {isComplete
          ? "Complete"
          : isCurrent
            ? status === "Delivered"
              ? "Complete"
              : "Current status"
            : "Pending"}
      </li>
    );
  })}
</ol>

{order.statusUpdatedAt && (
  <p className="mt-3 text-sm">
    Last updated:{" "}
    {new Date(order.statusUpdatedAt).toLocaleString()}
  </p>
)}

                <p className="mt-3 text-sm text-gray-600">
                  This is a demo tracking display.
                  It is not connected to a courier.
                </p>
              </section>
            </article>
          ))
        )}
      </main>
    </RequireAuth>
  );
}