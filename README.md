# Rescue Pawtrol

International discovery platform for rescued animals from legitimate organisations, plus a co-branded merchandise shop.

Built from the DevOS Master Design Plan (`Omitofo/DevOS` → `projects/rescue-pawtrol`).

## Status

| Work Package | Description | Status |
|--------------|-------------|--------|
| **WP-01** | Project foundation & shared infrastructure | ✅ Complete (Next.js 16.3 Active LTS) |
| WP-02 … WP-18 | See `implementation.md` in the DevOS project folder | Pending |

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

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).  
Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health).

## Project layout (WP-01)

```
src/
  app/
    api/health/route.ts   # Basic health endpoint (NFR-10)
    globals.css           # Design tokens + Tailwind base
    layout.tsx            # Root layout
    page.tsx              # Temporary placeholder home
  lib/
    logger.ts             # Structured logging
    supabase/
      client.ts           # Browser client (anon key)
      server.ts           # Server client + service-role client
      middleware.ts       # Session refresh helper
  middleware.ts           # Root middleware (session keep-alive)
```

## Environment variables

See `.env.example`. Critical rules (NFR-02):

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe for the browser.
- `SUPABASE_SERVICE_ROLE_KEY` — **server only**. Never prefix with `NEXT_PUBLIC_`.

## Node requirement

Next.js 16 requires **Node.js ≥ 20.9**. The `engines` field in `package.json` enforces this.

## Next work package

**WP-02** — Database schema, RLS policies, and seed data.

All subsequent work packages map to architectural components and requirement IDs defined in the DevOS project artifacts.

---

*Comments throughout the codebase are written for both human readers and future AI context windows.*
