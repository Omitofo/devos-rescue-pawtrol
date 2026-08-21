"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCartQuantityAction } from "@/lib/shop/actions";

export function CartQuantity({
  productId,
  quantity,
}: {
  productId: string;
  quantity: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setQty(q: number) {
    startTransition(async () => {
      await updateCartQuantityAction(productId, q);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => setQty(quantity - 1)}
        className="h-8 w-8 rounded border border-border text-sm disabled:opacity-50"
      >
        −
      </button>
      <span className="w-6 text-center text-sm">{quantity}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => setQty(quantity + 1)}
        className="h-8 w-8 rounded border border-border text-sm disabled:opacity-50"
      >
        +
      </button>
    </div>
  );
}
