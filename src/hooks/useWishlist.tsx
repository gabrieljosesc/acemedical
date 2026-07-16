"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

type WishlistContextValue = {
  productIds: Set<string>;
  count: number;
  loaded: boolean;
  toggle: (productId: string, productName?: string) => Promise<void>;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);
      if (!user) {
        setLoaded(true);
        return;
      }
      const { data } = await supabase.from("wishlist_items").select("product_id").eq("user_id", user.id);
      if (!cancelled) {
        setProductIds(new Set((data ?? []).map((r) => r.product_id)));
        setLoaded(true);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(productId: string, productName?: string) {
    if (!userId) {
      toast("Sign in to save items to your wishlist.");
      return;
    }
    const supabase = createClient();
    if (productIds.has(productId)) {
      setProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      await supabase.from("wishlist_items").delete().eq("user_id", userId).eq("product_id", productId);
    } else {
      setProductIds((prev) => new Set(prev).add(productId));
      const { error } = await supabase
        .from("wishlist_items")
        .insert({ user_id: userId, product_id: productId });
      if (!error && productName) toast.success(`${productName} saved to wishlist`);
    }
  }

  return (
    <WishlistContext.Provider value={{ productIds, count: productIds.size, loaded, toggle }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
