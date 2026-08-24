/**
 * Product detail — WP-08.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, formatMoney } from "@/lib/shop/products";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { trackEvent } from "@/lib/analytics/track";

type Params = Promise<{ slug: string }>;

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  await trackEvent({
    event_type: "product_view",
    product_id: product.id,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="space-y-6">
        <Link
          href="/shop"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          &larr; All products
        </Link>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex aspect-square items-center justify-center rounded-2xl bg-muted text-6xl">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              "🛍️"
            )}
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-primary">{product.name}</h1>
            <p className="text-xl font-medium text-primary">
              {formatMoney(product.price_cents, product.currency)}
            </p>
            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}
            <AddToCartButton productId={product.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
