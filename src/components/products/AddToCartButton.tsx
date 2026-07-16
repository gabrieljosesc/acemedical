"use client";

import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import type { CatalogProduct } from "@/lib/types";

export default function AddToCartButton({
  product,
  className,
  children,
}: {
  product: CatalogProduct;
  className: string;
  children: React.ReactNode;
}) {
  const { addToCart } = useCart();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      sku: product.sku,
      priceTiers: product.priceTiers,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
