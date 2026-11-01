import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import ProductReviews from "./ProductReviews";
import { useAuthStore } from "../stores/authStore";
import { useReviewStore } from "../stores/reviewStore";

function signIn(email = "customer@example.com") {
  useAuthStore.setState({
    user: {
      name: "Test Customer",
      email,
      role: "customer",
    },
  });
}

async function openReviews() {
  render(<ProductReviews productId={1} />);

  await screen.findByRole("heading", {
    name: "Customer Reviews",
  });
}

beforeEach(async () => {
  localStorage.clear();

  await useReviewStore.persist.rehydrate();

  useAuthStore.setState({
    user: null,
  });

  useReviewStore.setState({
    reviews: [],
  });
});

afterEach(() => {
  cleanup();
});

describe("ProductReviews component", () => {
  it("shows a login link when signed out", async () => {
    await openReviews();

    expect(
      screen.getByRole("link", { name: "Log in" })
    ).toHaveAttribute("href", "/login");

    expect(
      screen.queryByRole("button", {
        name: "Submit review",
      })
    ).not.toBeInTheDocument();

    expect(
      screen.getByText("No reviews yet.")
    ).toBeInTheDocument();
  });

  it("submits a review and displays it", async () => {
    signIn();
    await openReviews();

    fireEvent.change(screen.getByLabelText("Rating"), {
      target: { value: "4" },
    });

    fireEvent.change(
      screen.getByLabelText("Your review"),
      {
        target: {
          value: "A useful and lovely product.",
        },
      }
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Submit review",
      })
    );

    const reviewCard =
      await screen.findByRole("article");

    expect(
      within(reviewCard).getByText(
        "A useful and lovely product."
      )
    ).toBeInTheDocument();

    expect(
      within(reviewCard).getByText("Rating: 4 / 5")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Your review has been saved.")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Update review",
      })
    ).toBeInTheDocument();

    expect(
      useReviewStore.getState().reviews[0]
    ).toMatchObject({
      productId: 1,
      rating: 4,
      comment: "A useful and lovely product.",
      userEmail: "customer@example.com",
    });
  });

  it("disables helpful voting on the author's own review", async () => {
    signIn();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    await openReviews();

    expect(
      screen.getByRole("button", {
        name: "Helpful (0)",
      })
    ).toBeDisabled();

    expect(
      screen.getByText(
        "You cannot vote on your own review."
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Delete my review",
      })
    ).toBeInTheDocument();
  });

  it("adds and removes a helpful vote from another customer", async () => {
    signIn();

    useReviewStore
      .getState()
      .saveReview(1, 5, "Excellent product.");

    signIn("another@example.com");

    await openReviews();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Helpful (0)",
      })
    );

    const votedButton = await screen.findByRole(
      "button",
      {
        name: "Helpful — voted (1)",
      }
    );

    expect(votedButton).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    expect(
      screen.getByText(
        "Your helpful vote was saved."
      )
    ).toBeInTheDocument();

    fireEvent.click(votedButton);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Helpful (0)",
        })
      ).toHaveAttribute("aria-pressed", "false");
    });

    expect(
      screen.getByText(
        "Your helpful vote was removed."
      )
    ).toBeInTheDocument();
  });
});