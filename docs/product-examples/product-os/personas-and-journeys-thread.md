# Personas And Journeys Thread

This document connects the Product OS example personas and journeys into one operating thread.

Last updated: 2026-03-08

## Why This Thread Exists

- Personas define who operates the Product and what responsibilities they hold.
- Journeys define how those responsibilities show up in repeatable product-operating flows.
- Together they make Product, WorkItem, Relationship, Signal, KPI, and Decision mappings easier to follow across the example set.

## Personas In Scope

### Full-Stack Product Owner

- Owns planning, prioritization, and delivery tracking.
- Converts Signals into WorkItems and keeps the WorkItem graph aligned to Product outcomes.
- Reviews KPI movement and records Decisions when trade-offs need an explicit record.
- Primary journeys:
  - `journeys/create-a-new-product.md`
  - `journeys/ingest-signal-and-create-follow-up-work.md`
  - `journeys/review-prioritised-work.md`

### Engineering Lead

- Maintains delivery flow quality and technical execution.
- Uses Relationships and WorkItem status updates to surface dependency and blocker pressure.
- Reviews operational Signals to ensure routing produces the right follow-up work.
- Supporting journeys:
  - `journeys/ingest-signal-and-create-follow-up-work.md`
  - `journeys/review-prioritised-work.md`

### AI Delivery Agent

- Handles deterministic execution support around Signal ingestion and follow-up creation.
- Produces structured WorkItem updates so human operators can review outcomes quickly.
- Escalates to human decision-making when routing confidence or rules are insufficient.
- Supporting journeys:
  - `journeys/ingest-signal-and-create-follow-up-work.md`

## Journey Thread

### 1. Create A New Product

- Primary actor: Full-Stack Product Owner
- Purpose: establish the initial Product workspace, baseline hierarchy, and KPI context.
- Model emphasis:
  - Product creation sets the scope.
  - WorkItems create the initial structure.
  - Relationships make the hierarchy navigable.
  - KPIs establish what success will be measured against.
- Why it matters: every later journey depends on clean initial structure and naming.

### 2. Ingest Signal And Create Follow-Up Work

- Primary actors: Full-Stack Product Owner and AI Delivery Agent
- Supporting actor: Engineering Lead
- Purpose: convert incoming operational evidence into actionable work.
- Model emphasis:
  - Signals enter through ingestion flows.
  - Routing rules create or update WorkItems.
  - Relationships preserve traceability between source context and follow-up work.
  - Decisions are involved when deterministic routing is not enough.
- Why it matters: this is the core loop that turns noise into tracked product action.

### 3. Review Prioritised Work

- Primary actors: Full-Stack Product Owner and Engineering Lead
- Purpose: confirm the highest-value work is visible, justified, and ready for execution.
- Model emphasis:
  - WorkItems are ranked using state, strategic links, active Signals, and dependency context.
  - Relationships improve prioritization quality.
  - KPIs check whether the queue reflects intended outcomes.
  - Decisions capture meaningful trade-offs discovered during review.
- Why it matters: prioritization quality depends on the earlier journeys being kept accurate.

## End-To-End Operating Loop

1. The Full-Stack Product Owner creates a new Product with a usable baseline graph.
2. Signals arrive from delivery or operational events.
3. The AI Delivery Agent applies deterministic routing and proposes or creates follow-up WorkItems.
4. The Engineering Lead validates execution impact, dependencies, and blocker shape.
5. The Full-Stack Product Owner reviews prioritized work against KPI movement and records Decisions where needed.
6. Updated WorkItems and Relationships improve the next ingestion and prioritization cycle.

## Traceability Map

| Persona | Main system responsibility | Key objects touched | Linked journeys |
| --- | --- | --- | --- |
| Full-Stack Product Owner | Product planning and prioritization | Product, WorkItem, Signal, KPI, Decision | Create A New Product; Ingest Signal And Create Follow-Up Work; Review Prioritised Work |
| Engineering Lead | Delivery flow and dependency quality | WorkItem, Relationship, Signal | Ingest Signal And Create Follow-Up Work; Review Prioritised Work |
| AI Delivery Agent | Deterministic routing and execution support | Signal, WorkItem, Relationship | Ingest Signal And Create Follow-Up Work |

## Reading Order

1. Read `pdd/product-os-product-definition.md` for product context.
2. Read the persona files to understand operator responsibilities.
3. Read the journey files in the sequence documented above.
4. Review KPI and decision documents to see how outcomes and trade-offs are recorded.
