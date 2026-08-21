/**
 * Temporary home page — WP-01 placeholder.
 *
 * This route will be replaced by the public discovery surface (WP-05).
 * Kept deliberately minimal so the foundation can be verified end-to-end
 * (build, health endpoint, env loading) before any product UI lands.
 */

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          Rescue Pawtrol
        </h1>
        <p className="mt-2 text-muted-foreground">
          Foundation ready · WP-01 complete
        </p>
      </div>

      <div className="rounded-lg border border-border bg-surface-elevated px-4 py-3 text-sm text-muted-foreground">
        <code>/api/health</code> is live · design tokens &amp; Supabase clients ready
      </div>
    </main>
  );
}
