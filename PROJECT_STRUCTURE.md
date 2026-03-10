# PROJECT_STRUCTURE.md

Product OS is an outcome-driven product development system. It is designed to connect customer context, product reasoning, delivery work, and operational signals in one Product-scoped graph.

Agents should inspect repository files before making changes.

This repository is not a generic backlog tool. Changes should preserve the rule that engineering work exists to support real user value, and that delivery work must trace back to customer outcomes.

## Mandatory Hierarchy

Product  
→ Persona  
→ Journey  
→ Journey Step  
→ Outcome  
→ Feature  
→ Story  
→ Task

This hierarchy is the core reasoning model of the system. If a change weakens traceability from delivery work back to a journey-derived outcome, it is likely the wrong change.

## Core Concepts

- `Persona`: a specific user or stakeholder type for a Product.
- `Journey`: an end-to-end user flow for a persona.
- `Journey Step`: a concrete stage within a journey.
- `Outcome`: the user value that should be achieved at a journey step.
- `WorkItem`: the main planning and execution record. Types include `outcome`, `kpi`, `capability`, `feature`, `story`, `task`, `bug`, `research`, `incident`, and `decision`.
- `Outcome Gap Detection`: logic that finds outcomes with no supporting `feature` WorkItems and suggests the next feature to create.

Important implementation detail: `feature` WorkItems must reference `outcome_id`. Downstream `story` and `task` items then trace through the parent-child WorkItem hierarchy.

## Technology Stack

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- React

## Where Key Logic Lives

- `prisma/schema.prisma`: authoritative data model and enums.
- `prisma/seed.ts`: seeded Product, persona, journey, outcome, and WorkItem examples that show the intended model in practice.
- `src/lib/`: domain rules and reusable logic.
  - `work-item-rules.ts`: allowed WorkItem types, statuses, and parent-child guardrails.
  - `work-item-hierarchy.ts`: hierarchy validation.
  - `outcome-gap-detection.ts`: identifies unsupported outcomes.
  - `signal-ingestion.ts`: deterministic signal routing and KPI updates.
  - `product-workspace.ts`: builds Product-scoped WorkItem trees.
- `src/app/`: Next.js routes, server components, and route handlers.
  - `products/[productId]/work/create/route.ts`: enforces Feature-to-Outcome linkage on creation.
  - `products/[productId]/page.tsx`: Product overview and WorkItem tree rendering.
  - `api/signals/ingest/route.ts`: signal ingestion entry point.
- `docs/`: architecture, product model, decisions, examples, and operational context.

## Development Philosophy

- All work must trace to customer outcomes.
- Product OS is not a generic ticketing or backlog system.
- Product context comes before implementation detail.
- Hierarchy, relationships, and cross-entity links serve different purposes and should not be merged conceptually.
- Agents should extend existing rules rather than creating parallel logic paths.

## Typical Development Flow

1. Define personas for the Product.
2. Define the key journeys for those personas.
3. Break each journey into journey steps.
4. Define the desired outcome for each journey step.
5. Create features linked to outcomes.
6. Decompose features into stories and tasks.
7. Execute delivery work with coding agents while preserving traceability.

## Agent Guidance

Inspect these files first for any domain-sensitive change:

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/lib/work-item-rules.ts`
- `src/lib/work-item-hierarchy.ts`
- `src/lib/outcome-gap-detection.ts`
- `src/lib/signal-ingestion.ts`
- `src/app/products/[productId]/work/create/route.ts`
- `docs/platform/architecture/data-model.md`
- `docs/platform/pdd/product-os.md`

Do not treat this file as the only source of truth. Use it as a map to the real implementation.
