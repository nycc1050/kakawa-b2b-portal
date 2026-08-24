# Kakawa Chocolates B2B Portal — Build Plan

## Context

Kakawa currently runs B2B pricing/customization over email — 4-5 messages per order, no self-service, no tracking. The PRD calls for a Next.js + Supabase portal (customer catalog/pricing/quote/customization, admin tier/customer/product/request management) in 7 days, no payments, no vendor integration (Phase 2+).

Repo (`kakawa-b2b-portal`) and Supabase project are empty/fresh — this is a greenfield build, not a refactor. I verified the scrape source directly: `kakawachocolates.com.au` is **Shopify**, and `kakawachocolates.com.au/products.json` returns clean structured JSON (title, handle, variants, prices, images, product_type, tags, availability) — no HTML scraping needed. This changes the data model from the PRD's flat `products` table (see below) and removes what would have been the biggest technical risk.

---

## 1. Database Schema (Supabase/Postgres)

Deviates from the PRD in one structural way: **Shopify products have variants** (e.g. different box sizes/weights at different prices), so pricing/quantity must live at the variant level, not the product level. Everything else follows the PRD closely.

```sql
-- Extends auth.users (Supabase Auth). Created via trigger on signup.
profiles
  id              uuid PK, references auth.users.id
  email           text
  full_name       text
  role            text check in ('admin','customer'), default 'customer'
  created_at      timestamptz

customers
  id              uuid PK
  profile_id      uuid FK -> profiles.id, unique
  company_name    text
  phone           text
  tier_id         uuid FK -> tiers.id, nullable
  is_active       boolean default true      -- soft delete
  created_at      timestamptz
  updated_at      timestamptz

tiers
  id                      uuid PK
  name                    text              -- "Wholesale-Monthly-Tier1"
  base_discount_percent   numeric           -- 0.85 = pays 15% of B2C price (see Risk #2 on naming)
  is_active               boolean default true
  created_at              timestamptz
  updated_at              timestamptz

volume_discounts
  id                          uuid PK
  tier_id                     uuid FK -> tiers.id
  min_quantity                int
  additional_discount_percent numeric
  created_at                  timestamptz

products                      -- one row per Shopify product ("parent")
  id                  uuid PK
  shopify_product_id  bigint, nullable        -- null for manually-added products
  title               text
  handle              text
  category            text                    -- from Shopify product_type
  description         text
  image_url           text
  tags                text[]
  is_b2b_visible      boolean default true    -- admin can hide items from B2B catalog
  source              text check in ('scraped','manual')
  created_at          timestamptz
  updated_at          timestamptz

product_variants               -- the actual sellable/priceable unit
  id                  uuid PK
  product_id          uuid FK -> products.id
  shopify_variant_id  bigint, nullable
  variant_title       text        -- "220g Box", "Single Origin 70%"
  sku                 text
  b2c_price           numeric
  weight_grams        int
  is_available        boolean default true
  created_at          timestamptz
  updated_at          timestamptz

customization_requests
  id                    uuid PK
  customer_id           uuid FK -> customers.id
  product_id            uuid FK -> products.id
  variant_id            uuid FK -> product_variants.id, nullable
  estimated_quantity    int, nullable          -- not in PRD's model, small useful addition
  color_preferences     text
  logo_file_url         text                   -- Supabase Storage path
  embossing_details     text
  special_instructions  text
  status                text check in ('submitted','in-review','approved','ready-to-order'), default 'submitted'
  admin_notes           text
  created_at            timestamptz
  updated_at            timestamptz
```

**RLS (critical, not optional for a B2B pricing tool):**
- `profiles`: user reads/updates own row only.
- `customers`: customer reads own row; admin reads/writes all.
- `tiers` / `volume_discounts`: customer can read only their **own assigned tier** + its volume rules; admin full access. Customers must never see other tiers' discounts.
- `products` / `product_variants`: any authenticated customer reads where `is_b2b_visible = true`; admin full access.
- `customization_requests`: customer reads/writes own rows only; admin full access.
- Supabase Storage bucket `customization-logos`: path-scoped `customer_id/*`, customer can read/write only their own folder, admin reads all.

All enforced via Postgres RLS policies keyed on `auth.uid()` joined through `profiles.role` / `customers.profile_id` — not just app-layer checks.

---

## 2. Component / Page Structure (Next.js App Router)

```
app/
  (auth)/login/page.tsx
  (customer)/
    layout.tsx                      -- guard: role=customer, fetch profile+tier
    dashboard/page.tsx               -- tier, company info
    catalog/page.tsx                 -- product grid, search/filter by category
    catalog/[productId]/page.tsx     -- variant list, qty input, live price
    quote/page.tsx                   -- multi-line quote builder + "Generate PDF"
    customization/new/page.tsx       -- request form
    customization/page.tsx           -- request list/status tracker
    customization/[id]/page.tsx      -- single request detail (specs + admin notes)
  (admin)/admin/
    layout.tsx                       -- guard: role=admin
    dashboard/page.tsx                -- stat tiles (stretch)
    customers/page.tsx                -- list + create
    customers/[id]/page.tsx           -- edit, tier reassignment, request history
    tiers/page.tsx                    -- list + create/edit tier + volume rules
    products/page.tsx                 -- list, manual add/edit, CSV upload, visibility toggle
    requests/page.tsx                 -- all customization requests, filter by status
    requests/[id]/page.tsx            -- detail, status update, admin notes

components/
  catalog/ProductCard, VariantPicker, QuantityPriceRow
  quote/QuoteLineItem, QuoteSummary, QuotePdfButton
  customization/RequestForm, RequestStatusBadge, LogoUploader
  admin/CustomerTable, TierEditor, VolumeDiscountRow, ProductTable, CsvUploader, RequestReviewPanel
  shared/AuthGuard, RoleGate, Nav

lib/
  supabase/client.ts, server.ts        -- browser + server Supabase clients
  pricing.ts                           -- pure fn: calcPrice(b2cPrice, tier, volumeDiscounts, qty) — unit-tested
  shopify-scraper.ts                   -- fetch products.json, transform, upsert
  pdf/QuoteDocument.tsx                 -- @react-pdf/renderer template
  quote-context.tsx                     -- client-side cart/quote state (not persisted — see Risk #4)
```

---

## 3. Build Sequence (7 days)

**Day 1 — Foundation**
- Next.js + TS + Tailwind scaffold, push to GitHub, connect Vercel
- Supabase schema migration (tables above + RLS policies + enums)
- Auth: Supabase Auth, `profiles` auto-created via DB trigger on signup, role-based route guards
- Shopify scraper script: pull `products.json` → upsert `products` + `product_variants`
- Seed data: 1 admin user, 2-3 tiers w/ volume rules, 2-3 test customers

**Day 2 — Catalog + pricing engine**
- `pricing.ts` pure function (unit tested) + catalog grid/detail pages
- Live quantity → price calculation per variant
- Customer dashboard shell

**Day 3 — Quote builder + PDF**
- Quote context (multi-product cart), quote review page with breakdown
- PDF generation (`@react-pdf/renderer`) with Kakawa branding, client-side download

**Day 4 — Customization requests (customer side)**
- Request form incl. logo upload to Supabase Storage
- Request list + detail/status tracking, confirmation + request ID

**Day 5 — Admin: customers, tiers, products**
- Customer CRUD + tier assignment + soft delete
- Tier CRUD + volume discount rows
- Product management: view scraped catalog, manual add/edit, CSV override upload, visibility toggle

**Day 6 — Admin: request review + polish pass**
- Request review list/filter/detail, status update, admin notes
- Responsive pass on all customer-facing pages
- Dashboard stat tiles if time allows (explicitly nice-to-have per PRD)

**Day 7 — Test, harden, deploy**
- RLS verification: log in as customer vs admin, confirm data isolation (customer can't see other tiers/customers/requests)
- Edge cases: no tier assigned, qty=0, empty catalog, unavailable variant, session expiry
- Mobile/desktop responsive QA
- Final Vercel deploy + walkthrough notes for Kakawa's review

---

## 4. Decisions (confirmed with Nik)

1. **Pricing stacking: additive/sequential.** `finalPrice = b2cPrice × (1 - tierDiscount) × (1 - volumeDiscount)` — tier % off first, volume % off applied to the already-discounted price. Both %s remain admin-editable per tier, so this is a config change if Kakawa's actual economics differ from the PRD's worked example (which didn't reconcile arithmetically as written).
2. **Signup: admin-invite only.** No open self-signup. Admin creates the customer record and invites via Supabase's `inviteUserByEmail` (service_role, server-side only).
3. **CSV columns (product override upload):** `title, sku, category, b2c_price, variant_title, weight` — confirmed. Will validate types/required fields on upload and reject rows with malformed prices rather than silently skipping them.
4. **Descope order if Day 6-7 gets tight:** admin dashboard stat tiles → CSV upload (manual add still works) → category filter polish. Everything else in the PRD ships.

## 5. Remaining risk (not blocking)

- **Quotes are not persisted** — "Generate Quote" builds a client-side cart and renders a PDF on demand; no `quotes` table (matches PRD's data model, and there's no order/payment flow in v1 to attach one to). Flag if you want server-side quote history — small add, not in scope as written.
- Shopify CDN image URLs are hotlinked directly (no re-hosting) — fine for MVP, but outside our control if Kakawa's B2C site changes.

---

## 6. Verification

- `pricing.ts` unit tests covering: no volume discount, single threshold, multiple thresholds, boundary quantities, tier with 0% discount.
- Manual RLS check: two customer accounts on different tiers confirm neither can query the other's tier/pricing/requests via browser devtools network tab.
- End-to-end manual walkthrough Day 7: sign in as customer → browse catalog → build quote → download PDF → submit customization request → sign in as admin → see request → update status → customer sees updated status.
- `npm run build` clean, Vercel preview deploy checked before merging to main.
