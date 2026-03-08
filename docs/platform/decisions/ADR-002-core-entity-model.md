# ADR-002: Core Entity Model

## Status

Accepted

## Context

The system needed a stable model for planning, delivery, and feedback loops.

## Decision

Adopt a Product-scoped model built on:

- Product
- WorkItem
- Relationship
- Signal
- KPI (as `WorkItem.type = kpi`)
- Decision (as `WorkItem.type = decision`)

Use two structures together:

- Hierarchy: parent-child WorkItems with guardrails.
- Graph edges: directional Relationships for traceability across work.

## Consequences

- A single WorkItem model supports strategy, delivery, incidents, research, and decisions.
- Relationship edges add cross-cutting context without breaking hierarchy.
- Deterministic scoring and routing can operate from shared entity structure.
