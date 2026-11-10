# Database setup (not yet provisioned)

1. Provision a managed PostgreSQL database, preferably in an EU region near Vercel fra1.
2. Store DATABASE_URL in Vercel project environment variables (encrypted). Never commit credentials.
3. Locally: npm install && npx prisma validate && npx prisma generate.
4. With a controlled development database: npx prisma migrate dev --name init.
5. For production, use reviewed migrations and prisma migrate deploy during a controlled release.
6. Seed categories/products only from customer-approved catalogue. All new products default to DRAFT.
7. Test quote creation, validation, error handling and access controls before enabling public submissions.

Security TODO: authenticated admin; API rate limiting; CSRF/spam controls; transactional emails; audit logs; backups; consent records. This is a development scaffold, not a live ordering system.
