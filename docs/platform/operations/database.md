# Database Operations

## ORM + Database

- ORM: Prisma
- Database: Supabase PostgreSQL
- Schema source: `prisma/schema.prisma`

## Standard Commands

- Generate client: `npm run prisma:generate`
- Push schema: `npm run db:push`
- Run migrations (dev): `npm run db:migrate`
- Seed reference data: `npm run db:seed`

## Seeded Reference Data

Seeding creates Product `Product OS` with:

- Outcome and KPI chain
- Capability/Feature/Story/Task examples
- Separate Check-a-Train examples for baseline historical lookup, alternative candidate inspection, on-demand secondary candidate enrichment, and HSP rate-limit handling
- The HSP rate-limit example is intentionally small and focused on graceful 429 handling for historical lookups
- Relationship examples
- Seed Signals and Comment
- KPI baseline values for "Reduce time from idea to deployed change"

## Caution

`prisma/seed.ts` currently clears existing records before re-seeding. Do not run against shared environments unless intentional.
