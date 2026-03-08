# Check-a-Train Signal Ingestion

This guide defines the Product OS signal contract that Check-a-Train should use when sending operational events into Product OS.

The goal is not to mirror every internal app event. The goal is to send a small set of signals that can:

- expose real product behaviour
- update seeded KPIs when rollups change
- create follow-up work when operational conditions warrant it

## Endpoint

- `POST /api/signals/ingest`

Use the seeded Product slug:

- `check-a-train`

## Request Shape

```json
{
  "productSlug": "check-a-train",
  "title": "Eligibility confidence dropped on live departures",
  "description": "Darwin responses are missing expected timestamps for several services.",
  "signalType": "anomaly",
  "severity": "high",
  "source": "check-a-train",
  "sourceEventId": "evt_01JQXYZ",
  "occurredAt": "2026-03-08T09:14:00.000Z",
  "tags": ["darwin", "eligibility", "prod"],
  "payload": {
    "environment": "production",
    "journeyId": "1A23-2026-03-08",
    "operatorCode": "LNER",
    "delayMinutes": 37
  }
}
```

## Top-Level Fields

- `productSlug` or `productId`: identify the Product in Product OS. Check-a-Train should use `productSlug: "check-a-train"` unless it already stores the Product ID.
- `title`: short human-readable signal title.
- `description`: optional operational detail for triage.
- `signalType`: one of the Product OS signal types.
- `severity`: optional free-form severity. High-equivalent values are `high`, `critical`, `sev1`, `sev2`, `p0`, `p1`.
- `source`: optional source system label. For Check-a-Train use `check-a-train`.
- `sourceEventId`: optional upstream event identifier for correlation and dedupe outside Product OS.
- `occurredAt`: optional ISO-8601 timestamp for when the event happened.
- `tags`: optional string tags for filtering and downstream analysis.
- `payload`: arbitrary JSON body with domain-specific data.

Product OS stores `source`, `sourceEventId`, `occurredAt`, `tags`, and the raw `payload` inside the persisted signal payload.

## Recommended Signal Mapping

Use the smallest event set that affects product operation.

- `anomaly`: degraded delay detection confidence, missing Darwin/HSP fields, unusual eligibility calculation failures, or claim-handoff failures.
- `usage_pattern`: meaningful shifts in user behaviour such as increased abandonment before claim handoff or unusually strong completion on a new flow.
- `kpi_change`: rolled-up KPI value changes such as claim conversion rate or delay detection accuracy.
- `incident_alert`: confirmed production incident requiring explicit incident handling.
- `deployment_event`: deployments, rollback markers, or major config changes worth correlating with subsequent behaviour.

Avoid sending every page view or low-signal interaction directly to Product OS. Aggregate those in Check-a-Train first, then emit usage or KPI signals that are materially useful for product decisions.

## Current Routing Behavior

Product OS currently applies deterministic follow-up creation for these cases:

- `test_failure`: creates or reuses a matching active `bug` WorkItem.
- `incident_alert`: creates an `incident` WorkItem.
- `delivery_risk`: creates a `story` WorkItem.
- `anomaly` with high-equivalent severity: creates an `incident` WorkItem.
- `usage_pattern` with high-equivalent severity: creates a `research` WorkItem.
- `kpi_change` with high-equivalent severity: creates a `research` WorkItem.

For `kpi_change`, Product OS also updates a KPI WorkItem directly when `payload` includes:

```json
{
  "kpiTitle": "Claim conversion rate",
  "newValue": 24
}
```

KPI title matching is exact within the Product.

## Suggested Check-a-Train Events

### 1. Delay detection anomaly

Use when live-running data quality or eligibility confidence degrades enough to affect user trust.

```bash
curl -X POST http://localhost:3000/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "productSlug": "check-a-train",
    "title": "Eligibility confidence dropped for Darwin-backed services",
    "description": "Expected arrival timestamps were missing for 14% of monitored delayed services in the last 15 minutes.",
    "signalType": "anomaly",
    "severity": "high",
    "source": "check-a-train",
    "sourceEventId": "eligibility-anomaly-2026-03-08T09:15Z",
    "occurredAt": "2026-03-08T09:15:00.000Z",
    "tags": ["darwin", "eligibility", "production"],
    "payload": {
      "windowMinutes": 15,
      "affectedServiceRate": 0.14,
      "missingField": "expectedArrivalTime"
    }
  }'
```

### 2. Claim-handoff usage change

Use when user behaviour shifts enough to merit product investigation.

```bash
curl -X POST http://localhost:3000/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "productSlug": "check-a-train",
    "title": "Claim handoff completion dropped after service card change",
    "description": "Users are reaching the service detail step but fewer are continuing to operator claim flows.",
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

### 3. KPI rollup update

Use for aggregated KPI changes, not single-user events.

```bash
curl -X POST http://localhost:3000/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "productSlug": "check-a-train",
    "title": "Claim conversion rate weekly rollup",
    "description": "Weekly conversion rate recomputed from production claim-start events.",
    "signalType": "kpi_change",
    "severity": "medium",
    "source": "check-a-train",
    "sourceEventId": "kpi-claim-conversion-2026-W10",
    "occurredAt": "2026-03-08T08:00:00.000Z",
    "tags": ["kpi", "conversion", "weekly"],
    "payload": {
      "kpiTitle": "Claim conversion rate",
      "newValue": 24,
      "previousValue": 18,
      "window": "2026-W10"
    }
  }'
```

## Working Rule

For Check-a-Train, emit signals when one of these is true:

- product behaviour changed in a way that should influence prioritisation
- a KPI value has been recomputed and should update Product OS
- an operational condition is severe enough that follow-up work should be created

Do not use Product OS as the raw analytics event stream. Use it as the operating signal layer.
