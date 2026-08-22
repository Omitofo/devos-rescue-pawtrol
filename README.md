# Rescue Pawtrol

International discovery platform for rescued animals from verified rescue organisations, plus a co-branded merchandise shop.

**Design source of truth:** private repo `Omitofo/DevOS` → `projects/rescue-pawtrol/` (`implementation.md`, architecture, journeys, requirements).

**Implementation repo:** https://github.com/Omitofo/devos-rescue-pawtrol

---

## Work package status (2026-08-22)

| WP | Description | Status | Notes |
|----|-------------|--------|-------|
| **WP-01** | Next.js 16 foundation, Tailwind tokens, Supabase clients, proxy, health, logger | ✅ | Next 16.3.2 Active LTS; `src/proxy.ts` (not middleware) |
| **WP-02** | Schema, RLS, indexes, seed | ✅ | Supabase project `sltubignbyatrvqynzdr` |
| **WP-03** | Auth & session, elevated window | ✅ | Org OTP + **password**; admin password |
| **WP-04** | Media (Storage bucket, upload, gallery) | ✅ | Bucket `animal-media`; max 8 imgs / 8 MB |
| **WP-05** | Public discovery | ✅ | Grid, filters, detail, interest CTA |
| **WP-06** | Org workspace (animals) | ✅ | Create/edit + elevated gate |
| **WP-07** | Admin console + **provision org/user** | ✅ | `/admin/organizations/new` |
| **WP-08** | Guest shop | ✅ | Cart + checkout → `pending_payment` |
| **WP-09** | Checkout & Stripe payments | ✅ | Checkout Session + webhook → `paid`; wallets via Stripe |
| **WP-13** | Quota & Rate Guard enforcement | ✅ | Atomic RPCs on animal CUD + media; workspace usage panel |
| **WP-12** | Public lead / contact page | ✅ | `/contact` → `leads`; Join as rescue + general |
| **J-05** | Org profile / Contact / CTA edit | ✅ | `/workspace/profile` |
| WP-10+ | POD, deeper analytics, i18n, etc. | ⏳ | See “Next” below |

**Working style:** one WP at a time; heavy code comments for fresh AI/human context; push to `main`.

---

## Stack

- **Next.js 16** (App Router, Turbopack) — Node ≥ 20.9
- **TypeScript** strict
- **Tailwind CSS** + CSS variable design tokens
- **Supabase** — Postgres + Auth + Storage + RLS only backend
- **Stripe** — Checkout Session (hosted) + webhooks (WP-09)

---

## Quick start

```bash
npm install
cp .env.example .env.local   # fill keys
npx supabase db push         # apply migrations if needed
npm run dev
```

### Environment (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=     # server only — orders + admin provisioning
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# WP-09 Stripe (optional locally — without keys, orders stay pending_payment)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**NFR-02:** never put the service role in `NEXT_PUBLIC_*` or client bundles.

### Supabase Auth URLs

- Site URL: `http://localhost:3000`
- Redirect: `http://localhost:3000/auth/callback`

Free-tier **email OTP is rate-limited**; prefer **org password login** for local work.

### Stripe local webhook

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# paste the whsec_… into STRIPE_WEBHOOK_SECRET
```

---

## Main routes

| Path | Audience |
|------|----------|
| `/` | Public animal grid + filters |
| `/animals/[id]` | Animal detail + interest CTA |
| `/organizations/[slug]` | Org profile + Contact `#contact` |
| `/shop`, `/shop/[slug]`, `/shop/cart`, `/shop/checkout` | Guest shop |
| `/shop/order/[id]` | Order status + Pay with Stripe |
| `/contact` | Public lead form (Join as rescue / contact) |
| `/auth/login` | Org user (password or OTP) → `/workspace` |
| `/auth/admin/login` | Platform staff → `/admin` |
| `/workspace` | Org animals + **quota usage panel** |
| `/workspace/profile` | Org public profile / CTA / contact |
| `/workspace/animals/new`, `.../[id]/edit` | Create/edit + **photos** |
| `/admin` | Dashboard |
| `/admin/organizations/new` | Provision org + optional user |
| `/admin/organizations/[id]` | Status + quotas |
| `/api/health` | Health check |
| `/api/webhooks/stripe` | Stripe webhook (signature verified) |

---

## Auth & roles (remember)

JWT **`app_metadata`** (set at provision time):

```json
{ "role": "org_user", "org_id": "<uuid>" }
```

```json
{ "role": "platform_admin" }
```

Roles: `org_user` | `platform_admin` | `platform_moderator`.

**Elevated window:** cookie `rp_elevated_until` (~15 min). Required for org **mutations** (animals, media, profile). Granted on OTP verify **or** org password login. UI shows “Editing unlocked” vs “View only”.

**RLS helpers:** `jwt_role()`, `jwt_org_id()`, `is_platform_admin()`, `is_org_member()` in schema migration.

---

## Demo seed

Three orgs (ES / PH / VE), ~10 animals with cover images, 2 products, 1 lead. Fixed UUIDs under `a000…` / `b000…`. Migrations in `supabase/migrations/`.

---

## Important implementation notes (for future sessions)

1. **Proxy not middleware** — Next 16 uses `src/proxy.ts` + `export function proxy`. Matcher excludes `/api/webhooks`.
2. **JSON operators in SQL** must be ASCII `->` / `->>` (not Unicode arrows).
3. **Do not DELETE seed orgs** referenced by `profiles` (check constraint `org_user` requires `org_id`). Upsert orgs instead.
4. **Orders + Auth admin APIs** need **service role** on the server.
5. **Shop** is navigationally separate from discovery; same design tokens.
6. **Interest CTA** writes `interest_events` then navigates to org `#contact` (no platform message form).
7. **Storage path:** `{org_id}/{animal_id}/{uuid}.ext` in bucket `animal-media`.
8. **Stripe (WP-09):** Checkout Session created after order insert; webhook marks `paid` and writes `order_completed` analytics. POD fulfilment is WP-10.
9. **Quotas (WP-13):** SECURITY DEFINER RPCs (`quota_consume_animal_cud`, `quota_reserve_active_animal`, `quota_consume_image_upload`, …). Apply migration `20260822000000_wp13_quota_enforcement.sql`.
10. **Leads (WP-12):** Public `/contact` inserts into `leads` (RLS allows anon INSERT). Admins triage on `/admin`.

---

## Suggested next work

1. **WP-10 POD adapter** — fulfilment after `paid` (Gelato → Printify → Printful)
2. **WP-11 analytics** — animal/org view + search events (write path partially used)
3. **Admin order list** — visibility into paid / pending orders
4. **Admin quota form** — raise daily CUD / storage limits (max_active already editable)

---

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npx supabase db push
```

---

*Comments in code are written for both humans and future AI context windows. Prefer reading this README + `implementation.md` in DevOS before extending features.*
