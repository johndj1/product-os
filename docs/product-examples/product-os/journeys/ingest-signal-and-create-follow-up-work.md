# Journey: Ingest Signal And Create Follow-Up Work

## Actor

Full-Stack Product Owner

## Trigger

A new operational Signal arrives (for example test failure, delivery risk, or incident alert).

## Steps

1. Ingest Signal via UI form or `POST /api/signals/ingest`.
2. Validate Product scope and Signal type.
3. Apply deterministic routing rules.
4. Create or link follow-up WorkItem when rules match.
5. Review routing note and resulting WorkItem in workspace.

## Pain Points

- Low-quality Signal details can reduce routing precision.
- Duplicate or noisy Signals can create extra triage work.

## Opportunities

- Standardize Signal payload shape for better routing.
- Improve triage playbooks by Signal type.

## Signals

- `test_failure` -> creates/reuses bug WorkItem.
- `incident_alert` -> creates incident WorkItem.
- `delivery_risk` -> creates story WorkItem.
- high-severity `kpi_change` -> creates research WorkItem.

## Desired Outcome

Signals become actionable WorkItems quickly with explicit routing traceability.
