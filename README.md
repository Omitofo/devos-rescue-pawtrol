# Rescue Pawtrol

International discovery platform for rescued animals from legitimate organisations, plus a co-branded merchandise shop.

Built from the DevOS Master Design Plan (`Omitofo/DevOS` → `projects/rescue-pawtrol`).

## Status

| Work Package | Description | Status |
|--------------|-------------|--------|
| **WP-01** | Project foundation & shared infrastructure | ✅ |
| **WP-02** | Database schema, RLS policies, seed data | ✅ |
| **WP-03** | Auth & session layer | ✅ |
| **WP-05** | Public Discovery (grid, filters, detail, interest CTA) | ✅ |
| WP-04, WP-06 … WP-18 | See `implementation.md` | Pending |

## Stack

- **Next.js 16** (App Router) — Active LTS
- **TypeScript** (strict)
- **Tailwind CSS** + design tokens
- **Supabase** (PostgreSQL + Auth + Storage + RLS)

## Quick start

```bash
npm install
cp .env.example .env.local   # fill Supabase keys
npx supabase db push         # if not already applied
npm run dev
```

| Path | Purpose |
|------|--------|
| `/` | Animal discovery grid + filters |
| `/animals/[id]` | Animal detail + interest CTA |
| `/organizations/[slug]` | Org profile + Contact section |
| `/auth/login` | Org Email OTP |
| `/auth/admin/login` | Platform staff |
| `/api/health` | Health check |

## Next recommended

**WP-04** Media service, or **WP-11** day-one analytics polish, or **WP-06** Organization Workspace.

---

*Comments throughout the codebase are written for both human readers and future AI context windows.*
