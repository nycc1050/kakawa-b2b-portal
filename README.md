# kakawa-b2b-portal

B2B chocolate ordering portal for Kakawa Chocolates — wholesale/corporate customer catalog, tier + volume pricing, quote PDF generation, and customization request tracking, with an admin console for customer/tier/product/request management.

Build plan: see `docs/build-plan.md` (mirrors the plan approved 2026-08-24).

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres, Auth, Storage) with Row Level Security
- Vercel deployment

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.local.example` to `.env.local` and fill in Supabase credentials (never commit `.env.local` — it's gitignored).

### Scripts

- `npm run dev` — local dev server
- `npm run build` — production build (also type-checks)
- `npm test` — pricing engine unit tests (Vitest)
- `npm run scrape` — pull Kakawa's live Shopify catalog into `products` / `product_variants`
- `npm run seed` — seed baseline pricing tiers + volume discounts (and optionally invite an admin via `SEED_ADMIN_EMAIL`)

### Database

Schema + RLS policies live in `supabase/migrations/0001_init.sql`. Apply via the Supabase SQL Editor (or `supabase db push` once the project is linked).
