import {
  test,
  expect,
  type Page,
} from "@playwright/test";

const products = [
  {
    id: 1,
    title: "Test Rose Perfume",
    description: "A floral perfume.",
    price: 40,
    rating: 4.8,
    category: "fragrances",
    stock: 20,
    thumbnail: "/favicon.ico",
    images: ["/favicon.ico"],
  },
  {
    id: 2,
    title: "Test Citrus Perfume",
    description: "A citrus perfume.",
    price: 20,
    rating: 4.2,
    category: "fragrances",
    stock: 20,
    thumbnail: "/favicon.ico",
    images: ["/favicon.ico"],
  },
  {
    id: 3,
    title: "Test Beauty Cream",
    description: "A beauty cream.",
    price: 10,
    rating: 4.6,
    category: "beauty",
    stock: 20,
    thumbnail: "/favicon.ico",
    images: ["/favicon.ico"],
  },
  {
    id: 4,
    title: "Test Wooden Chair",
    description: "A wooden chair.",
    price: 100,
    rating: 3.5,
    category: "furniture",
    stock: 20,
    thumbnail: "/favicon.ico",
    images: ["/favicon.ico"],
  },
  {
    id: 5,
    title: "Test Reading Lamp",
    description: "A reading lamp.",
    price: 30,
    rating: 4.1,
    category: "furniture",
    stock: 20,
    thumbnail: "/favicon.ico",
    images: ["/favicon.ico"],
  },
];

function catalog(page: Page) {
  return page.locator("section").filter({
    has: page.getByRole("heading", {
      name: "Featured Products",
      exact: true,
    }),
  });
}

function productCard(page: Page, name: string) {
  return catalog(page).getByRole("article").filter({
    has: page.getByRole("heading", {
      name,
      exact: true,
    }),
  });
}

test.beforeEach(async ({ page }) => {
  await page.route(
    "https://dummyjson.com/products?*",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          products,
          total: products.length,
          skip: 0,
          limit: products.length,
        }),
      });
    }
  );

  await page.goto("/");

  await expect(
    catalog(page).getByRole("heading", {
      name: "Featured Products",
      exact: true,
    })
  ).toBeVisible();

  await expect(
    catalog(page).getByText("5 products found", {
      exact: true,
    })
  ).toBeVisible();
});

test("search, add to cart, refresh and empty results", async ({
  page,
}) => {
  const shop = catalog(page);
  const search = shop.getByRole("combobox", {
    name: "Search products",
  });

  await search.fill("Rose Perfume");

  await expect(
    shop.getByRole("article")
  ).toHaveCount(1);

  await expect(
    shop.getByRole("heading", {
      name: "Test Rose Perfume",
      exact: true,
    })
  ).toBeVisible();

  await productCard(page, "Test Rose Perfume")
    .getByRole("button", {
      name: "Add to Cart",
      exact: true,
    })
    .click();

  await expect(
    shop.getByRole("link", {
      name: "Cart: 1 item",
      exact: true,
    })
  ).toBeVisible();

  await page.reload();

  await expect(
    catalog(page).getByRole("link", {
      name: "Cart: 1 item",
      exact: true,
    })
  ).toBeVisible();

  await catalog(page)
    .getByRole("combobox", {
      name: "Search products",
    })
    .fill("no-such-product-xyz");

  await expect(
    catalog(page).getByRole("article")
  ).toHaveCount(0);

  await expect(
    catalog(page).getByText("No products found.", {
      exact: true,
    })
  ).toBeVisible();
});

test("category, price, rating, sorting and reset filters", async ({
  page,
}) => {
  const shop = catalog(page);

  await shop.getByLabel("Category", {
    exact: true,
  }).selectOption("fragrances");

  await expect(
    shop.getByRole("article")
  ).toHaveCount(2);

  await shop.getByLabel("Sort by", {
    exact: true,
  }).selectOption("price-low");

  await expect(
    shop.getByRole("article")
      .first()
      .getByRole("heading")
  ).toHaveText("Test Citrus Perfume");

  await shop
    .getByLabel("Maximum price (USD)", {
      exact: true,
    })
    .fill("25");

  await expect(
    shop.getByRole("article")
  ).toHaveCount(1);

  await expect(
    shop.getByRole("article").getByRole("heading")
  ).toHaveText("Test Citrus Perfume");

  await shop.getByLabel("Minimum rating", {
    exact: true,
  }).selectOption("4.5");

  await expect(
    shop.getByText("No products found.", {
      exact: true,
    })
  ).toBeVisible();

  await shop.getByRole("button", {
    name: "Reset filters",
    exact: true,
  }).click();

  await expect(
    shop.getByRole("article")
  ).toHaveCount(5);

  await expect(
    shop.getByLabel("Category", { exact: true })
  ).toHaveValue("all");

  await expect(
    shop.getByLabel("Maximum price (USD)", {
      exact: true,
    })
  ).toHaveValue("");

  await expect(
    shop.getByLabel("Minimum rating", {
      exact: true,
    })
  ).toHaveValue("0");

  await expect(
    shop.getByLabel("Sort by", { exact: true })
  ).toHaveValue("default");
});

test("opens Quick View and closes it with Escape", async ({
  page,
}) => {
  await productCard(page, "Test Rose Perfume")
    .getByRole("button", {
      name: "Quick View",
      exact: true,
    })
    .click();

  const dialog = page.getByRole("dialog", {
    name: "Test Rose Perfume",
    exact: true,
  });

  await expect(dialog).toBeVisible();

  await expect(
    dialog.getByText("USD $40.00", {
      exact: true,
    })
  ).toBeVisible();

  await dialog.getByRole("button", {
    name: "Add to Cart",
    exact: true,
  }).click();

  await dialog.getByRole("button", {
    name: "Close",
    exact: true,
  }).focus();

  await page.keyboard.press("Escape");

  await expect(dialog).toHaveCount(0);

  await expect(
    catalog(page).getByRole("link", {
      name: "Cart: 1 item",
      exact: true,
    })
  ).toBeVisible();
});

test("compares two to four products and clears comparison", async ({
  page,
}) => {
  const shop = catalog(page);

  await shop.getByRole("checkbox", {
    name: "Compare Test Rose Perfume",
    exact: true,
  }).check();

  await expect(
    shop.getByText(
      "Select at least 2 products to compare.",
      { exact: true }
    )
  ).toBeVisible();

  await shop.getByRole("checkbox", {
    name: "Compare Test Citrus Perfume",
    exact: true,
  }).check();

  const table = shop.getByRole("table", {
    name: "Selected products comparison",
    exact: true,
  });

  await expect(table).toBeVisible();

  await expect(
    table.getByRole("row")
  ).toHaveCount(3);

  await shop.getByRole("checkbox", {
    name: "Compare Test Beauty Cream",
    exact: true,
  }).check();

  await shop.getByRole("checkbox", {
    name: "Compare Test Wooden Chair",
    exact: true,
  }).check();

  await expect(
    table.getByRole("row")
  ).toHaveCount(5);

  await expect(
    shop.getByRole("checkbox", {
      name: "Compare Test Reading Lamp",
      exact: true,
    })
  ).toBeDisabled();

  await shop.getByRole("button", {
    name: "Clear comparison",
    exact: true,
  }).click();

  await expect(table).toHaveCount(0);

  await expect(
    shop.getByRole("checkbox", {
      checked: true,
    })
  ).toHaveCount(0);

  await expect(
    shop.getByRole("checkbox", {
      name: "Compare Test Reading Lamp",
      exact: true,
    })
  ).toBeEnabled();
});