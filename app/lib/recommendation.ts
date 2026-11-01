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
  if (
    !validLimit(limit) ||
    wishlistIds.length === 0
  ) {
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