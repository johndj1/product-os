# Architecture As Code

Product OS architecture is defined in code-first artefacts:

## Source Files

- Prisma schema: `prisma/schema.prisma`
- Seeded reference graph: `prisma/seed.ts`
- Domain rules:
  - `src/lib/work-item-rules.ts`
  - `src/lib/work-item-hierarchy.ts`
  - `src/lib/relationships.ts`
  - `src/lib/priority-scoring.ts`
  - `src/lib/signal-ingestion.ts`
- API contracts:
  - `src/app/api/signals/ingest/route.ts`
  - `src/app/api/health/route.ts`

## Contract Model

- Prisma schema defines persisted entities, enums, and constraints.
- Route handlers enforce request validation and state transitions.
- Shared libs enforce hierarchy rules, relationship handling, and deterministic scoring/routing.
- Seed data provides a known baseline Product graph for local verification.

## Operational Principle

When behavior changes, update code first, then align documentation in `docs/` so written architecture matches deployed behavior.
