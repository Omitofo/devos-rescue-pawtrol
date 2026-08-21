/**
 * Guest cart — cookie-backed (WP-08 / FR-13).
 * No account required. Cookie is httpOnly so only server actions mutate it.
 */

import { cookies } from "next/headers";
import { CART_COOKIE, type CartItem, type CartLine } from "./types";
import { getProductsByIds } from "./products";

const MAX_QTY = 20;

export async function readCartItems(): Promise<CartItem[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i) => i && typeof i.productId === "string" && i.quantity > 0
    );
  } catch {
    return [];
  }
}

async function writeCartItems(items: CartItem[]): Promise<void> {
  const store = await cookies();
  if (items.length === 0) {
    store.delete(CART_COOKIE);
    return;
  }
  store.set(CART_COOKIE, JSON.stringify(items), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14, // 14 days
  });
}

export async function getCartLines(): Promise<CartLine[]> {
  const items = await readCartItems();
  if (items.length === 0) return [];
  const products = await getProductsByIds(items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));
  return items
    .map((item) => {
      const product = byId.get(item.productId);
      if (!product) return null;
      return { ...item, product };
    })
    .filter(Boolean) as CartLine[];
}

export async function addToCart(
  productId: string,
  quantity = 1
): Promise<void> {
  const items = await readCartItems();
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = Math.min(MAX_QTY, existing.quantity + quantity);
  } else {
    items.push({ productId, quantity: Math.min(MAX_QTY, quantity) });
  }
  await writeCartItems(items);
}

export async function setCartQuantity(
  productId: string,
  quantity: number
): Promise<void> {
  let items = await readCartItems();
  if (quantity <= 0) {
    items = items.filter((i) => i.productId !== productId);
  } else {
    const row = items.find((i) => i.productId === productId);
    if (row) row.quantity = Math.min(MAX_QTY, quantity);
    else items.push({ productId, quantity: Math.min(MAX_QTY, quantity) });
  }
  await writeCartItems(items);
}

export async function clearCart(): Promise<void> {
  await writeCartItems([]);
}

export function cartSubtotalCents(lines: CartLine[]): number {
  return lines.reduce(
    (sum, line) => sum + line.product.price_cents * line.quantity,
    0
  );
}
