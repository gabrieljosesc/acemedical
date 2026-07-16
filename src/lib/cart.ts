import { unitPriceForQuantity, type PriceTier } from "@/lib/price-tiers";

export type CartItem = {
  id: string; // client-generated line id
  productId: string;
  slug: string;
  name: string;
  brand: string | null;
  price: number;
  image: string | null;
  sku: string | null;
  quantity: number;
  priceTiers?: PriceTier[];
};

const STORAGE_KEY = "acemedical_cart";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToCart(
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    price: number;
    image: string | null;
    sku: string | null;
    priceTiers?: PriceTier[];
  },
  quantity: number
): CartItem[] {
  const items = getCart();
  const existing = items.find((i) => i.productId === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      id: crypto.randomUUID(),
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: product.image,
      sku: product.sku,
      quantity,
      priceTiers: product.priceTiers ?? [],
    });
  }

  saveCart(items);
  return items;
}

export function updateCartQuantity(lineId: string, quantity: number): CartItem[] {
  const items = getCart()
    .map((i) => (i.id === lineId ? { ...i, quantity } : i))
    .filter((i) => i.quantity > 0);
  saveCart(items);
  return items;
}

export function removeFromCart(lineId: string): CartItem[] {
  const items = getCart().filter((i) => i.id !== lineId);
  saveCart(items);
  return items;
}

export function clearCart(): CartItem[] {
  saveCart([]);
  return [];
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

/** Tier-aware unit price for a cart line (volume pricing). */
export function lineUnitPrice(item: CartItem): number {
  return unitPriceForQuantity(item.priceTiers ?? [], item.quantity, item.price);
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + lineUnitPrice(i) * i.quantity, 0);
}
