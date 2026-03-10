# AGENTS.md

Product OS is an outcome-driven product development system. Treat this repository as a product graph with strict domain rules, not as a generic backlog app.

## Start Here

Before making changes, inspect the current implementation. Do not guess from this file alone.

Read the files most relevant to your change first:

- `README.md`
- `PROJECT_STRUCTURE.md`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/work-item-rules.ts`
- `src/lib/work-item-hierarchy.ts`
- `src/lib/outcome-gap-detection.ts`
- `src/lib/signal-ingestion.ts`
- `src/app/products/[productId]/work/create/route.ts`
- `docs/platform/architecture/data-model.md`
- `docs/platform/architecture/system-overview.md`
- `docs/platform/pdd/product-os.md`

## Non-Negotiable Product OS Rules

- All work must trace to a customer outcome.
- Product context comes before implementation detail.
- Product OS is not a generic backlog or ticketing tool.
- Keep the golden thread intact:

`Product -> Persona -> Journey -> Journey Step -> Outcome -> Feature -> Story -> Task`

- Do not bypass the hierarchy by attaching delivery work directly to Products, ad hoc buckets, or free-floating records when the change should be represented through the existing outcome-driven chain.
- `feature` WorkItems must reference `outcome_id`.
- Hierarchy, `Relationship`, and `EntityLink` serve different purposes. Do not collapse them into one mechanism.
- Extend existing rules and architecture instead of creating parallel logic paths.

## Change Expectations

- Make small, explicit changes that fit the current architecture.
- Prefer updating existing domain logic over adding duplicate abstractions.
- Preserve existing behaviour unless the task explicitly requires a behaviour change.
- Preserve deterministic behavior in core flows such as hierarchy validation, signal ingestion, and work creation.
- Avoid unnecessary schema changes. If the existing model can represent the requirement cleanly, use it.
- Do not add auth, role systems, queues, schedulers, workers, or background-job complexity unless explicitly requested.
- If a proposed change weakens traceability from delivery work back to a journey-derived outcome, stop and redesign it.

## Seed And Data Safety

- Treat `prisma/seed.ts` as production-quality setup logic for local environments and demos.
- Keep seed logic idempotent. Running `npm run db:seed` multiple times should update or reuse canonical records rather than creating uncontrolled duplicates.
- Avoid duplicate records on reseed for Products, Personas, Journeys, Journey Steps, Outcomes, WorkItems, Relationships, Signals, Pages, and EntityLinks when stable matching keys already exist.
- When changing seed data, prefer explicit lookup-and-update or upsert-style flows over blind create paths.
- Keep seeded examples aligned with the documented Product OS model. Do not seed generic backlog data that bypasses outcomes or hierarchy rules.

## Implementation Map

Use these locations as the primary source of truth:

- `prisma/schema.prisma`: authoritative data model and enums
- `src/lib/`: domain rules, hierarchy validation, scoring, and signal logic
- `src/app/`: routes, server components, and write paths
- `docs/platform/`: architecture, decisions, and operating constraints
- `docs/product-examples/product-os/`: worked examples of the intended model

## Working Style For Agents

- Inspect repository files before editing.
- Keep changes aligned to a clear customer or product outcome.
- Prefer the smallest viable change that matches the existing design.
- Call out any ambiguity where the requested change appears to conflict with Product OS principles.

This file is a guide, not a substitute for reading the code and docs that enforce the system.
