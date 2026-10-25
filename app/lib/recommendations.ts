export type RecommendationProduct = {
  id: number;
  name: string;
  price: number;
  thumbnail: string;
  category: string;
  rating: number;
};

function uniqueProducts(
  products: RecommendationProduct[]
): RecommendationProduct[] {
  const seen = new Set<number>();

  return products.filter((product) => {
    if (seen.has(product.id)) return false;
    seen.add(product.id);
    return true;
  });
}

function validLimit(limit: number): boolean {
  return Number.isInteger(limit) && limit > 0;
}

function rankByRating(
  a: RecommendationProduct,
  b: RecommendationProduct
): number {
  return (
    b.rating - a.rating ||
    a.price - b.price ||
    a.id - b.id
  );
}

export function getSimilarProducts(
  products: RecommendationProduct[],
  currentProduct: RecommendationProduct,
  limit = 6
): RecommendationProduct[] {
  if (!validLimit(limit)) return [];

  return uniqueProducts(products)
    .filter(
      (product) =>
        product.id !== currentProduct.id &&
        product.category === currentProduct.category
    )
    .sort((a, b) => {
      const differenceA = Math.abs(
        a.price - currentProduct.price
      );
      const differenceB = Math.abs(
        b.price - currentProduct.price
      );

      return (
        differenceA - differenceB ||
        b.rating - a.rating ||
        a.id - b.id
      );
    })
    .slice(0, limit);
}

export function getCategoryRecommendations(
  products: RecommendationProduct[],
  category: string,
  excludeIds: number[] = [],
  limit = 6
): RecommendationProduct[] {
  if (!category.trim() || !validLimit(limit)) {
    return [];
  }

  const excluded = new Set(excludeIds);

  return uniqueProducts(products)
    .filter(
      (product) =>
        product.category === category &&
        !excluded.has(product.id)
    )
    .sort(rankByRating)
    .slice(0, limit);
}

export function getPriceRecommendations(
  products: RecommendationProduct[],
  maxPrice: number,
  excludeIds: number[] = [],
  limit = 6
): RecommendationProduct[] {
  if (
    !Number.isFinite(maxPrice) ||
    maxPrice < 0 ||
    !validLimit(limit)
  ) {
    return [];
  }

  const excluded = new Set(excludeIds);

  return uniqueProducts(products)
    .filter(
      (product) =>
        Number.isFinite(product.price) &&
        product.price >= 0 &&
        product.price <= maxPrice &&
        !excluded.has(product.id)
    )
    .sort(rankByRating)
    .slice(0, limit);
}

export function getWishlistRecommendations(
  products: RecommendationProduct[],
  wishlistIds: number[],
  limit = 6
): RecommendationProduct[] {
  if (!validLimit(limit) || wishlistIds.length === 0) {
    return [];
  }

  const catalog = uniqueProducts(products);
  const wishlist = new Set(wishlistIds);
  const categoryCounts = new Map<string, number>();

  for (const product of catalog) {
    if (wishlist.has(product.id)) {
      categoryCounts.set(
        product.category,
        (categoryCounts.get(product.category) ?? 0) + 1
      );
    }
  }

  return catalog
    .filter(
      (product) =>
        !wishlist.has(product.id) &&
        categoryCounts.has(product.category)
    )
    .sort((a, b) => {
      const preferenceA =
        categoryCounts.get(a.category) ?? 0;
      const preferenceB =
        categoryCounts.get(b.category) ?? 0;

      return (
        preferenceB - preferenceA ||
        rankByRating(a, b)
      );
    })
    .slice(0, limit);
}
export function getCartRecommendations(
  products: RecommendationProduct[],
  cartIds: number[],
  limit = 6
): RecommendationProduct[] {
  if (!validLimit(limit) || cartIds.length === 0) {
    return [];
  }

  const catalog = uniqueProducts(products);
  const cart = new Set(cartIds);
  const categoryCounts = new Map<string, number>();

  for (const product of catalog) {
    if (cart.has(product.id)) {
      categoryCounts.set(
        product.category,
        (categoryCounts.get(product.category) ?? 0) + 1
      );
    }
  }

  return catalog
    .filter(
      (product) =>
        !cart.has(product.id) &&
        categoryCounts.has(product.category)
    )
    .sort((a, b) => {
      const preferenceA =
        categoryCounts.get(a.category) ?? 0;
      const preferenceB =
        categoryCounts.get(b.category) ?? 0;

      return (
        preferenceB - preferenceA ||
        rankByRating(a, b)
      );
    })
    .slice(0, limit);
}
export function getFrequentlyBoughtTogether(
  products: RecommendationProduct[],
  orders: {
    items: { id: number }[];
  }[],
  selectedIds: number[],
  limit = 6
): RecommendationProduct[] {
  if (
    !validLimit(limit) ||
    selectedIds.length === 0
  ) {
    return [];
  }

  const selected = new Set(selectedIds);
  const counts = new Map<number, number>();

  for (const order of orders) {
    const orderIds = new Set(
      order.items.map((item) => item.id)
    );

    const containsSelectedProduct = Array.from(
      orderIds
    ).some((id) => selected.has(id));

    if (!containsSelectedProduct) continue;

    for (const id of orderIds) {
      if (!selected.has(id)) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
  }

  return uniqueProducts(products)
    .filter(
      (product) =>
        !selected.has(product.id) &&
        counts.has(product.id)
    )
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) -
          (counts.get(a.id) ?? 0) ||
        rankByRating(a, b)
    )
    .slice(0, limit);
}
export function getTrendingRecommendations(
  products: RecommendationProduct[],
  orders: {
    createdAt: string;
    items: { id: number; quantity: number }[];
  }[],
  limit = 6,
  now = Date.now()
): RecommendationProduct[] {
  if (!validLimit(limit) || !Number.isFinite(now)) {
    return [];
  }

  const cutoff = now - 30 * 24 * 60 * 60 * 1000;
  const counts = new Map<number, number>();

  for (const order of orders) {
    const createdAt = Date.parse(order.createdAt);

    if (
      !Number.isFinite(createdAt) ||
      createdAt < cutoff ||
      createdAt > now
    ) {
      continue;
    }

    for (const item of order.items) {
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        continue;
      }

      counts.set(
        item.id,
        (counts.get(item.id) ?? 0) + item.quantity
      );
    }
  }

  return uniqueProducts(products)
    .filter((product) => counts.has(product.id))
    .sort(
      (a, b) =>
        (counts.get(b.id) ?? 0) -
          (counts.get(a.id) ?? 0) ||
        rankByRating(a, b)
    )
    .slice(0, limit);
}
export function getPersonalizedRecommendations(
  products: RecommendationProduct[],
  signals: {
    viewedIds: number[];
    wishlistIds: number[];
    cartIds: number[];
    orders: {
      items: { id: number }[];
    }[];
  },
  limit = 6
): RecommendationProduct[] {
  if (!validLimit(limit)) return [];

  const catalog = uniqueProducts(products);
  const byId = new Map(
    catalog.map((product) => [product.id, product])
  );
  const categoryScores = new Map<string, number>();

  function addPreference(id: number, weight: number) {
    const product = byId.get(id);

    if (!product) return;

    categoryScores.set(
      product.category,
      (categoryScores.get(product.category) ?? 0) +
        weight
    );
  }

  Array.from(new Set(signals.viewedIds)).forEach(
    (id, index) => {
      addPreference(id, 1 / (index + 1));
    }
  );

  for (const id of new Set(signals.wishlistIds)) {
    addPreference(id, 3);
  }

  for (const id of new Set(signals.cartIds)) {
    addPreference(id, 4);
  }

  const purchasedIds = new Set<number>();

  for (const order of signals.orders) {
    const orderIds = new Set(
      order.items.map((item) => item.id)
    );

    for (const id of orderIds) {
      purchasedIds.add(id);
      addPreference(id, 5);
    }
  }

  const excluded = new Set([
    ...signals.viewedIds,
    ...signals.wishlistIds,
    ...signals.cartIds,
    ...purchasedIds,
  ]);

  return catalog
    .filter(
      (product) =>
        !excluded.has(product.id) &&
        categoryScores.has(product.category)
    )
    .sort((a, b) => {
      const scoreA =
        categoryScores.get(a.category) ?? 0;
      const scoreB =
        categoryScores.get(b.category) ?? 0;

      return scoreB - scoreA || rankByRating(a, b);
    })
    .slice(0, limit);
}