/**
 * Shop types — WP-08.
 */

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  is_active: boolean;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type CartLine = CartItem & {
  product: Product;
};

export const CART_COOKIE = "rp_cart";
