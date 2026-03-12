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
- Feature/Story/Task/Bug example for the active Check-a-Train historical HSP lookup work
- Relationship examples
- Seed Signals and Comment
- KPI baseline values for "Reduce time from idea to deployed change"

## Caution

`prisma/seed.ts` currently clears existing records before re-seeding. Do not run against shared environments unless intentional.
