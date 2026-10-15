import { test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

test("renders the ShopSphere heading", () => {
  render(<h1>ShopSphere AI</h1>);
  expect(
    screen.getByRole("heading", { name: "ShopSphere AI" })
  ).toBeInTheDocument();
});