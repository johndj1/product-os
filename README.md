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

Allowed hierarchy guardrails:

- `outcome -> kpi`
- `capability -> feature`
- `feature -> story`
- `story -> task`
- `story -> bug`

Hierarchy vs relationships:

- Hierarchy is the golden thread and uses parent-child WorkItem structure.
- Relationships are directional graph edges between WorkItems and do not change hierarchy.
- Use hierarchy for decomposition and relationships for traceability across strategy, delivery, and operations.

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

`npm run db:seed` creates Product `Product OS` with:

- Product-level Definition of Done baseline
- Outcome and KPI chain for strategic traceability
- KPI baseline values for `Reduce time from idea to deployed change` (`current_value: 14`, `target_value: 3`, `unit: days`)
- Acceptance Criteria on selected WorkItems (`Create Product overview page`, `Render golden-thread tree view`, `Signal ingestion foundation`)
- Capability, Feature, Story, Task chain for delivery traceability
- Bug as first-class delivery work beneath a Story
- Seeded the active Check-a-Train historical lookup Feature with a delivered Story for the working HSP fallback path
- Seeded a follow-on Check-a-Train Story, Task, Bug, and linked `test_failure` Signal for expanding historical candidate coverage
- Seeded page, signal, and comment for workspace visibility

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
- Each create flow validates on the server, then redirects back to the same view with success or error feedback.
- WorkItem status can be updated from the Work hierarchy using the status selector on each row.
- Comments: add WorkItem comments from `/products/[productId]/work/[workItemId]` (comment body required, default system author).

## Decisions In App

- Decisions are implemented as `WorkItem` records with `type = decision`.
- Create Decisions from the dedicated "Create Decision" panel in `/products/[productId]/work`.
- View Decision details at `/products/[productId]/work/[workItemId]`, including acceptance criteria, related WorkItems, related KPI links, related Signals, and comments.
- Connect Decisions to delivery and strategy WorkItems using the Relationship create form in the Work view.

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
- Accepts `productId` or `productSlug` and a signal payload.
- Persists signal payload and applies deterministic routing to create follow-up WorkItems when rules match.

Deterministic routing rules:

- `test_failure`: create a `bug` WorkItem if a matching active bug does not already exist.
- `incident_alert`: create an `incident` WorkItem.
- `kpi_change` with high-equivalent severity (`high`, `critical`, `sev1`, `sev2`, `p0`, `p1`): create a `research` WorkItem.
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

```bash
curl -X POST http://localhost:3000/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "productSlug": "product-os",
    "title": "Checkout test suite failure on main",
    "description": "4 failures in payment flow tests after latest merge.",
    "signalType": "test_failure",
    "severity": "high",
    "payload": {
      "suite": "checkout-e2e",
      "runId": "ci-19482"
    }
  }'
```
