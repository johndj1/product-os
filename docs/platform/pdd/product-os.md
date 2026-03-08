# Product Definition: Product OS

## Product Vision

Product OS is an AI-native Product Operating System that helps teams operate product work as a connected graph instead of disconnected records.

## Problem

Product work is often fragmented across planning, delivery, and operations. Context is lost between changes in priorities, incidents, and KPI movement.

## Product Outcome

Reduce time and friction from idea to deployed change by keeping Product intent, WorkItem execution, Relationship traceability, Signal intake, KPI movement, and Decision records in one system.

## Primary User

Full-Stack Product Owner

## Product Principles

- Product is the context root for all work.
- WorkItem is the core node for strategy and delivery.
- Relationship adds cross-cutting traceability without replacing hierarchy.
- Signal intake should create clear, actionable follow-up work.
- KPI state should be measurable and updateable from operational input.
- Decision records should preserve durable product reasoning.

## Current Implemented Scope

- Product workspace with Product overview, Work, Pages, and Signals views.
- WorkItem creation, hierarchy guardrails, status updates, and detail pages.
- Relationship creation and graph visibility for WorkItems.
- Signal ingestion via UI and API (`POST /api/signals/ingest`).
- Deterministic Signal routing to follow-up WorkItems.
- KPI tracking on KPI-typed WorkItems (`current_value`, `target_value`, `unit`, `last_updated_at`).
- Health endpoint (`GET /api/health`) for Prisma-to-database connectivity checks.

## Non-Goals In Current Scope

- AI-driven autonomous routing decisions in the ingestion path.
- Unbounded WorkItem hierarchies beyond configured guardrails.

## Success Indicators

- Signals move quickly to useful follow-up WorkItems.
- Priority context remains explainable and traceable.
- KPI changes are visible and linked to work.
