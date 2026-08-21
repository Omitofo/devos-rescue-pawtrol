"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrgQuota } from "@/lib/admin/actions";

export function QuotaForm({
  orgId,
  maxActiveAnimals,
}: {
  orgId: string;
  maxActiveAnimals: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const n = Number(fd.get("max_active_animals"));
        startTransition(async () => {
          await updateOrgQuota(orgId, n);
          router.refresh();
        });
      }}
    >
      <label className="space-y-1 text-sm">
        <span className="text-xs text-muted-foreground">Max active animals</span>
        <input
          type="number"
          name="max_active_animals"
          min={1}
          defaultValue={maxActiveAnimals}
          className="block w-28 rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update quota"}
      </button>
    </form>
  );
}
