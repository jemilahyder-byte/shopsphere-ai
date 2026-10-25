export type ChatProduct = {
  id: number;
  name: string;
  price: number;
  thumbnail: string;
  category: string;
};

export type ChatContext = {
  search: string;
  maxPrice: number | null;
  resultIds: number[];
};

export type ChatReply = {
  message: string;
  products: ChatProduct[];
  context: ChatContext;
};

export const initialChatContext: ChatContext = {
  search: "",
  maxPrice: null,
  resultIds: [],
};

const DEMO_INR_PER_USD = 85;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ignoredWords = new Set([
  "show", "me", "find", "search", "for", "some",
  "a", "an", "the", "please", "products", "product",
  "items", "item", "under", "below", "within",
  "less", "than", "maximum", "budget", "up", "to",
  "usd", "dollars", "dollar", "inr", "rs",
  "rupees", "rupee",
]);

function searchWords(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter(
      (word) =>
        word.length > 0 &&
        !ignoredWords.has(word) &&
        !/^\d+$/.test(word)
    );
}

function singular(word: string): string {
  return word.length > 3 && word.endsWith("s")
    ? word.slice(0, -1)
    : word;
}

function matchesProduct(
  product: ChatProduct,
  words: string[]
): boolean {
  const searchable = normalize(
    product.name + " " + product.category
  );

  return words.every((word) =>
    searchable.includes(singular(word))
  );
}

export function getChatReply(
  input: string,
  catalog: ChatProduct[],
  previous: ChatContext = initialChatContext
): ChatReply {
  const text = input.trim();
  const normalized = normalize(text);

  function clarify(message: string): ChatReply {
    return {
      message,
      products: [],
      context: previous,
    };
  }

  if (!text) {
    return clarify("Please enter a product or budget.");
  }

  if (/^(hi|hello|hey)$/.test(normalized)) {
    return clarify(
      'Hello! Try "show perfumes under $100" or ' +
      '"show furniture". Then try "show cheaper ones".'
    );
  }

  if (/^(reset|clear|start over)$/.test(normalized)) {
    return {
      message: "Search reset. What would you like to shop for?",
      products: [],
      context: { ...initialChatContext },
    };
  }

  const cheaper =
    /\b(cheaper|less expensive)\b/.test(normalized);

  const budgetPattern =
    /(?:under|below|within|less than|up to|maximum|budget)\s*(?:(?:usd|inr|rs\.?|rupees?)\s*|[$₹]\s*)?(\d[\d,]*(?:\.\d{1,2})?)/i;

  const budgetMatch = text.match(budgetPattern);

  const usesRupees =
    /₹|\b(?:inr|rs|rupees?)\b/i.test(text);

  const usesDollars =
    /\$|\b(?:usd|dollars?)\b/i.test(text);

  if (usesRupees && usesDollars) {
    return clarify(
      "Please use one currency: USD or INR."
    );
  }

  let maxPrice: number | null = null;
  let currencyNote = "";

  if (budgetMatch) {
    const amount = Number(
      budgetMatch[1].replaceAll(",", "")
    );

    if (!Number.isFinite(amount) || amount < 0) {
      return clarify("Please enter a valid positive budget.");
    }

    maxPrice = usesRupees
      ? amount / DEMO_INR_PER_USD
      : amount;

    currencyNote = usesRupees
      ? " Demo conversion: $1 = ₹85; prices are shown in USD."
      : "";
  } else if (
    /\b(under|below|within|budget|maximum)\b/.test(normalized)
  ) {
    return clarify(
      'What is your budget? For example, "under $50".'
    );
  }

  let search = previous.search;
  let cheaperThan: number | null = null;

  if (cheaper) {
    if (previous.resultIds.length === 0) {
      return clarify(
        "Search for a product first, then ask for cheaper ones."
      );
    }

    const previousIds = new Set(previous.resultIds);

    const previousProducts = catalog.filter((product) =>
      previousIds.has(product.id)
    );

    if (previousProducts.length === 0) {
      return clarify(
        "The previous products are unavailable. Please search again."
      );
    }

    cheaperThan = Math.min(
      ...previousProducts.map((product) => product.price)
    );

    if (maxPrice === null) {
      maxPrice = previous.maxPrice;
    }
  } else {
    const withoutBudget = budgetMatch
      ? text.replace(budgetMatch[0], " ")
      : text;

    const words = searchWords(withoutBudget);

    if (words.length > 0) {
      search = words.join(" ");
    } else if (!search && maxPrice === null) {
      return clarify(
        'Which product do you want? Try "show sofas".'
      );
    }
  }

  const words = searchWords(search);
  const seen = new Set<number>();

  const matches = catalog.filter((product) => {
    if (
      seen.has(product.id) ||
      !Number.isFinite(product.price) ||
      product.price < 0
    ) {
      return false;
    }

    seen.add(product.id);

    return (
      matchesProduct(product, words) &&
      (maxPrice === null || product.price <= maxPrice) &&
      (cheaperThan === null || product.price < cheaperThan)
    );
  });

  matches.sort(
    (a, b) => a.price - b.price || a.id - b.id
  );

  const products = matches.slice(0, 6);

  if (products.length === 0) {
    return clarify(
      "No matching products found. Try a higher budget " +
      "or another product name." +
      currencyNote
    );
  }

  return {
    message:
      "Found " +
      matches.length +
      " matching products. Showing " +
      products.length +
      ", cheapest first." +
      currencyNote,
    products,
    context: {
      search,
      maxPrice,
      resultIds: products.map((product) => product.id),
    },
  };
}