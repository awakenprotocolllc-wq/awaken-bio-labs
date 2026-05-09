"use client";

import { CartProvider } from "@/lib/cart";
import CartDrawer from "./CartDrawer";

export default function CartProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
