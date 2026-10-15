import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "./providers";
import { Figtree } from "next/font/google";
import { cn } from "@/lib/utils";
import AccountBar from "./components/AccountBar";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "ShopSphere AI",
  description: "Personalized Shopping, Powered by Intelligence",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body className="antialiased">
        <Providers>
          <AccountBar />
          {children}
          </Providers>
      </body>
    </html>
  );
}