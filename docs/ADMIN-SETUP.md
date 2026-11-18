# Konkurent Pak — admin panel setup

The admin UI is available at `/admin`, but intentionally cannot operate before the database and Supabase Auth are configured.

## Before enabling

1. Select the **correct** Supabase project for Konkurent Pak (do not repurpose an unrelated project). Use a European region.
2. Set `DATABASE_URL` in Vercel for server-side Prisma only. Use the Supabase Postgres connection or pooler URI appropriate for a serverless environment, with SSL. Never expose this URI to the browser.
3. Apply reviewed Prisma migrations to the chosen database and test a database read. Do not run destructive schema commands on an existing production database.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel. The publishable key is not an admin credential.
5. In Supabase Auth, create/invite specific employee accounts. By an administrator-controlled process, assign `app_metadata.role` = `admin` or `editor` to those accounts. **Never** place roles in user-editable `user_metadata`.
6. Disable unrestricted account signup for this private panel, require strong passwords/MFA where available, and verify session expiration and account removal.
7. Verify: anonymous GET/POST/PATCH `/api/admin/catalog` are denied; an ordinary authenticated user is denied; an authorized employee can create a DRAFT product, edit it and archive it.

## Current scope

- Authorized admin/editor can list, search, create, and update products; existing categories are selectable.
- New products default to `DRAFT`; public catalogue endpoints expose only `ACTIVE` products.
- No product media uploader, category editor, audit log, per-user history, invitation UI, or order management yet.
- The UI/API do not use Supabase Data API for products. Prisma connects to PostgreSQL only on the server; Supabase Auth verifies the identity and privileged `app_metadata` role.
- Add rate limiting and audit trails before using this panel for operational production changes.

## Security notes

- Do not grant broad `anon`/`authenticated` access to Prisma-managed product tables via Supabase Data API. If they reside in an exposed schema, enable RLS and revoke direct access unless intentionally designed otherwise.
- The server checks every admin API request; hiding the UI is not the authorization boundary.
- Do not activate public checkout based on these admin changes; order processing, payment verification and fulfillment are separate phases.
