# Rescue Pawtrol

International discovery platform for rescued animals from legitimate organisations, plus a co-branded merchandise shop.

Built from the DevOS Master Design Plan (`Omitofo/DevOS` → `projects/rescue-pawtrol`).

## Status

| Work Package | Description | Status |
|--------------|-------------|--------|
| **WP-01** | Foundation | ✅ |
| **WP-02** | Schema + RLS + seed | ✅ |
| **WP-03** | Auth & session | ✅ |
| **WP-05** | Public Discovery | ✅ |
| **WP-06** | Organization Workspace | ✅ |
| WP-04, WP-07 … | See `implementation.md` | Pending |

## Quick start

```bash
npm install
cp .env.example .env.local
npx supabase db push
npm run dev
```

| Path | Purpose |
|------|--------|
| `/` | Public animal grid |
| `/animals/[id]` | Animal detail + interest CTA |
| `/organizations/[slug]` | Org profile |
| `/workspace` | Org animal management |
| `/auth/login` | Org Email OTP |
| `/api/health` | Health check |

Org mutations require a 15-minute elevated OTP window after sign-in / re-auth.

---

*Comments written for humans and future AI context windows.*
