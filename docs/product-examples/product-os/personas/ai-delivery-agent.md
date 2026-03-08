# Persona: AI Delivery Agent

## Metadata

- Persona name: AI Delivery Agent
- Product: Product OS
- Document owner: Product OS team
- Last updated: 2026-03-08

## Persona Profile

- Role: System-supported operator that applies deterministic routing rules to incoming Signals and produces structured follow-up for human review.
- Primary goals:
  - Reduce manual triage effort without hiding why an action was taken.
  - Keep Signal handling consistent across repeated operational events.
  - Update the Product graph in ways that remain understandable to human operators.
- Key decisions this persona influences:
  - Whether a Signal should create a follow-up WorkItem
  - Whether an existing WorkItem can be reused
  - When routing results should be escalated for human judgment rather than assumed correct

## Responsibilities In Product OS

- WorkItems this persona creates or updates:
  - Bug WorkItems from `test_failure`
  - Incident WorkItems from `incident_alert`
  - Story WorkItems from `delivery_risk`
  - Research WorkItems from high-severity `kpi_change`
  - KPI WorkItems updated when a matching KPI title is present in `kpi_change` payloads
- Relationships this persona maintains:
  - Does not currently create Relationships directly
  - Relies on linked WorkItems and routing notes so humans can add Relationship context afterward
- Signals this persona reviews:
  - Structured ingestion inputs sent through the Product OS Signal workflow
- KPIs this persona monitors:
  - KPI WorkItems referenced by `kpi_change` payloads
- Decisions this persona records or approves:
  - None directly; instead it produces routing output that may trigger a human-recorded Decision

## Behaviors

- Planning behavior:
  - Applies known routing rules consistently instead of making open-ended product judgments
  - Leaves a routing note so a human can understand what happened
- Delivery behavior:
  - Creates or links follow-up WorkItems when rules match implemented Signal types
  - Reuses existing active bug WorkItems for repeated test failures with the same derived title
- Operational behavior:
  - Treats payload quality as a hard constraint
  - Updates KPI current values only when required payload fields are present and a matching KPI WorkItem exists

## Friction And Opportunities

- Friction point: Routing is only as good as the Signal title, severity, and payload quality.
- Related Signal: Any ingested Signal with incomplete data
- Opportunity: Improve Signal input discipline so deterministic automation produces better first-pass results.
- Potential follow-up WorkItem: Story to improve Signal ingestion guidance and payload conventions

- Friction point: The agent can link or create work, but it does not understand broader Product intent on its own.
- Related Signal: `kpi_change` with ambiguous business meaning
- Opportunity: Use the routing note as a handoff point and rely on a human to add Decision or Relationship context.
- Potential follow-up WorkItem: Research WorkItem to interpret a KPI shift and propose action

- Friction point: Relationship creation is still manual, so traceability can stop at the linked WorkItem.
- Related Signal: Repeated operational Signals that point to the same structural problem
- Opportunity: Encourage post-routing review that adds the missing graph context.
- Potential follow-up WorkItem: Story to tighten traceability after Signal triage

## Success Signals

- Signals are ingested with clear routing notes and predictable outcomes.
- Follow-up WorkItems are created only when implemented rules justify them.
- Repeated test failures reuse the right active bug WorkItem instead of creating duplicates.
- KPI current values update when valid KPI change payloads arrive.

## Product OS Mapping

- Product: scoping boundary for routing decisions
- WorkItem: generated or updated result of deterministic handling
- Relationship: deferred traceability step for human operators
- Signal: primary input for the agent
- KPI: specific WorkItem type that can be updated from valid KPI change payloads
- Decision: escalation point when deterministic routing is not enough

## Linked Artefacts

- Related journeys:
  - `../journeys/ingest-signal-and-create-follow-up-work.md`
- Related KPIs:
  - `../kpis/reduce-time-from-idea-to-deployed-change.md`
- Related decisions:
  - `../decisions/use-workitem-as-core-node.md`
