import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import { useAuthStore } from "./authStore";
import { useReviewStore } from "./reviewStore";

function signInAsCustomer() {
  useAuthStore.setState({
    user: {
      name: "Test Customer",
      email: "customer@example.com",
      role: "customer",
    },
  });
}

function signInAsAnotherCustomer() {
  useAuthStore.setState({
    user: {
      name: "Another Customer",
      email: "another@example.com",
      role: "customer",
    },
  });
}

beforeEach(() => {
  localStorage.clear();

  useAuthStore.setState({
    user: null,
  });

  useReviewStore.setState({
    reviews: [],
  });
});

describe("Customer reviews", () => {
  it("requires login to save a review", () => {
    expect(() => {
      useReviewStore
        .getState()
        .saveReview(1, 5, "Excellent product.");
    }).toThrow();

    expect(
      useReviewStore.getState().reviews
    ).toHaveLength(0);
  });

  it("saves a valid review and trims the comment", () => {
    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 5, "  Excellent product.  ");

    const reviews = useReviewStore.getState().reviews;

    expect(reviews).toHaveLength(1);

    expect(reviews[0]).toMatchObject({
      productId: 1,
      userEmail: "customer@example.com",
      userName: "Test Customer",
      rating: 5,
      comment: "Excellent product.",
    });

    expect(reviews[0].id).toBeTruthy();
    expect(reviews[0].createdAt).toBeTruthy();
    expect(reviews[0].updatedAt).toBeTruthy();
  });

  it("updates a review without creating a duplicate", () => {
    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    const original =
      useReviewStore.getState().reviews[0];

    useReviewStore
      .getState()
      .saveReview(1, 4, "Updated product review.");

    const reviews = useReviewStore.getState().reviews;

    expect(reviews).toHaveLength(1);
    expect(reviews[0].id).toBe(original.id);
    expect(reviews[0].createdAt).toBe(
      original.createdAt
    );
    expect(reviews[0].rating).toBe(4);
    expect(reviews[0].comment).toBe(
      "Updated product review."
    );
  });

  it.each([0, -1, 1.5])(
    "rejects invalid product ID %s",
    (productId) => {
      signInAsCustomer();

      expect(() => {
        useReviewStore
          .getState()
          .saveReview(
            productId,
            5,
            "Excellent product."
          );
      }).toThrow();

      expect(
        useReviewStore.getState().reviews
      ).toHaveLength(0);
    }
  );

  it.each([0, 6, 2.5])(
    "rejects invalid rating %s",
    (rating) => {
      signInAsCustomer();

      expect(() => {
        useReviewStore
          .getState()
          .saveReview(1, rating, "Excellent product.");
      }).toThrow();

      expect(
        useReviewStore.getState().reviews
      ).toHaveLength(0);
    }
  );

  it.each([
    { label: "short", comment: "abc" },
    { label: "blank", comment: "     " },
    {
      label: "too long",
      comment: "a".repeat(1001),
    },
  ])(
    "rejects a $label comment",
    ({ comment }) => {
      signInAsCustomer();

      expect(() => {
        useReviewStore
          .getState()
          .saveReview(1, 5, comment);
      }).toThrow();

      expect(
        useReviewStore.getState().reviews
      ).toHaveLength(0);
    }
  );

  it("allows different customers to review the same product", () => {
    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    signInAsAnotherCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 4, "Another customer review.");

    expect(
      useReviewStore.getState().reviews
    ).toHaveLength(2);
  });

  it("prevents another customer from deleting a review", () => {
    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    const reviewId =
      useReviewStore.getState().reviews[0].id;

    signInAsAnotherCustomer();

    expect(() => {
      useReviewStore
        .getState()
        .deleteReview(reviewId);
    }).toThrow();

    expect(
      useReviewStore.getState().reviews
    ).toHaveLength(1);
  });

  it("allows the author to delete their review", () => {
    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    const reviewId =
      useReviewStore.getState().reviews[0].id;

    useReviewStore
      .getState()
      .deleteReview(reviewId);

    expect(
      useReviewStore.getState().reviews
    ).toHaveLength(0);
  });

  it("prevents helpful votes on the author's own review", () => {
    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    const reviewId =
      useReviewStore.getState().reviews[0].id;

    expect(() => {
      useReviewStore
        .getState()
        .toggleHelpful(reviewId);
    }).toThrow();

    expect(
      useReviewStore.getState().reviews[0]
        .helpfulVoters ?? []
    ).toHaveLength(0);
  });

  it("requires login to vote on a review", () => {
    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    const reviewId =
      useReviewStore.getState().reviews[0].id;

    useAuthStore.setState({
      user: null,
    });

    expect(() => {
      useReviewStore
        .getState()
        .toggleHelpful(reviewId);
    }).toThrow();

    expect(
      useReviewStore.getState().reviews[0]
        .helpfulVoters ?? []
    ).toHaveLength(0);
  });

  it("adds and removes another customer's helpful vote", () => {
    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    const reviewId =
      useReviewStore.getState().reviews[0].id;

    signInAsAnotherCustomer();

    useReviewStore
      .getState()
      .toggleHelpful(reviewId);

    expect(
      useReviewStore.getState().reviews[0]
        .helpfulVoters
    ).toEqual(["another@example.com"]);

    useReviewStore
      .getState()
      .toggleHelpful(reviewId);

    expect(
      useReviewStore.getState().reviews[0]
        .helpfulVoters ?? []
    ).toHaveLength(0);
  });

  it("preserves helpful votes when the author edits a review", () => {
    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    const reviewId =
      useReviewStore.getState().reviews[0].id;

    signInAsAnotherCustomer();

    useReviewStore
      .getState()
      .toggleHelpful(reviewId);

    signInAsCustomer();

    useReviewStore
      .getState()
      .saveReview(1, 4, "Updated product review.");

    const review =
      useReviewStore.getState().reviews[0];

    expect(review.rating).toBe(4);
    expect(review.helpfulVoters).toEqual([
      "another@example.com",
    ]);
  });
});