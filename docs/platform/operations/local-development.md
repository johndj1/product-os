# Local Development

## Prerequisites

- Node.js and npm
- A reachable Supabase PostgreSQL instance

## Setup

1. `npm install`
2. `cp .env.example .env`
3. Set `DATABASE_URL` to a valid Supabase Postgres connection string.
4. `npm run prisma:generate`
5. `npm run db:push`
6. `npm run db:seed`
7. `npm run dev`

App URL: `http://localhost:3000`

## Environment Note

This local environment is for Product OS development and validation. It is the right place to build Product OS, test schema and workflow changes, and pilot new Products such as Check-a-Train.

It is not yet the trusted operating environment for live Product records. Until a separate stable production environment exists, treat local/dev usage as development or pilot usage rather than live trusted operations.

## Baseline Verification

- Open Product workspace from `/`.
- Confirm seeded Product data is visible.
- Confirm WorkItem tree and relationships load.
- Confirm signals page can ingest a Signal.
- Check `GET /api/health` returns `status: ok`.
