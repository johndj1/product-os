# Persona: Full-Stack Product Owner

## Metadata

- Persona name: Full-Stack Product Owner
- Product: Product OS
- Document owner: Product OS team
- Last updated: 2026-03-08

## Persona Profile

- Role: Primary operator of Product OS for shaping Product direction, translating Signals into action, and keeping delivery tied to measurable outcomes.
- Primary goals:
  - Turn incoming evidence into clear, well-linked WorkItems without losing momentum.
  - Keep the Product graph coherent from outcome to task level.
  - Use KPIs and recent activity to decide what should happen next.
- Key decisions this persona influences:
  - Which WorkItems deserve attention now.
  - When a trade-off should be recorded as a Decision.
  - Whether a Signal should create new work, update existing work, or stay informational.

## Responsibilities In Product OS

- WorkItems this persona creates or updates:
  - Outcome, KPI, capability, feature, story, research, bug, incident, decision
  - Status updates on active WorkItems during review cycles
- Relationships this persona maintains:
  - Adds `supports`, `relates_to`, `informs`, and `impacts` links when clarifying why work exists
  - Reviews missing links when prioritization feels weak or disconnected
- Signals this persona reviews:
  - `delivery_risk`
  - `kpi_change`
  - `test_failure`
  - `incident_alert`
- KPIs this persona monitors:
  - Product-level KPI WorkItems, especially whether current values are moving toward target values
- Decisions this persona records or approves:
  - Product trade-offs, sequencing choices, and structural decisions that affect multiple WorkItems

## Behaviors

- Planning behavior:
  - Starts with Product outcomes and KPI movement before creating more delivery work
  - Uses hierarchy and Relationships to keep new WorkItems grounded in strategic context
- Delivery behavior:
  - Reviews recommended next WorkItems, checks score reasons, and adjusts status or structure when the queue looks wrong
  - Uses Decisions when a choice should remain visible after the immediate work is done
- Operational behavior:
  - Treats Signals as evidence, not just noise
  - Checks routing notes and follow-up WorkItems to confirm Signal ingestion created useful outcomes

## Friction And Opportunities

- Friction point: Context is easy to fragment when WorkItems exist without clear Relationships or outcome linkage.
- Related Signal: `delivery_risk`
- Opportunity: Tighten graph hygiene during planning reviews so priority scoring has better context.
- Potential follow-up WorkItem: Story to improve Product graph completeness and review discipline

- Friction point: KPI movement can be visible, but the cause of the change may still require manual interpretation.
- Related Signal: `kpi_change`
- Opportunity: Link KPI changes to the most relevant WorkItems and record a Decision when the response is non-obvious.
- Potential follow-up WorkItem: Research WorkItem to investigate KPI movement and proposed response

- Friction point: Automatic follow-up creation helps, but poor Signal quality can still produce noisy work.
- Related Signal: `test_failure` or `incident_alert`
- Opportunity: Improve intake quality and routing review patterns rather than treating every generated WorkItem as equally urgent.
- Potential follow-up WorkItem: Story to improve Signal payload quality and triage guidance

## Success Signals

- New Signals are converted into the right WorkItems with minimal manual cleanup.
- Recommended next WorkItems feel credible because Relationships and status are current.
- KPI WorkItems show current and target values that support real prioritization decisions.
- Decisions exist for important trade-offs instead of living only in transient discussion.

## Product OS Mapping

- Product: operating boundary and context for all work
- WorkItem: primary surface for planning, prioritization, and execution tracking
- Relationship: traceability layer that explains why work matters and how it connects
- Signal: intake mechanism for new evidence and delivery pressure
- KPI: outcome feedback loop used during review and prioritization
- Decision: durable record of important trade-offs

## Linked Artefacts

- Related journeys:
  - `../journeys/create-a-new-product.md`
  - `../journeys/ingest-signal-and-create-follow-up-work.md`
  - `../journeys/review-prioritised-work.md`
- Related KPIs:
  - `../kpis/reduce-time-from-idea-to-deployed-change.md`
- Related decisions:
  - `../decisions/use-workitem-as-core-node.md`
