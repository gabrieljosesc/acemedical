"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  type CartItem,
  getCart,
  addToCart as addToCartStorage,
  updateCartQuantity as updateCartQuantityStorage,
  removeFromCart as removeFromCartStorage,
  clearCart as clearCartStorage,
  cartCount,
  cartSubtotal,
} from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addToCart: (
    product: {
      id: string;
      slug: string;
      name: string;
      brand: string | null;
      price: number;
      image: string | null;
      sku: string | null;
      priceTiers?: import("@/lib/price-tiers").PriceTier[];
    },
    quantity?: number
  ) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeFromCart: (lineId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    // One-time sync from localStorage (an external system) on mount — SSR
    // has no access to it, so this can't be a lazy useState initializer
    // without causing a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(getCart());
  }, []);

  function addToCart(product: Parameters<CartContextValue["addToCart"]>[0], quantity = 1) {
    setItems(addToCartStorage(product, quantity));
  }

  function updateQuantity(lineId: string, quantity: number) {
    setItems(updateCartQuantityStorage(lineId, quantity));
  }

  function removeFromCart(lineId: string) {
    setItems(removeFromCartStorage(lineId));
  }

  function clearCart() {
    setItems(clearCartStorage());
  }

  return (
    <CartContext.Provider
      value={{
        items,
        count: cartCount(items),
        subtotal: cartSubtotal(items),
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
