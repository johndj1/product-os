# Journey: Ingest Signal And Create Follow-Up Work

## Metadata

- Journey name: Ingest Signal And Create Follow-Up Work
- Product: Product OS
- Journey owner: Product OS team
- Last updated: 2026-03-08

## Actor

Primary actor: Full-Stack Product Owner  
Supporting actor: AI Delivery Agent

## Trigger

A new operational Signal arrives and needs to become visible, traceable, and actionable inside the Product graph.

## Steps

1. Submit the Signal through the Product OS ingestion flow with Product scope, title, type, severity, and any available description or payload.
2. Validate that the Signal belongs to the intended Product and that any linked WorkItem reference is valid.
3. Apply deterministic routing rules based on Signal type.
4. Create or reuse a follow-up WorkItem when the implemented routing rules call for it.
5. Record the routing note on the Signal so the operator can see what happened and why.
6. Review the linked WorkItem in the Product workspace and decide whether more Relationship context or status refinement is needed.
7. If the Signal reflects a KPI change with valid payload fields, update the matching KPI WorkItem current value and decide whether further investigation is required.

## Pain Points

- Signal quality directly affects routing quality; vague titles or missing payload fields limit usefulness.
- Deterministic routing can create technically valid WorkItems that still need human refinement to be operationally useful.
- Traceability can remain shallow if the follow-up WorkItem is created but never linked into the broader Relationship graph.

## Opportunities

- Standardize Signal payload conventions so routing results are easier to trust.
- Use routing notes as a review checkpoint instead of assuming automatic handling is enough.
- Build the habit of adding Relationships after triage so generated work does not stay isolated.

## Signals

- Signal source: Product OS signal ingestion UI or `POST /api/signals/ingest`
- Signal type:
  - `test_failure`: creates or reuses an active bug WorkItem with a derived investigation title
  - `incident_alert`: creates an incident WorkItem
  - `delivery_risk`: creates a story WorkItem
  - `kpi_change`: updates a matching KPI WorkItem when payload is valid, and creates a research WorkItem when severity is high
- Signal payload notes:
  - `kpi_change` requires usable `kpiTitle` and `newValue` fields to update KPI current value
  - Severity influences whether some Signals should generate more urgent follow-up work
- Expected routing behavior: Product OS stores the Signal, links or creates the relevant WorkItem, and records a routing note describing the rule outcome

## Desired Outcome

The Signal is captured with enough context that a human can see what changed, what WorkItem was linked or created, and whether more action is needed.

## Success Signals

- The Signal record includes a routing note that matches the implemented rule outcome.
- Follow-up WorkItems are created or reused consistently by Signal type.
- High-severity KPI changes update the KPI WorkItem and create investigation work when appropriate.
- Human review effort focuses on refinement and prioritization rather than basic triage bookkeeping.

## Product OS Model Mapping

- Product: routing scope for the incoming Signal
- WorkItems created or updated: bug, incident, story, research, or KPI depending on Signal type
- Relationships created or used: existing linked WorkItem relationship through the Signal; broader graph Relationships may be added after review
- KPI influenced: KPI WorkItem current value may update from `kpi_change` payloads
- Decision references: human operator may create a Decision if the Signal reveals a meaningful product or architecture trade-off
