# Kakawa B2B Portal — Handoff

Last verified: 2026-08-28 (Day 7 hardening pass). Build: 20 routes, lint clean, 9/9 unit tests, all green.

## Test accounts

| Role | Email | Password |
|---|---|---|
| Admin | `test-admin@kakawa.test` | `Day7HardenQA!789` |
| Customer (has tier + requests) | `test-customer@kakawa.test` (Raj's Hotel & Restaurant) | `Day7HardenQA!789` |
| Customer (secondary, for isolation testing) | `test-customer-2@kakawa.test` (Sarah's Events Co) | `Day7HardenQA!789` |

These are QA accounts (`is_admin: true` bypasses real invite flow, created via `npm run create-test-admin` / `create-test-customer`). Reset a password any time with:

```
npm run create-test-admin -- test-admin@kakawa.test <new-password>
npm run create-test-customer -- test-customer@kakawa.test <new-password>
```

Rotate or delete these before Kakawa's real customers are onboarded at scale — they're QA scaffolding, not real accounts.

## Inviting a new customer

1. Admin console → **Customers** → **New customer**.
2. Enter email, company name, full name, pricing tier (optional at creation — can assign later).
3. Submit. This calls Supabase's `inviteUserByEmail` with `redirectTo` pointed at `/auth/callback`, and creates the `customers` row immediately (tier can be `null`, edited later from the customer's detail page).
4. Supabase emails the customer an invite link. They click it → lands on `/auth/callback` → sets a password → auto-logged in → `/dashboard`.

**No self-serve signup exists.** Every account is admin-invited by design (locked decision from Day 5) — there's no public registration form.

**Known constraint: email rate limit.** Supabase's built-in mailer caps outbound invite emails at a low volume (a handful per hour). This isn't a bug — it's the default free-tier mailer. If invites need to go out reliably at any real volume, wire up a real SMTP provider (Resend, Postmark, SendGrid) under Supabase Dashboard → Authentication → Emails / SMTP Settings. Until then, expect `over_email_send_rate_limit` errors if inviting several customers back-to-back — space them out, or use `supabase.auth.admin.generateLink()` (no email sent) to get a raw invite link to send manually in the meantime.

## Configuring tiers + volume discounts

1. Admin console → **Tiers** → **New tier** (or click into an existing one).
2. Set a name and base discount % off B2C price (e.g. 40% off).
3. On the tier's detail page, add volume discount rules: a minimum quantity threshold + an additional discount % stacked on top of the base discount. Add as many thresholds as needed; the richest threshold the customer's quantity crosses wins (not cumulative across thresholds).
4. Assign customers to a tier from each customer's detail page (Customers → click customer → Pricing tier dropdown).
5. A customer with no tier assigned sees B2C reference pricing everywhere, with an amber "contact Kakawa to get set up" notice instead of a crash.

## Uploading products via CSV

1. Admin console → **Products** → **CSV Upload**.
2. Required columns, exact names: `title, sku, category, b2c_price, variant_title, weight`.
3. Rows sharing the same `title` (case-insensitive) become variants of one product. Re-uploading matches existing products by title and existing variants by SKU, so it updates in place rather than duplicating — safe to re-run the same file after fixing a typo.
4. Malformed prices are rejected per-row with a reported error list; valid rows in the same file still upload.
5. Manually added products (one at a time, with an image) are available from **Products** → **Add product** if a CSV isn't handy for a one-off addition.

## Reviewing customization requests

1. Admin console → **Requests**.
2. Filter by status via the pill row (All / Submitted / In review / Approved / Ready to order) — filters via URL query param, shareable/bookmarkable.
3. Click into a request to see the customer's company + contact email, product, estimated quantity, color preferences, embossing details, special instructions, and their uploaded logo file (opens via a signed URL, expires in 10 minutes, never a public link).
4. Update the status and add a note in the same form. Notes are visible to the customer on their own request detail page immediately.

## Known limitations

- **Email rate limit** (above) — needs a real SMTP provider before any real invite volume.
- **No payment processing.** The portal produces a wholesale quote PDF; converting a quote into a real order and taking payment happens manually/offline (the PDF footer says as much). There's no checkout, no payment gateway integration.
- **No live vendor/inventory sync.** The product catalog is populated by `npm run scrape` pulling a one-time snapshot from Kakawa's Shopify store — it does not stay live-synced. Prices, stock, and new products drift from the real Shopify store until someone re-runs the scrape (or edits products manually/via CSV in the admin console).
- **Quotes aren't persisted server-side.** The quote cart lives in the customer's browser `localStorage` only — it's device/browser-local, doesn't sync across devices, and is lost if browser storage is cleared. There's no draft-quote history.
- **No mobile/PDF visual QA in this pass.** This hardening pass had no browser automation tool available, so the mobile hamburger menu, responsive form stacking, and the rendered PDF were verified by code review (correct Tailwind breakpoints, standard blob-download mechanics) and by exercising the underlying Supabase queries/RLS directly — not by literally looking at a rendered screen. Worth a real-device pass before calling mobile "done."

## What was verified in this pass (Day 7 hardening)

- `npm run test` (9/9), `npm run build` (20 routes, no errors/warnings), `npm run lint` (clean), `tsc --noEmit` (clean).
- Customer workflow, live against Supabase: login, catalog search + category filter, product/variant pricing (real tier + volume discount), customization request submission with logo upload, request list, signed logo URL.
- RLS isolation, live: a customer cannot read another customer's request, customer row, or logo (signed URL generation itself fails), and cannot write to `tiers`, `products`, or another customer's row — all confirmed by actually attempting the write and checking zero rows changed, not just reading policy SQL.
- No-tier edge case: querying a customer with `tier_id = null` doesn't error; pricing falls back to B2C price.
- Logo upload at exactly the 5MB boundary succeeds.
- Admin workflow, live: customer list with tier joined, tier list with live customer counts, full product catalog (visible + hidden) with a visibility toggle that persists and reverts cleanly, request list/filter/detail/status+notes update that persists.
- Route guards: unauthenticated `/admin/*` and `/dashboard` 307-redirect to `/login?redirectTo=...`; a malformed/garbage session cookie on a protected route redirects cleanly rather than erroring (best available proxy for real session-expiry behavior without waiting out a token's actual TTL); an unknown URL returns a real 404.
- Query performance: catalog (176 products + variants, no filter) 849ms, filtered search 493ms, admin customers list 344ms, admin requests list 246ms — all well under the 3s target. Pricing recalculation is a pure synchronous function (0ms for 10 back-to-back recalculations) — quantity-change updates are inherently instant, no network round-trip involved.
