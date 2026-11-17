# Konkurent Pak — development plan

Status: draft for review (2026-11-10). Base layer = current `main` (Next.js 15 scaffold, Prisma schema, products/quotes API, no DB).

## 1. Requirements vs current state

| # | Requirement | Today | Gap | Acceptance evidence |
|---|---|---|---|---|
| R1 | CMS + product management by the client | None | Admin, auth, roles, media, page content editing | Client edits a product + a page without a developer |
| R2 | Product filters | API search by name/category only | Attributes (size, material, type, price), filter UI, URL-based filter state | Filter by category + material + size + price on /products |
| R3 | Related products | None | Manual relation in CMS + fallback (same category) | Block on every product page |
| R4 | Security: SQLi testing, HTTPS TLS ≥ 1.2 | Security headers, validated quote API, ORM | Auth hardening, rate limiting, CSP, scan + report | OWASP ZAP + sqlmap report, SSL Labs A grade |
| R5 | Multilingual (min 2) | BG only; schema has `nameEn` | Locale routing, UI strings, localized content in CMS | /bg and /en for every page, hreflang |
| R6 | Chat with customers | None | Chat widget, loaded after consent | Live chat reachable on all pages, mobile too |
| R7 | Responsive design | Basic CSS | Real storefront UI, device testing | Screenshots 360 / 768 / 1280 / 1920 |
| R8 | Own registered domain | konkurentpack.com (docs), not connected | Verify ownership, DNS → Vercel | Domain live with valid cert |
| R9 | GDPR privacy + cookie policy | Placeholder /privacy | Legal texts, cookie banner with granular consent, consent log | Policies in BG/EN, no non-essential cookies before consent |
| R10 | Electronic payments | None | Cart, checkout, orders, PSP, webhooks | Sandbox + one real low-value card payment |
| R11 | User behaviour analytics | None | Analytics + heatmaps, consent-gated | Dashboard showing visits/events |
| R12 | Basic SEO: SEF URLs, breadcrumbs, meta per page | Slugs in schema, sitemap, robots | generateMetadata everywhere, breadcrumbs + JSON-LD, localized sitemap | Every page has title/description/canonical/breadcrumbs |

Not in the list but needed to actually sell: cart/checkout, order emails, shipping (Econt/Speedy), VAT on prices, terms of sale + 14-day withdrawal info (consumer law), invoices/order documents (check Наредба Н-18 with accountant).

## 2. Key decision: how to get R1 (CMS)

**Recommended: Payload CMS 3** — runs inside the existing Next.js app, PostgreSQL, gives admin UI, auth + roles, media uploads, field-level localization (R5), versions/drafts, and access control for free. Replaces hand-building an admin (weeks of work and security risk).
- Consequence: Payload owns the schema (Drizzle under the hood) → current Prisma schema/routes get ported to Payload collections (small: 3 models, 2 routes).
- Alternatives: custom admin on Prisma (most work, most risk); Medusa (full commerce engine, separate server — overkill for this catalogue size).

## 3. Proposed stack

| Area | Choice | Why |
|---|---|---|
| App / hosting | Next.js 15 on Vercel (fra1) | Already in place; TLS 1.2/1.3 by default |
| DB | Managed Postgres in EU (Neon / Supabase / Vercel Postgres) | GDPR, near fra1 |
| CMS / admin | Payload 3 | See §2 |
| i18n | next-intl, `/bg` (default) + `/en` | Locale-prefixed SEF URLs, hreflang |
| Payments | Stripe (cards, Apple/Google Pay) **or** myPOS / Borica via bank; plus cash on delivery | Stripe = fastest integration; local PSP = lower fees/trust — client decides |
| Shipping | Econt and/or Speedy API (office/address) | Standard for BG |
| Chat | Tawk.to (free) or Crisp | Widget, no backend; consent-gated |
| Analytics | GA4 with Consent Mode v2 + Microsoft Clarity (heatmaps/recordings) | "Behaviour analysis" clearly met |
| Cookie consent | vanilla-cookieconsent (OSS) or Cookiebot | Granular categories, consent log |
| Email | Resend / Postmark | Order + quote confirmations |
| Media | Vercel Blob or S3 via Payload adapter | Product images |

## 4. Phases

### Phase 0 — Foundation (S)
- Confirm decisions in §6; confirm domain ownership and registrar access.
- Provision EU Postgres; env vars in Vercel; preview deployments per PR.
- CI: typecheck, lint, build on PR (GitHub Actions). Branch protection on `main` (per COLLABORATION.md).
- Add Payload 3 to the app; port Category/Product/QuoteRequest to collections; delete Prisma.
- Users collection with roles: `admin`, `editor`; 2FA/strong password policy.

### Phase 1 — Catalogue + CMS (M) → R1, R2, R3, R5 (content)
- Collections: Products (localized name/description/slug, SKU, price, VAT rate, stock, images, attributes, status, related products), Categories (tree), Attributes (material, dimensions, wall type, colour…), Pages (rich text blocks), Media, Globals (header/footer/contact info).
- Filter API: category, price range, attributes, dimensions; indexed queries; filter state in URL (`?material=...`) so filtered pages are shareable.
- Related products: manual field, fallback = same category / shared attributes.
- Seed from customer-approved catalogue only, default DRAFT.

### Phase 2 — Storefront, i18n, SEO, responsive (M) → R5, R7, R12
- `/[locale]/...` routing; all UI strings in message files; language switcher keeps current page.
- Pages: home, category listing with filters, product detail (gallery, related), custom-packaging quote form (wire to existing quote API), contact, CMS pages, search.
- SEO: `generateMetadata` on every route (title, description, canonical, OG), hreflang alternates, breadcrumbs UI + `BreadcrumbList` JSON-LD, `Product` JSON-LD, localized sitemap, 301 strategy for slug changes.
- Mobile-first layout; test 360/768/1280/1920; Lighthouse ≥ 90 perf/SEO/a11y.

### Phase 3 — Cart, checkout, payments (L) → R10
- Cart (cookie/session, guest checkout + optional account; B2B fields: company, VAT/EIK).
- Checkout: address, shipping method (Econt/Speedy office or address), payment method.
- Orders collection with status flow; idempotent payment webhooks; stock decrement on paid.
- PSP integration in sandbox → test card scenarios (success, decline, 3DS, refund).
- Transactional emails (order confirmation, status changes, quote received).
- Terms of sale, delivery & returns pages.

### Phase 4 — Compliance + engagement (S–M) → R6, R9, R11
- Cookie banner with categories (necessary / analytics / marketing / chat); nothing non-essential loads before consent; consent stored with timestamp/version.
- Privacy policy + cookie policy (BG/EN) — template drafted by us, **approved by the client's legal owner**; cookie table auto-listed.
- Data subject rights flow: contact address for access/deletion requests; admin can export/delete a customer.
- GA4 + Consent Mode v2, e-commerce events (view_item, add_to_cart, begin_checkout, purchase); Clarity.
- Chat widget, consent-gated, BG/EN greeting, routed to client's team.

### Phase 5 — Security, QA, launch (M) → R4, R8
- Hardening: CSP, rate limiting on quote/checkout/login (e.g. Upstash), CAPTCHA/Turnstile on public forms, admin path protection, dependency audit, secrets review.
- Testing: OWASP ZAP baseline + authenticated scan, sqlmap against all inputs on preview, manual auth/authz tests; fix + retest; write security test report.
- TLS: enforce HTTPS + HSTS, SSL Labs test (A/A+), TLS ≥ 1.2 confirmed.
- Domain: DNS to Vercel, `www` → apex redirect, email records (SPF/DKIM/DMARC).
- UAT with client; BG/EN content proofread by a human; backups + restore test.
- Go-live checklist from COLLABORATION.md release gates.

## 5. Deliverable for acceptance (evidence pack)
One folder `docs/evidence/` with per-requirement proof: screenshots, SSL Labs report, ZAP/sqlmap reports, policy URLs, analytics screenshot, payment test transaction, responsive screenshots, Lighthouse reports.

## 6. Open decisions (client)
1. CMS approach — Payload 3 (recommended) vs custom admin.
2. Payment provider — Stripe vs myPOS / Borica-bank; cash on delivery yes/no.
3. Shipping — Econt, Speedy, or both; pricing rules.
4. Chat — Tawk.to vs Crisp vs other (who answers, working hours).
5. Analytics — GA4 + Clarity OK?
6. Languages — BG + EN only?
7. B2C prices with VAT, B2B without? Customer accounts required for B2B?
8. Who owns legal approval of privacy/cookie/terms texts.
9. Fate of "local archive v0.6" — merge anything from it or ignore.

## 7. Risks
- Legal texts and invoicing rules need a lawyer/accountant — not a dev task.
- PSP onboarding (KYC, merchant agreement) can take 1–3 weeks — start in Phase 0.
- Real catalogue data (photos, specs, prices) is usually the critical path — request early.
- Repo is public — keep it secret-free or make it private.
