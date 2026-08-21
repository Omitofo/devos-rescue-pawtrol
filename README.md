# Rescue Pawtrol

International discovery platform for rescued animals from legitimate organisations, plus a co-branded merchandise shop.

Built from the DevOS Master Design Plan (`Omitofo/DevOS` → `projects/rescue-pawtrol`).

## Status

| Work Package | Description | Status |
|--------------|-------------|--------|
| **WP-01** | Project foundation & shared infrastructure | ✅ Complete (Next.js 16.3 Active LTS) |
| **WP-02** | Database schema, RLS policies, seed data | ✅ Complete |
| **WP-03** | Auth & session layer | ✅ Complete |
| WP-04 … WP-18 | See `implementation.md` in the DevOS project folder | Pending |

## Stack (locked by architecture)

- **Next.js 16** (App Router, hybrid SSR/CSR) — Active LTS
- **TypeScript** (strict)
- **Tailwind CSS** + design-token plumbing (CSS variables)
- **Supabase** (PostgreSQL + Auth + Storage + RLS) — sole primary backend
- Structured logging baseline (JSON)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase project URL + keys

# 3. Apply database migrations (see supabase/README.md)
npx supabase db push

# 4. Configure Auth redirect URLs (see below)

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health).

### Auth pages

| Path | Audience |
|------|----------|
| `/auth/login` | Organization users (Email OTP) |
| `/auth/admin/login` | Platform staff (email + password) |
| `/auth/callback` | Supabase email-link callback |

### Supabase Auth configuration (required for WP-03)

1. **Dashboard → Authentication → URL configuration**
   - Site URL: `http://localhost:3000` (or production URL)
   - Redirect URLs: `http://localhost:3000/auth/callback`

2. **Email OTP**  
   Enable Email provider. Prefer OTP codes for org users (`signInWithOtp` + `verifyOtp`).

3. **No public sign-ups**  
   Disable public registration if available; org accounts are admin-provisioned only (FR-07). Our `requestOrgOtp` already sets `shouldCreateUser: false`.

4. **JWT claims**  
   When creating a user (Dashboard or Admin API), set `app_metadata`:

   ```json
   { "role": "org_user", "org_id": "a0000000-0000-4000-8000-000000000001" }
   ```

   or for staff:

   ```json
   { "role": "platform_admin" }
   ```

   Also insert a matching row into `public.profiles`.

5. **MFA for platform staff**  
   Enable MFA in Auth settings for admin accounts (recommended).

### Elevated re-auth window

Org mutations must run inside a 15-minute window after OTP verification.  
Helpers: `requireElevatedWindow()`, `hasElevatedWindow()`, `grantElevatedWindow()` in `@/lib/auth`.

## Project layout

```
src/
  app/
    auth/
      login/              # Org Email OTP
      admin/login/        # Platform staff password
      callback/           # Email-link exchange
    api/health/
  lib/
    auth/                 # Session, roles, elevated window, actions
    supabase/             # Clients + proxy session helper
    logger.ts
  proxy.ts

supabase/
  migrations/             # WP-02 schema + seed
```

## Environment variables

See `.env.example`. Critical rules (NFR-02):

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe for the browser.
- `SUPABASE_SERVICE_ROLE_KEY` — **server only**. Never prefix with `NEXT_PUBLIC_`.

## Node requirement

Next.js 16 requires **Node.js ≥ 20.9**.

## Next work package

**WP-04** — Media service (authenticated upload, signed URLs, quotas).

---

*Comments throughout the codebase are written for both human readers and future AI context windows.*
