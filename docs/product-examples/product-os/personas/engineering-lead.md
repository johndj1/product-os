# Persona: Engineering Lead

## Metadata

- Persona name: Engineering Lead
- Product: Product OS
- Document owner: Product OS team
- Last updated: 2026-03-08

## Persona Profile

- Role: Delivery-focused operator who keeps execution healthy by maintaining WorkItem flow, dependency clarity, and response quality for operational Signals.
- Primary goals:
  - Keep active WorkItems moving instead of silently aging in place.
  - Make dependencies and blockers visible early enough to change sequencing.
  - Ensure incidents and test failures produce actionable, well-scoped follow-up work.
- Key decisions this persona influences:
  - Whether a WorkItem should move status, split, or gain more dependency structure
  - Which Relationships best describe execution pressure
  - Whether a Signal-created WorkItem is sufficient or needs follow-up clarification

## Responsibilities In Product OS

- WorkItems this persona creates or updates:
  - Story, task, bug, incident, research
  - Status updates on active delivery WorkItems
- Relationships this persona maintains:
  - `blocks`
  - `depends_on`
  - `supports`
  - `relates_to` when technical context needs to stay visible
- Signals this persona reviews:
  - `test_failure`
  - `incident_alert`
  - `delivery_risk`
- KPIs this persona monitors:
  - Delivery-oriented KPI WorkItems that show whether execution improvements are helping outcome movement
- Decisions this persona records or approves:
  - Technical trade-offs that affect delivery flow, implementation constraints, or dependency management

## Behaviors

- Planning behavior:
  - Reads the WorkItem graph through the lens of sequencing, blockers, and execution readiness
  - Uses Relationships to expose hidden dependency cost before it slows a delivery cycle
- Delivery behavior:
  - Updates WorkItem status frequently enough that priority scoring remains trustworthy
  - Refines follow-up WorkItems from Signals when routing produced something technically correct but operationally vague
- Operational behavior:
  - Treats incidents and failures as inputs to the Product graph, not separate operational noise
  - Checks whether repeated Signals point to a structural weakness in the current work plan

## Friction And Opportunities

- Friction point: WorkItems can look healthy on paper while hidden blockers sit only in people’s heads.
- Related Signal: `delivery_risk`
- Opportunity: Add and maintain dependency Relationships so blocked execution is obvious in the graph.
- Potential follow-up WorkItem: Story to improve dependency mapping for active delivery work

- Friction point: Test failures and incidents can create follow-up work that lacks enough technical context for rapid action.
- Related Signal: `test_failure` or `incident_alert`
- Opportunity: Improve titles, descriptions, and linkage on generated WorkItems so the next operator can act immediately.
- Potential follow-up WorkItem: Bug or incident WorkItem refinement task

- Friction point: Completed work can keep affecting prioritization if statuses or Relationships are stale.
- Related Signal: Repeated active Signals linked to already-understood work
- Opportunity: Use review cycles to clean up stale status and disconnected Relationships.
- Potential follow-up WorkItem: Story to improve lifecycle hygiene for active delivery items

## Success Signals

- Active WorkItems show realistic status and clear dependency context.
- `blocks` and `depends_on` Relationships explain why important work is waiting.
- Incident and test-failure Signals result in follow-up WorkItems that engineers can act on quickly.
- Delivery reviews reveal fewer surprises because blocker pressure is already visible in the graph.

## Product OS Mapping

- Product: execution context for a specific delivery stream
- WorkItem: main unit of delivery planning and progress tracking
- Relationship: dependency and blocker visibility layer
- Signal: operational evidence that should influence what happens next
- KPI: feedback on whether delivery improvements are affecting outcomes
- Decision: durable record for important technical trade-offs

## Linked Artefacts

- Related journeys:
  - `../journeys/ingest-signal-and-create-follow-up-work.md`
  - `../journeys/review-prioritised-work.md`
- Related KPIs:
  - `../kpis/reduce-time-from-idea-to-deployed-change.md`
- Related decisions:
  - `../decisions/use-workitem-as-core-node.md`
