# Supabase — Rescue Pawtrol

Database schema, RLS policies, and seed data for the Rescue Pawtrol platform.

## Layout

```
supabase/
  migrations/
    20260821000000_wp02_schema.sql   # Tables, enums, helpers, RLS, indexes
    20260821000001_wp02_seed.sql     # Demo orgs, animals, products, lead
  README.md
```

## How to apply

### Option A — Supabase CLI (recommended)

```bash
# From the project root
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

Or run the SQL files manually in the Supabase SQL Editor in order:

1. `20260821000000_wp02_schema.sql`
2. `20260821000001_wp02_seed.sql`

### Option B — SQL Editor

1. Open Supabase Dashboard → SQL Editor.
2. Paste and run the schema migration.
3. Paste and run the seed migration.

## What WP-02 creates

| Object | Purpose |
|--------|--------|
| **Enums** | `app_role`, `org_status`, `animal_status`, `lead_status`, `order_status`, `analytics_event_type` |
| **organizations** | Tenants (rescue orgs) |
| **profiles** | 1:1 with `auth.users`; carries role + optional `org_id` |
| **animals** | Listings with taxonomy + status lifecycle |
| **animal_media** | Image metadata (binaries in Storage) |
| **interest_events** | CTA clicks (FR-17) |
| **analytics_events** | Day-one metrics (views, search, shop funnel) |
| **leads** | “Join as Rescue” form |
| **organization_quotas** | Limits + running counters (FR-11 defaults) |
| **products / orders / order_items** | Guest shop |
| **RLS** | Public read of published content; org-scoped writes; admin elevated |
| **Helpers** | `jwt_role()`, `jwt_org_id()`, `is_platform_admin()`, `is_org_member()` |

## Roles & JWT claims (used by RLS)

When provisioning users (WP-03 / WP-07), set in `auth.users.raw_app_meta_data`:

```json
{
  "role": "org_user",
  "org_id": "<uuid of organization>"
}
```

or for platform staff:

```json
{
  "role": "platform_admin"
}
```

RLS reads these via `auth.jwt() → app_metadata`.

## Animal status lifecycle (RQ-01)

```
draft → published → pending | adopted | removed
```

- `published` + `deleted_at IS NULL` → visible on public discovery.
- `removed` is the soft-delete terminal state.

## Starting quotas (FR-11)

| Quota | Default |
|-------|--------|
| Active animals / org | 50 |
| Images / animal | 8 |
| Max image size | 8 MB |
| Storage / org | 2 GB |
| Animal CUD / day | 20 |
| Image uploads / day | 40 |

Counters live in `organization_quotas` and are updated atomically in WP-13.

## Seed data

Two active orgs (Spain + Philippines), four animals (three published, one draft), two products, one lead. Fixed UUIDs for easy local testing. No `auth.users` are created here.

## Next

**WP-03** — Auth & session layer (Email OTP for org_user, MFA for platform staff, elevated re-auth window).
