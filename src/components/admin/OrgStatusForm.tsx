"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrgStatus } from "@/lib/admin/actions";

const STATUSES = [
  "pending_verification",
  "active",
  "suspended",
  "archived",
] as const;

export function OrgStatusForm({
  orgId,
  current,
}: {
  orgId: string;
  current: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const status = String(fd.get("status"));
        startTransition(async () => {
          await updateOrgStatus(orgId, status);
          router.refresh();
        });
      }}
    >
      <label className="space-y-1 text-sm">
        <span className="text-xs text-muted-foreground">Status</span>
        <select
          name="status"
          defaultValue={current}
          className="block rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update status"}
      </button>
    </form>
  );
}
