"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";

export default function WishlistButton({
  productId,
  productName,
  className = "",
}: {
  productId: string;
  productName?: string;
  className?: string;
}) {
  const { productIds, toggle } = useWishlist();
  const saved = productIds.has(productId);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId, productName);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`inline-flex items-center justify-center transition-colors ${
        saved ? "text-low" : "text-ink-faint hover:text-low"
      } ${className}`}
    >
      <Heart size={16} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
