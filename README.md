# Rescue Pawtrol

International discovery platform for rescued animals from verified rescue organisations, plus a co-branded merchandise shop.

**Design source of truth:** private repo `Omitofo/DevOS` → `projects/rescue-pawtrol/` (`implementation.md`, architecture, journeys, requirements).

**Implementation repo:** https://github.com/Omitofo/devos-rescue-pawtrol

---

## Work package status (2026-08-23)

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
| **WP-11** | Interest & product analytics | ✅ | Views, search, cart; admin 7-day summary |
| **Admin orders** | Order list + status | ✅ | `/admin/orders` + detail |
| **Admin quotas** | Full quota limit editor | ✅ | active, CUD/day, uploads/day, storage, imgs/animal |
| **WP-10** | POD adapter (mock + stubs) | ✅ | Gelato→Printify→Printful→mock; admin Submit to POD |
| **J-05** | Org profile / Contact / CTA edit | ✅ | `/workspace/profile` |
| Later | Real POD HTTP + SKUs, retention, i18n | ⏳ | See “Next” / open questions |

**Working style:** one WP at a time; heavy code comments for fresh AI/human context; push to `main`.

---

## Stack

- **Next.js 16** (App Router, Turbopack) — Node ≥ 20.9
- **TypeScript** strict
- **Tailwind CSS** + CSS variable design tokens
- **Supabase** — Postgres + Auth + Storage + RLS only backend
- **Stripe** — Checkout Session (hosted) + webhooks (WP-09)
- **POD** — adapter interface (WP-10); mock without keys

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
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# WP-10 POD (optional — without keys, mock provider is used)
# POD_FORCE_MOCK=1
# POD_AUTO_SUBMIT=1
# GELATO_API_KEY=
# PRINTIFY_API_TOKEN=
# PRINTIFY_SHOP_ID=
# PRINTFUL_API_KEY=
```

**NFR-02:** never put the service role in `NEXT_PUBLIC_*` or client bundles.

---

## Main routes

| Path | Audience |
|------|----------|
| `/` | Public animal grid + filters |
| `/animals/[id]` | Animal detail + interest CTA |
| `/organizations/[slug]` | Org profile + Contact `#contact` |
| `/shop` … `/shop/order/[id]` | Guest shop + order status |
| `/contact` | Public lead form |
| `/workspace` … | Org animals, profile, photos |
| `/admin` | Dashboard + analytics |
| `/admin/orders`, `/admin/orders/[id]` | Orders + **Submit to POD** |
| `/admin/organizations/[id]` | Status + full quota editor |
| `/api/webhooks/stripe` | Stripe webhook |

---

## Important implementation notes

1. **Proxy not middleware** — Next 16 uses `src/proxy.ts`.
2. **JSON operators in SQL** must be ASCII `->` / `->>`.
3. **Do not DELETE seed orgs** referenced by `profiles`.
4. **Orders + Auth admin APIs** need **service role** on the server.
5. **Shop** is navigationally separate from discovery.
6. **Interest CTA** writes `interest_events` then navigates to org `#contact`.
7. **Storage path:** `{org_id}/{animal_id}/{uuid}.ext` in bucket `animal-media`.
8. **Stripe (WP-09):** webhook marks `paid` + `order_completed` analytics.
9. **Quotas (WP-13):** SECURITY DEFINER RPCs; migration `20260822000000_wp13_quota_enforcement.sql`.
10. **Leads (WP-12):** Public `/contact` → `leads`.
11. **Admin orders:** list + detail + status.
12. **Admin quotas:** full limit editor on org detail.
13. **POD (WP-10):** `src/lib/pod/` — Gelato → Printify → Printful → mock. Live HTTP stubs until keys + SKUs. Admin **Submit to POD** when `paid`. Optional `POD_AUTO_SUBMIT=1`. `POD_FORCE_MOCK=1` forces mock.
14. **Analytics (WP-11):** `trackEvent` + admin 7-day summary.

---

## Suggested next work

1. **Wire a real POD HTTP client** (Gelato first) once `GELATO_API_KEY` + product SKUs exist
2. **Product metadata** — map catalogue items to provider variant/SKU IDs
3. **POD webhooks** — update `pod_status` / order status on shipped/delivered
4. **WP-14+** retention emails, visual polish, i18n (see DevOS `implementation.md`)

## Open questions / notes (POD)

- **No live keys yet:** fulfilment uses **mock** (`pod_order_id` like `mock_…`, status → `fulfilment_submitted`). Safe for local testing.
- **If you set a real API key** before the HTTP client is implemented, that provider is *selected* but submit returns an error — clear the key or set `POD_FORCE_MOCK=1` to keep using mock.
- **SKU mapping** is the main blocker for production POD, not the adapter shape.
- **Auto-submit** after Stripe is opt-in (`POD_AUTO_SUBMIT=1`); default is admin-triggered.

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
