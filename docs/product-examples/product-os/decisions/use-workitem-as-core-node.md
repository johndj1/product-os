# Decision: Use WorkItem As Core Node

## Context

Product OS needs one stable node type that can represent strategy, delivery, incidents, research, and decision work while supporting hierarchy and graph traversal.

## Decision

Use `WorkItem` as the core node in the Product graph, with subtype behavior expressed via `WorkItem.type`.

## Consequences

- One model supports outcome, KPI, capability, feature, story, task, bug, research, incident, and decision records.
- Shared lifecycle statuses simplify workflow handling.
- Hierarchy and Relationship graph can coexist without separate entity systems.

## Follow-Up Work

- Keep hierarchy guardrails explicit.
- Continue validating deterministic prioritization and signal routing against WorkItem quality.
