"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCartAction } from "@/lib/shop/actions";

export function AddToCartButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await addToCartAction(productId, 1);
          router.push("/shop/cart");
        });
      }}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add to cart"}
    </button>
  );
}
