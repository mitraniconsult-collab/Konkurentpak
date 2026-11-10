# Konkurent Pak — collaborative development

## Repository and environments
- GitHub: mitraniconsult-collab/Konkurentpak
- Vercel project: mitraniconsult/konkurentpak
- Production domain konkurentpack.com must NOT be connected until acceptance testing.
- The current GitHub deployment is a **preview-quality scaffold**, not a completed shop.

## Branches and reviews
1. Branch from main: feature/<short-description>.
2. Keep secrets out of commits and never upload .env files.
3. Open a pull request with a summary, screenshots for UI changes, and test notes.
4. Require review before merging to main. Do not force push.
5. Use preview deployments to test changes.

## Release gates
- Confirm real company details, products, prices, tax and delivery rules.
- Database migrations and backup plan tested.
- Admin access controlled with role-based authorization.
- Checkout, payment callback and idempotency tested with PSP sandbox.
- GDPR text and cookie consent approved by legal owner.
- Accessibility, responsive design, TLS, security and SEO verified.
- BG and EN content checked by a human.

## Current limitations
The existing storefront in GitHub is a scaffold. Local archive v0.6 contains additional unmerged work and is not equivalent to the deployed GitHub version. Do not claim those features are live.
