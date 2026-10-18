"use client";

import { use, useEffect, useState, type ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useAuthStore } from "./stores/authStore";
import { useWishlistStore} from"./stores/wishlistStore";
export default function Providers({
  children,
}: {
  children: ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  ;void useWishlistStore.persist.rehydrate();
  } , []);
  

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}