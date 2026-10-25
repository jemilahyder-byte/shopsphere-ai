"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  getChatReply,
  initialChatContext,
  type ChatProduct,
} from "../lib/chatbot";

type ApiProduct = {
  id: number;
  title: string;
  price: number;
  thumbnail: string;
  category: string;
};

type Message = {
  role: "user" | "assistant";
  text: string;
  products?: ChatProduct[];
};

async function fetchChatProducts(): Promise<ChatProduct[]> {
  const response = await fetch(
    "https://dummyjson.com/products?limit=0"
  );

  if (!response.ok) {
    throw new Error("Unable to load products.");
  }

  const data: { products: ApiProduct[] } =
    await response.json();

  return data.products.map((product) => ({
    id: product.id,
    name: product.title,
    price: product.price,
    thumbnail: product.thumbnail,
    category: product.category,
  }));
}

export default function ShoppingChatbot() {
  const [input, setInput] = useState("");
  const [context, setContext] = useState(initialChatContext);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text:
        'Hello! Try "show perfumes under $100", ' +
        'then "show cheaper ones".',
    },
  ]);

  const {
    data: products = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["chatbot", "catalog"],
    queryFn: fetchChatProducts,
    staleTime: 5 * 60 * 1000,
  });

  function sendMessage() {
    const text = input.trim();

    if (!text || isPending || isError) return;

    const reply = getChatReply(text, products, context);

    setMessages((current) => [
      ...current,
      { role: "user", text },
      {
        role: "assistant",
        text: reply.message,
        products: reply.products,
      },
    ]);

    setContext(reply.context);
    setInput("");
  }

  function clearChat() {
    setMessages([
      {
        role: "assistant",
        text: "Chat cleared. What would you like to shop for?",
      },
    ]);

    setContext(initialChatContext);
    setInput("");
  }

  return (
    <section
      aria-labelledby="shopping-chatbot-title"
      className="mt-10 border-t pt-6"
    >
      <h2
        id="shopping-chatbot-title"
        className="text-2xl font-bold"
      >
        Shopping assistant
      </h2>

      <p className="mt-2 text-sm text-gray-600">
        Search by product and budget. Prices are in USD.
        INR budgets use a fixed demo conversion of $1 = ₹85.
      </p>

      {isPending && (
        <p role="status" className="mt-3">
          Loading product catalog...
        </p>
      )}

      {isError && (
        <div role="alert" className="mt-3">
          <p>Unable to load products.</p>

          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-2 rounded border px-4 py-2"
          >
            Try again
          </button>
        </div>
      )}

      <div
        role="log"
        aria-label="Shopping conversation"
        aria-live="polite"
        aria-relevant="additions"
        className="mt-4 max-h-[32rem] space-y-4 overflow-y-auto rounded border p-4"
      >
        {messages.map((message, index) => (
          <div key={index} className="rounded border p-3">
            <p className="font-semibold">
              {message.role === "user" ? "You" : "Assistant"}
            </p>

            <p className="mt-1">{message.text}</p>

            {message.products &&
              message.products.length > 0 && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {message.products.map((product) => (
                    <article
                      key={product.id}
                      className="rounded border p-3"
                    >
                      <Link href={"/products/" + product.id}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          width={180}
                          height={120}
                          loading="lazy"
                          className="mb-2 h-28 w-full object-contain"
                        />

                        <h3 className="font-semibold underline">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="mt-2 capitalize">
                        {product.category.replaceAll("-", " ")}
                      </p>

                      <p className="mt-2">
                        USD ${product.price.toFixed(2)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>

      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage();
        }}
      >
        <label htmlFor="shopping-message" className="block">
          Your message
        </label>

        <input
          id="shopping-message"
          type="text"
          value={input}
          maxLength={300}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Show sofas under $3000"
          disabled={isPending || isError}
          className="mt-2 w-full rounded border p-3"
        />

        <div className="mt-3 flex gap-3">
          <button
            type="submit"
            disabled={
              !input.trim() || isPending || isError
            }
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Send
          </button>

          <button
            type="button"
            onClick={clearChat}
            className="rounded border px-4 py-2"
          >
            Clear chat
          </button>
        </div>
      </form>
    </section>
  );
}