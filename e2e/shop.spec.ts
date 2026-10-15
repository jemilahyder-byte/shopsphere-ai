import { test, expect } from "@playwright/test";

test("search products and add to cart", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "ShopSphere AI", exact: true })
  ).toBeVisible();

  const search = page.getByPlaceholder("Search products...");
  await search.fill("watch");
  await expect(page.getByText("Smart Watch", { exact: true })).toBeVisible();
  await expect(page.getByText("Wireless Headphones", { exact: true })).toBeHidden();

  await page.getByRole("button", { name: "Add to Cart" }).click();
  await expect(page.getByText("Cart: 1 items", { exact: true })).toBeVisible();

  await search.fill("xyz");
  await expect(page.getByText("No products found.", { exact: true })).toBeVisible();
});