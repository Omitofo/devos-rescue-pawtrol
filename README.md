# Rescue Pawtrol

International discovery platform for rescued animals from verified rescue organisations, plus a co-branded merchandise shop.

**Design source of truth:** private repo `Omitofo/DevOS` → `projects/rescue-pawtrol/` (`implementation.md`, architecture, journeys, requirements).

**Implementation repo:** https://github.com/Omitofo/devos-rescue-pawtrol

---

## Work package status (2026-08-21)

| WP | Description | Status | Notes |
|----|-------------|--------|-------|
| **WP-01** | Next.js 16 foundation, Tailwind tokens, Supabase clients, proxy, health, logger | ✅ | Next 16.3.2 Active LTS; `src/proxy.ts` (not middleware) |
| **WP-02** | Schema, RLS, indexes, seed | ✅ | Supabase project `sltubignbyatrvqynzdr` |
| **WP-03** | Auth & session, elevated window | ✅ | Org OTP + **password**; admin password |
| **WP-04** | Media (Storage bucket, upload, gallery) | ✅ | Bucket `animal-media`; max 8 imgs / 8 MB |
| **WP-05** | Public discovery | ✅ | Grid, filters, detail, interest CTA |
| **WP-06** | Org workspace (animals) | ✅ | Create/edit + elevated gate |
| **WP-07** | Admin console + **provision org/user** | ✅ | `/admin/organizations/new` |
| **WP-08** | Guest shop | ✅ | Cart + checkout → `pending_payment` (Stripe deferred) |
| **J-05** | Org profile / Contact / CTA edit | ✅ | `/workspace/profile` |
| WP-09+ | Stripe, POD, deeper analytics, i18n, etc. | ⏳ | See “Next” below |

**Working style:** one WP at a time; heavy code comments for fresh AI/human context; push to `main`.

---

## Stack

- **Next.js 16** (App Router, Turbopack) — Node ≥ 20.9
- **TypeScript** strict
- **Tailwind CSS** + CSS variable design tokens
- **Supabase** — Postgres + Auth + Storage + RLS only backend

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
```

**NFR-02:** never put the service role in `NEXT_PUBLIC_*` or client bundles.

### Supabase Auth URLs

- Site URL: `http://localhost:3000`
- Redirect: `http://localhost:3000/auth/callback`

Free-tier **email OTP is rate-limited**; prefer **org password login** for local work.

---

## Main routes

| Path | Audience |
|------|----------|
| `/` | Public animal grid + filters |
| `/animals/[id]` | Animal detail + interest CTA |
| `/organizations/[slug]` | Org profile + Contact `#contact` |
| `/shop`, `/shop/[slug]`, `/shop/cart`, `/shop/checkout` | Guest shop |
| `/auth/login` | Org user (password or OTP) → `/workspace` |
| `/auth/admin/login` | Platform staff → `/admin` |
| `/workspace` | Org animals |
| `/workspace/profile` | Org public profile / CTA / contact |
| `/workspace/animals/new`, `.../[id]/edit` | Create/edit + **photos** |
| `/admin` | Dashboard |
| `/admin/organizations/new` | Provision org + optional user |
| `/admin/organizations/[id]` | Status + quotas |
| `/api/health` | Health check |

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

1. **Proxy not middleware** — Next 16 uses `src/proxy.ts` + `export function proxy`.
2. **JSON operators in SQL** must be ASCII `->` / `->>` (not Unicode arrows).
3. **Do not DELETE seed orgs** referenced by `profiles` (check constraint `org_user` requires `org_id`). Upsert orgs instead.
4. **Orders + Auth admin APIs** need **service role** on the server.
5. **Shop** is navigationally separate from discovery; same design tokens.
6. **Interest CTA** writes `interest_events` then navigates to org `#contact` (no platform message form).
7. **Storage path:** `{org_id}/{animal_id}/{uuid}.ext` in bucket `animal-media`.

---

## Suggested next work

1. **Stripe** — PaymentIntent / Checkout for `pending_payment` orders  
2. **WP-11 analytics** — animal/org view + search events  
3. **Public lead / contact page** — write to `leads`  
4. **POD adapter** — fulfilment after paid  
5. **Quota enforcement** on animal CUD (counters already on `organization_quotas`)

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
