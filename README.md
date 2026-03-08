# Product OS

First usable Product workspace shell for an AI-native Product OS using Next.js, TypeScript, Tailwind CSS, Prisma, and Supabase Postgres.

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- Supabase Postgres

## Documentation

- Platform documentation (system, architecture, decisions, operations): [`docs/platform`](docs/platform)
- Reusable product-model templates and guidance: [`docs/product-model`](docs/product-model)
- Worked product example using Product OS: [`docs/product-examples/product-os`](docs/product-examples/product-os)
- Documentation index: [`docs/README.md`](docs/README.md)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` in `.env` to your Supabase Postgres connection string.

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Push schema to the database:

```bash
npm run db:push
```

6. Seed initial data:

```bash
npm run db:seed
```

7. Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Domain Model (v1)

- `Product` is a first-class entity and context root.
- `WorkItem` belongs to exactly one `Product`.
- `WorkItem` supports parent-child relationships.
- `EntityLink` is a generic, additive directional edge between `Product`, `WorkItem`, `Signal`, and `Page`.
- `Page`, `Comment`, and `Signal` are scoped to a `Product`.
- KPI measurement fields live on `WorkItem` when `type = kpi` (`current_value`, `target_value`, `unit`, `last_updated_at`).
- Acceptance Criteria live on each `WorkItem` as `acceptance_criteria`.
- Priority scoring fields live on `WorkItem` as `priority_score` and `priority_reason`.
- Definition of Done lives on `Product` as `definition_of_done`.

`WorkItemType` values:

- `outcome`
- `kpi`
- `capability`
- `feature`
- `story`
- `task`
- `bug`
- `research`
- `incident`
- `decision`

`WorkItemStatus` values:

- `new`
- `ready`
- `in_progress`
- `blocked`
- `done`
- `cancelled`

`RelationshipType` values:

- `supports`
- `relates_to`
- `blocks`
- `depends_on`
- `informs`
- `impacts`

`EntityType` values:

- `product`
- `work_item`
- `signal`
- `page`

`EntityLinkType` values:

- `measures`
- `impacts`
- `triggered_by`
- `informs`
- `supports`
- `documents`
- `references`
- `relates_to`
- `creates`

Allowed hierarchy guardrails:

- `outcome -> kpi`
- `capability -> feature`
- `feature -> story`
- `story -> task`

Hierarchy vs relationships:

- Hierarchy is the golden thread and uses parent-child WorkItem structure.
- Relationships are directional graph edges between WorkItems and do not change hierarchy.
- EntityLinks are additive directional edges for cross-entity traceability across Product, WorkItems, Signals, and Pages.
- Use hierarchy for decomposition, WorkItem relationships for WorkItem-to-WorkItem traceability, and EntityLinks for cross-entity context.

`SignalType` values:

- `kpi_change`
- `customer_feedback`
- `incident_alert`
- `delivery_risk`
- `test_failure`
- `deployment_event`
- `usage_pattern`
- `anomaly`
- `dependency_change`
- `external_change`

`SignalStatus` values:

- `new`
- `triaged`
- `actioned`
- `ignored`
- `resolved`

## Seeded Product

`npm run db:seed` creates Products `Product OS` and `Check-a-Train`.

Seeded `Product OS` includes:

- Product-level Definition of Done baseline
- Outcome and KPI chain for strategic traceability
- KPI baseline values for `Reduce time from idea to deployed change` (`current_value: 14`, `target_value: 3`, `unit: days`)
- Acceptance Criteria on selected WorkItems (`Create Product overview page`, `Render golden-thread tree view`, `Signal ingestion foundation`)
- Capability, Feature, Story, Task chain for delivery traceability
- Seeded page, signal, and comment for workspace visibility
- Seeded EntityLinks covering Product-to-KPI, Signal-to-KPI, Signal-to-WorkItem, Page-to-WorkItem, and Decision-to-WorkItem examples

Seeded `Check-a-Train` includes:

- Product baseline for the first serious pilot Product in Product OS dev
- One outcome, three KPI WorkItems, and a small MVP-oriented WorkItem graph
- Decisions clarifying MVP focus around Delay Repay assistance and live-data-derived eligibility
- Supporting pages for product definition, MVP scope, and architecture notes
- A seeded KPI movement signal to exercise signal-driven follow-up work in the UI
- Minimal Relationships and EntityLinks so the Product graph is meaningful without importing a full backlog

## Routes

- `/` home directory with clear workspace entry
- `/products/[productId]` overview
- `/products/[productId]/work`
- `/products/[productId]/work/[workItemId]` WorkItem detail
- `/products/[productId]/pages`
- `/products/[productId]/signals`

## Create Flows (v1)

- WorkItems: use the form in `/products/[productId]/work` (`title`, optional `description`, optional `acceptance_criteria`, `type`, `status`, optional parent).
- Pages: use the form in `/products/[productId]/pages` (`title`, optional `body`, optional linked WorkItem).
- Signals: use the form in `/products/[productId]/signals` (`title`, optional `description`, `signal type`, optional `severity`, optional linked WorkItem).
- Relationships: use the form in `/products/[productId]/work` (`from WorkItem`, `relationship type`, `to WorkItem`).
- EntityLinks: use the form in `/products/[productId]/work` (`from entity type`, `from entity`, `relationship type`, `to entity type`, `to entity`).
- Each create flow validates on the server, then redirects back to the same view with success or error feedback.
- EntityLink validation ensures both entities belong to the same Product and prevents exact duplicates.
- WorkItem status can be updated from the Work hierarchy using the status selector on each row.
- Comments: add WorkItem comments from `/products/[productId]/work/[workItemId]` (comment body required, default system author).

## Decisions In App

- Decisions are implemented as `WorkItem` records with `type = decision`.
- Create Decisions from the dedicated "Create Decision" panel in `/products/[productId]/work`.
- View Decision details at `/products/[productId]/work/[workItemId]`, including acceptance criteria, related WorkItems, related KPI links, related Signals, and comments.
- Connect Decisions to delivery and strategy WorkItems using the Relationship create form in the Work view.
- Cross-entity Decision context can also be captured with EntityLinks when the target is a `Signal`, `Page`, or Product-level KPI WorkItem.

## Completion Model (v1)

- Acceptance Criteria are WorkItem-level and define completion expectations for a single WorkItem.
- Definition of Done is Product-level and defines the shared quality bar for completed WorkItems in that Product.
- Definition of Done is not duplicated across individual WorkItems.

## Priority Scoring (v1)

- Priority scoring is deterministic and explainable, not AI-generated.
- Scores are calculated from Product context on page load and displayed with a human-readable reason.
- Factors currently include:
- Base score by `WorkItemType`.
- Status weighting (`in_progress` and `ready` get positive weight, `done` and `cancelled` are penalized).
- Strategic relevance to `kpi` / `outcome` (direct, hierarchical, or relationship-based).
- Active linked signals and signal severity pressure.
- Blocking/dependency pressure when active work is waiting on a WorkItem.
- Low-context penalty for active WorkItems with little connected context.

## Signal Ingestion (v1)

- API endpoint: `POST /api/signals/ingest`
- Accepts either the internal/manual contract (`productId` or `productSlug` plus Product OS signal fields) or a simple external contract for product-originated signals.
- Optional event metadata fields: `source`, `sourceEventId`, `occurredAt`, and `tags`.
- Product OS stores both the raw `signal_type` and a lightweight taxonomy layer: `signal_family` and `signal_category`.
- Taxonomy exists so routing and future pattern detection can group signals at a stable family/category level without hardcoding every product-specific signal name.
- Persists signal payload and applies deterministic routing to create follow-up WorkItems when rules match.
- Repeated similar signals are deduplicated at the work-routing layer for active follow-up WorkItems, so repeated provider/API failures reuse the existing investigation WorkItem instead of creating duplicate delivery work.
- Signals are still stored even when routing reuses an existing WorkItem.

### External Product Signal Contract

Use this when another Product such as Check-a-Train wants to emit a meaningful signal without knowing Product OS internal signal types:

```json
{
  "product_slug": "check-a-train",
  "signal_name": "darwin_api_error",
  "timestamp": "2026-03-08T12:00:00.000Z",
  "metadata": {
    "provider": "darwin",
    "flow": "journey_lookup",
    "error_type": "unavailable"
  }
}
```

Current explicit mappings for the external contract:

- `delay_detected` -> `external_change` with default severity `medium`, family `product_event`, category `operational`
- `claim_started` -> `usage_pattern` with default severity `low`, family `user_behaviour`, category `behavioural`
- `darwin_api_error` -> `anomaly` with default severity `high`, family `provider_failure`, category `reliability`

Default taxonomy for internal signal types stays explicit in code. Examples: `kpi_change` maps to `kpi_movement` / `outcome`, `test_failure` maps to `system_health` / `reliability`, and `deployment_event` maps to `product_event` / `operational`.

Product OS resolves the Product by `product_slug`, derives a human-readable Signal title from `signal_name`, preserves the event timestamp on the stored Signal where possible, stores `metadata` in the Signal payload, and persists taxonomy on the Signal record.

Deterministic routing rules:

- `test_failure`: create a `bug` WorkItem if a matching active bug does not already exist.
- `incident_alert`: create an `incident` WorkItem.
- `anomaly` with high-equivalent severity (`high`, `critical`, `sev1`, `sev2`, `p0`, `p1`): create an `incident` WorkItem.
- `kpi_change` with high-equivalent severity (`high`, `critical`, `sev1`, `sev2`, `p0`, `p1`): create a `research` WorkItem.
- `usage_pattern` with high-equivalent severity (`high`, `critical`, `sev1`, `sev2`, `p0`, `p1`): create a `research` WorkItem.
- `delivery_risk`: create a `story` WorkItem.

KPI tracking updates:

- `kpi_change` signals can update KPI values directly when payload includes `kpiTitle` and `newValue`.
- Matching is by KPI WorkItem title within the same Product.
- When matched, the ingestion flow updates KPI `current_value` and `last_updated_at`, links the signal to that KPI, and records a `routing_note`.
- For high-severity KPI changes, ingestion still creates a follow-up `research` WorkItem.

For `test_failure`, active bug statuses are:

- `new`
- `ready`
- `in_progress`
- `blocked`

### Curl Example

Internal/manual contract:

```bash
curl -X POST http://localhost:3000/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "productSlug": "check-a-train",
    "title": "Claim handoff completion dropped after service card change",
    "description": "Users are reaching service details but fewer are continuing to operator claim flows.",
    "signalType": "usage_pattern",
    "severity": "high",
    "source": "check-a-train",
    "sourceEventId": "usage-claim-handoff-2026-03-08-0900",
    "occurredAt": "2026-03-08T09:00:00.000Z",
    "tags": ["claim-handoff", "conversion"],
    "payload": {
      "baselineCompletionRate": 0.41,
      "currentCompletionRate": 0.27,
      "comparisonWindow": "24h"
    }
  }'
```

External contract:

```bash
curl -X POST http://localhost:3000/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "product_slug": "check-a-train",
    "signal_name": "darwin_api_error",
    "timestamp": "2026-03-08T12:00:00.000Z",
    "metadata": {
      "provider": "darwin",
      "flow": "journey_lookup",
      "error_type": "unavailable"
    }
  }'
```

For a Check-a-Train-specific integration guide, see `docs/platform/integrations/checkatrain-signal-ingestion.md`.
