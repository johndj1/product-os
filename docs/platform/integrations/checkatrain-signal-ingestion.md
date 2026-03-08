# Check-a-Train Signal Ingestion

This guide defines the simple external Product OS signal contract that Check-a-Train should use when sending operational events into Product OS.

The goal is not to mirror every internal app event. The goal is to send a small set of signals that can:

- expose real product behaviour
- update seeded KPIs when rollups change
- create follow-up work when operational conditions warrant it

## Endpoint

- `POST /api/signals/ingest`

Use the seeded Product slug:

- `check-a-train`

## External Request Shape

```json
{
  "product_slug": "check-a-train",
  "signal_name": "darwin_api_error",
  "timestamp": "2026-03-08T09:14:00.000Z",
  "metadata": {
    "provider": "darwin",
    "flow": "journey_lookup",
    "error_type": "unavailable"
  }
}
```

## Top-Level Fields

- `product_slug`: identifies the Product in Product OS. Check-a-Train should use `check-a-train`.
- `signal_name`: simple product-originated event name.
- `timestamp`: ISO-8601 timestamp for when the event happened.
- `metadata`: arbitrary JSON object with domain-specific event detail.

Product OS resolves the Product by slug, maps `signal_name` to an internal `SignalType`, derives a human-readable title, preserves the event timestamp on the stored Signal when possible, and stores `metadata` inside the persisted Signal payload.

## Recommended Signal Mapping

Use the smallest event set that affects product operation. Current explicit mappings:

- `delay_detected` -> `external_change`, default severity `medium`
- `claim_started` -> `usage_pattern`, default severity `low`
- `darwin_api_error` -> `anomaly`, default severity `high`

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

### 1. Delay detected

Use when Check-a-Train detects a delayed service and wants Product OS to record a meaningful external product signal.

```bash
curl -X POST http://localhost:3000/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "product_slug": "check-a-train",
    "signal_name": "delay_detected",
    "timestamp": "2026-03-08T09:15:00.000Z",
    "metadata": {
      "journey_id": "1A23-2026-03-08",
      "operator_code": "LNER",
      "delay_minutes": 37,
      "station_code": "KGX"
    }
  }'
```

### 2. Claim started

Use when a customer enters the claim flow and you want Product OS to capture that meaningful product behaviour.

```bash
curl -X POST http://localhost:3000/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "product_slug": "check-a-train",
    "signal_name": "claim_started",
    "timestamp": "2026-03-08T09:00:00.000Z",
    "metadata": {
      "journey_id": "1A23-2026-03-08",
      "operator_code": "LNER",
      "claim_flow": "operator_redirect"
    }
  }'
```

### 3. Darwin API error

Use when an upstream Darwin failure affects Check-a-Train behaviour and should create a Product OS signal with a high-severity anomaly mapping.

```bash
curl -X POST http://localhost:3000/api/signals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "product_slug": "check-a-train",
    "signal_name": "darwin_api_error",
    "timestamp": "2026-03-08T08:00:00.000Z",
    "metadata": {
      "provider": "darwin",
      "flow": "journey_lookup",
      "error_type": "unavailable",
      "retryable": true
    }
  }'
```

## Working Rule

For Check-a-Train, emit signals when one of these is true:

- product behaviour changed in a way that should influence prioritisation
- a KPI value has been recomputed and should update Product OS
- an operational condition is severe enough that follow-up work should be created

Do not use Product OS as the raw analytics event stream. Use it as the operating signal layer.
