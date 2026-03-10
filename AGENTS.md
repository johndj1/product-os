# AGENTS.md

Product OS is an outcome-driven product development system. Treat this repository as a Product-scoped graph with strict domain rules, not as a generic backlog app.

## What Product OS Is

Product OS connects customer context, product reasoning, delivery work, signals, KPIs, and decisions in one Product graph.

The system is built around one governing idea:

- delivery work exists to support a real customer outcome

That means agents should reason from customer context first, then implementation.

## Start Here

Before making changes, inspect the current implementation. Do not guess from this file alone.

Read the files most relevant to your change first:

- `README.md`
- `PROJECT_STRUCTURE.md`
- `WORKFLOW.md`
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

## Mandatory Hierarchy

Keep the golden thread intact:

`Product -> Persona -> Journey -> Journey Step -> Outcome -> Feature -> Story -> Task`

This is the mandatory customer-to-delivery model. All work should be explainable as part of this chain.

Validation rule:

- `feature` work must link to an `Outcome`
- `story` work must link to a `Feature`
- `task` work must link to a `Story`

## Mental Model For Agents

Use this distinction consistently:

- `Product`, `Persona`, `Journey`, `JourneyStep`, and `Outcome` capture customer context.
- `WorkItem` captures execution and planning.
- customer `Outcome` is a first-class model, not just a label on a WorkItem.
- `feature` WorkItems attach delivery work to customer context by referencing `outcome_id`.
- `story` and `task` trace from that `feature` through parent-child WorkItem hierarchy.
- `kpi`, `capability`, and `decision` are valid WorkItem types, but they do not replace the mandatory customer-to-delivery chain.

If you are changing how work is created or linked, verify you are preserving this distinction.

## Non-Negotiable Product OS Rules

- All work must trace to a customer outcome.
- Product context comes before implementation detail.
- Product OS is not a generic backlog or ticketing tool.
- Do not bypass the hierarchy by attaching delivery work directly to Products, ad hoc buckets, or free-floating records when the change should be represented through the existing outcome-driven chain.
- `feature` WorkItems must reference `outcome_id`.
- Do not create delivery work that bypasses outcome linkage.
- Do not treat `Outcome`, `WorkItem`, `Relationship`, and `EntityLink` as interchangeable concepts.
- Hierarchy, `Relationship`, and `EntityLink` serve different purposes. Do not collapse them into one mechanism.
- Extend existing rules and architecture instead of creating parallel logic paths.

## How Hierarchy Works In Code

The repository enforces only a narrow set of parent-child WorkItem combinations:

- `outcome -> kpi`
- `capability -> feature`
- `feature -> story`
- `story -> task`

Important nuance:

- the mandatory business hierarchy includes customer `Outcome`
- the executable WorkItem hierarchy starts where delivery decomposition starts
- the `feature` to customer-`Outcome` connection is enforced through `outcome_id`, not through `parent_id`

When working on hierarchy-sensitive code, confirm behavior in:

- `src/lib/work-item-rules.ts`
- `src/lib/work-item-hierarchy.ts`
- `src/app/products/[productId]/work/create/route.ts`

## Safe Change Expectations

- Make small, explicit changes that fit the current architecture.
- Prefer updating existing domain logic over adding duplicate abstractions.
- Preserve existing behaviour unless the task explicitly requires a behaviour change.
- Preserve deterministic behavior in core flows such as hierarchy validation, signal ingestion, outcome-gap detection, and work creation.
- Avoid unnecessary schema changes. If the existing model can represent the requirement cleanly, use it.
- Do not add auth, role systems, queues, schedulers, workers, or background-job complexity unless explicitly requested.
- If a proposed change weakens traceability from delivery work back to a journey-derived outcome, stop and redesign it.

## Verification Expectations

Before finishing, recommend or run the most relevant verification steps for the change. Common checks in this repository are:

- `npm run prisma:generate`
- `npm run db:push`
- `npm run db:seed`
- `npm run build`
- `npm run lint`

Prefer the smallest useful set of checks for the change. If you do not run them, say so explicitly.

## Safe Execution Workflow For Agents

When making changes, follow this sequence:

1. Identify the Product or customer outcome the change supports.
2. Inspect the relevant schema, rule modules, route handlers, and architecture docs.
3. Confirm whether the change belongs in customer context models, WorkItem rules, relationships, entity links, or signal routing.
4. Extend the existing implementation path instead of creating a second path.
5. Preserve deterministic behavior in create, validate, and ingest flows.
6. Verify that seed data and examples still demonstrate the intended Product OS model.

For a fuller execution sequence, see `WORKFLOW.md`.

## Seed And Data Safety

- Treat `prisma/seed.ts` as production-quality setup logic for local environments and demos.
- Keep seed logic idempotent. Running `npm run db:seed` multiple times should update or reuse canonical records rather than creating uncontrolled duplicates.
- Avoid duplicate records on reseed for Products, Personas, Journeys, Journey Steps, Outcomes, WorkItems, Relationships, Signals, Pages, and EntityLinks when stable matching keys already exist.
- When changing seed data, prefer explicit lookup-and-update or upsert-style flows over blind create paths.
- Keep seeded examples aligned with the documented Product OS model. Do not seed generic backlog data that bypasses outcomes or hierarchy rules.

## Implementation Map

Use these locations as the primary source of truth:

- `prisma/schema.prisma`: authoritative data model and enums
- `prisma/seed.ts`: canonical example data and idempotent setup patterns
- `src/lib/work-item-rules.ts`: allowed WorkItem types, statuses, and hierarchy guardrails
- `src/lib/work-item-hierarchy.ts`: hierarchy validation helpers
- `src/lib/outcome-gap-detection.ts`: detects outcomes with no supporting features
- `src/lib/signal-ingestion.ts`: deterministic signal routing and KPI update logic
- `src/app/`: routes, server components, and write paths
- `docs/platform/`: architecture, decisions, and operating constraints
- `docs/product-examples/product-os/`: worked examples of the intended model

## Prompting Guidance For Coding Agents

Prompts used in this repository should:

- include the outcome-driven hierarchy context
- include persona and journey context when the change affects product behavior or work structure
- reference `GROUNDING_RULES.md` when one canonical grounding source is needed
- reference `OUTCOME_VALIDATION.md` when implementation work should be challenged against the linked Outcome before coding starts
- require inspection of repository files before changes
- encourage reuse of existing patterns, rules, and route flows
- prefer explicit, minimal changes over broad rewrites
- name the customer outcome or product objective the work supports when known
- require a pre-implementation check that explains why a proposed `feature` should improve its linked `Outcome`

## Working Style For Agents

- Inspect repository files before editing.
- Keep changes aligned to a clear customer or product outcome.
- Prefer the smallest viable change that matches the existing design.
- Explain model-sensitive tradeoffs explicitly when changing domain behavior.
- Call out any ambiguity where the requested change appears to conflict with Product OS principles.

This file is the canonical source of repository-specific coding-agent rules. Use `PROJECT_STRUCTURE.md` for system orientation and `WORKFLOW.md` for execution flow, then confirm behavior against the implementation.
