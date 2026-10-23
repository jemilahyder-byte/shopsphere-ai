type PricingItem = {
  price: number;
  quantity: number;
};

type DeliveryMethod = "standard" | "express";

export type CartTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string;
  couponValid: boolean;
};

export function calculateCartTotals(
  items: PricingItem[],
  coupon = "",
  deliveryMethod: DeliveryMethod = "standard"
): CartTotals {
  const normalizedCoupon = coupon.trim().toUpperCase();

  const couponValid =
    normalizedCoupon === "" ||
    normalizedCoupon === "SAVE10";

  const subtotalCents = items.reduce((sum, item) => {
    if (
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
    ) {
      throw new Error("Invalid cart price or quantity.");
    }

    return (
      sum +
      Math.round(item.price * 100) * item.quantity
    );
  }, 0);

  const discountCents =
    normalizedCoupon === "SAVE10"
      ? Math.round(subtotalCents * 0.1)
      : 0;

  const discountedCents = subtotalCents - discountCents;

  const standardShippingCents =
    items.length === 0 || discountedCents >= 10000
      ? 0
      : 500;

  const expressExtraCents =
    items.length > 0 && deliveryMethod === "express"
      ? 1000
      : 0;

  const shippingCents =
    standardShippingCents + expressExtraCents;

  const taxCents = Math.round(discountedCents * 0.05);

  const totalCents =
    discountedCents + shippingCents + taxCents;

  return {
    subtotal: subtotalCents / 100,
    discount: discountCents / 100,
    shipping: shippingCents / 100,
    tax: taxCents / 100,
    total: totalCents / 100,
    couponCode:
      normalizedCoupon === "SAVE10" ? "SAVE10" : "",
    couponValid,
  };
}