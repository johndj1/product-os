# PROJECT_STRUCTURE.md

Product OS is an outcome-driven product development system. It connects customer context, product reasoning, delivery work, operational signals, KPIs, and decisions in one Product-scoped graph.

Agents should inspect repository files before making changes.

This repository is not a generic backlog tool. Changes should preserve the rule that engineering work exists to support real user value, and that delivery work must trace back to customer outcomes.

See `AGENTS.md` for repository rules and `WORKFLOW.md` for execution guidance.

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
- `WorkItem`: the main execution and planning record. Delivery work is expressed through WorkItems such as `feature`, `story`, and `task`.
- `Outcome Gap Detection`: logic that finds customer outcomes with no supporting `feature` WorkItems and suggests the next feature to create.
- Generated `feature` and `story` work should follow canonical templates so the output is detailed, traceable, and ready for execution.

Important implementation detail:

- `feature` WorkItems must reference `outcome_id`
- downstream `story` and `task` items trace through the existing WorkItem hierarchy
- the UI should present this as an outcome-anchored delivery chain: `Outcome -> Feature -> Story -> Task`
- broader WorkItem structures such as `capability`, `kpi`, and `decision` still remain visible in the general WorkItem graph

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
- `docs/`: architecture, product model, decisions, examples, operational context, and canonical generated-work templates.

## Typical Development Flow

1. Define personas for the Product.
2. Define the key journeys for those personas.
3. Break each journey into journey steps.
4. Define the desired outcome for each journey step.
5. Create features linked to outcomes.
6. Decompose features into stories and tasks.
7. Execute delivery work with coding agents while preserving traceability.

Keep this document practical. Use it as orientation, not as a substitute for inspecting the implementation.
