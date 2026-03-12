# System Overview

## What The System Does

Product OS is a web application that lets a Product team plan, execute, and adapt work in one Product-scoped graph built from WorkItems, Relationships, Signals, KPIs, and Decisions.

## Main System Parts

- **Application layer**: Next.js App Router pages and route handlers.
- **Domain logic layer**: shared TypeScript modules for hierarchy rules, relationship handling, priority scoring, and Signal ingestion.
- **Data layer**: Prisma ORM with Supabase PostgreSQL.

## Core Runtime Flow

1. A user opens a Product workspace route.
2. Server-side handlers query and update Product data through Prisma.
3. Product graph data is rendered in Product views (Work, Signals, Pages, overview).
4. New Signals can be ingested from UI or API.
5. Deterministic rules optionally create or link follow-up WorkItems and record routing notes.

## Product-Critical Behaviors

- WorkItem lifecycle statuses are explicit (`new`, `ready`, `in_progress`, `blocked`, `done`, `cancelled`).
- WorkItem hierarchy follows guardrails for allowed parent-child combinations.
- Bugs are tracked as first-class WorkItems and can sit beneath Stories alongside Tasks.
- Relationship edges are directional and do not modify hierarchy.
- KPI values can be updated from `kpi_change` Signals when payload fields match a KPI WorkItem.
- Health checks are exposed at `GET /api/health` using a direct database query.

## Primary Routes

- `/`
- `/products/[productId]`
- `/products/[productId]/work`
- `/products/[productId]/work/[workItemId]`
- `/products/[productId]/pages`
- `/products/[productId]/signals`
- `/api/signals/ingest`
- `/api/health`
