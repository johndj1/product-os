# WORKFLOW.md

This document defines how coding agents should execute work in Product OS. Use [AGENTS.md](/Users/danjohn/Projects/Code/product-os/AGENTS.md) as the repository rules source and this file as the practical execution flow.

## Core Principle

Product OS exists to improve customer journeys through outcome-linked delivery work.

If a change cannot be explained in terms of Product, Persona, Journey, Journey Step, Outcome, Feature, Story, or Task context, the change likely needs more product framing before implementation.

## Validate Product Context Before Implementation

Identify the relevant context first:

- Product
- Persona
- Journey
- Journey Step
- Outcome
- Feature
- Story
- Task

For the requested change:

- identify the highest-confidence customer outcome or product objective it supports
- identify where the change sits in the mandatory hierarchy
- confirm that `feature` work links to an `Outcome`
- confirm that downstream delivery work preserves `Feature -> Story -> Task`

Stop and redesign if:

- the hierarchy is missing or broken
- the request would create delivery work with no outcome linkage
- the change would turn Product OS into a generic backlog or ticketing flow

## Plan Before Implementation

Before editing:

- inspect the relevant repository files
- review the current schema, seed logic, rule modules, and route handlers involved
- identify existing patterns before adding new logic

For non-trivial work, form a brief plan:

1. define the behavior to preserve
2. identify the smallest implementation path
3. identify the verification needed before completion

## Prefer Small, Explicit Changes

- modify the minimum number of files needed
- extend existing domain logic instead of creating a parallel path
- avoid broad abstraction unless the existing implementation clearly cannot support the change
- preserve existing behaviour unless the task intentionally changes it
- avoid unnecessary schema changes when the current model already fits

## Preserve System Integrity

- keep outcome linkage intact
- keep Product scoping intact
- preserve deterministic behavior in hierarchy validation, work creation, outcome-gap detection, and signal ingestion
- keep `prisma/seed.ts` idempotent
- avoid duplicate records on reseed when stable identifiers already exist
- avoid auth, queues, background jobs, schedulers, or infrastructure complexity unless explicitly requested
- avoid architectural drift that weakens the Product OS model

## Verify Before Completion

Confirm that:

- outcome linkage still holds
- the mandatory hierarchy is still respected
- seed examples still reflect the intended Product OS model
- the change did not introduce a parallel or generic backlog workflow

Recommend or run the most relevant checks for the task, such as:

- `npm run prisma:generate`
- `npm run db:push`
- `npm run db:seed`
- `npm run build`
- `npm run lint`

If you do not run a check, say so explicitly.

## Practical File Inspection Order

Start with:

- `AGENTS.md`
- `PROJECT_STRUCTURE.md`
- `prisma/schema.prisma`
- `prisma/seed.ts`

Then inspect the most relevant implementation files, commonly:

- `src/lib/work-item-rules.ts`
- `src/lib/work-item-hierarchy.ts`
- `src/lib/outcome-gap-detection.ts`
- `src/lib/signal-ingestion.ts`
- `src/app/products/[productId]/work/create/route.ts`

Use the architecture docs when the change affects model semantics or system behavior:

- `docs/platform/architecture/data-model.md`
- `docs/platform/architecture/system-overview.md`
- `docs/platform/pdd/product-os.md`
