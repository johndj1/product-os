# Journey: Respond To KPI Movement And Create Follow-Up Work

## Metadata

- Journey name: Respond To KPI Movement And Create Follow-Up Work
- Product: Product OS
- Journey owner: Product OS team
- Last updated: 2026-03-08

## Actor

Primary actor: Full-Stack Product Owner  
Supporting actors: Engineering Lead, AI Delivery Agent

## Trigger

A KPI changes meaningfully, or a KPI-related Signal makes the team re-evaluate whether the current WorkItem queue still reflects Product reality.

## Preconditions

- The Product already has at least one KPI defined and linked to relevant WorkItems or outcome context.
- Recent KPI movement is visible through a KPI update, a `kpi_change` Signal, or related operational evidence linked to the Product.
- The Product already has active or recently completed WorkItems that could explain the KPI movement.
- The operator can review current Relationships, Signals, acceptance criteria, and Decisions before creating more follow-up work.

## Steps

1. Open the Product view and inspect the KPI that moved, including its current value, recent direction, and any nearby WorkItems or Signals linked to it.
2. Review related Signals to understand what evidence sits behind the movement, such as `kpi_change`, `incident_alert`, `delivery_risk`, or execution outcomes from recently completed WorkItems.
3. Check whether the movement appears good, bad, or ambiguous by comparing it with the intended Product outcome and the acceptance criteria of any WorkItem believed to have influenced it.
4. Inspect Relationships between the KPI, the affected WorkItems, and any supporting context to confirm whether the graph explains the movement or whether important linkage is missing.
5. Decide the response path:
   - No new work if the KPI movement is expected and current WorkItems already cover the next step.
   - Create a follow-up WorkItem if investigation, mitigation, rollout refinement, or measurement hardening is now needed.
   - Record a Decision if the movement exposes a durable product or architecture trade-off that should remain visible beyond one cycle.
6. When creating a follow-up WorkItem, write it so it is executable: connect it to the Product, relate it to the KPI or originating Signal, and include acceptance criteria that make the intended response testable.
7. If the KPI movement reveals missing graph context rather than missing delivery work, add or correct Relationships so prioritisation reflects the real dependency or outcome structure.
8. Return to the prioritised work view and confirm whether the new WorkItem, updated Relationship context, or recorded Decision changes what should happen next.
9. Leave the Product in a state where the KPI movement, interpretation, and chosen response are all traceable by the next operator.

## Pain Points

- KPI movement rarely explains itself; without linked Signals and Relationships, teams can overreact to noise or ignore meaningful change.
- A positive KPI movement can still be ambiguous if it came from a temporary workaround, seasonality, or an unrelated operational event.
- Follow-up work is often created too vaguely unless acceptance criteria are tied to the observed KPI change and the intended Product response.

## Opportunities

- Treat KPI review as an operating loop that validates whether completed WorkItems had the intended effect.
- Use Relationships and Decisions to separate "we need more delivery work" from "we learned something that should change future prioritisation."
- Let AI-assisted triage suggest likely follow-up WorkItems or Decision candidates while keeping human review responsible for interpreting ambiguity.

## Signals

- Signal source: KPI updates, `kpi_change` Signals, recent execution outcomes, and operational Signals linked to the same Product area
- Signal type:
  - `kpi_change` when a measured value moves directly
  - `incident_alert` when KPI degradation may be tied to reliability issues
  - `delivery_risk` when the movement suggests sequencing, scope, or dependency problems
- Signal payload notes:
  - KPI movement is most useful when the Signal identifies the KPI title, new value, and any nearby explanatory context
  - Related WorkItems and acceptance criteria help determine whether the movement is expected, harmful, or inconclusive
- Expected routing behavior: implemented routing may update the KPI and create initial investigation work for some cases, but human review decides whether the right response is a new WorkItem, a Decision, a Relationship correction, or no further action

## Desired Outcome

Product OS behaves like a feedback system: KPI movement is interpreted in context, the right follow-up action is created only when needed, and the resulting WorkItem or Decision feeds directly back into prioritisation.

## Success Signals

- The operator can explain why the KPI moved using linked Signals, WorkItems, Relationships, and recent execution evidence.
- Follow-up WorkItems created from KPI movement have clear acceptance criteria and visible links back to the originating KPI or Signal.
- Decisions are recorded when the response is primarily about trade-offs or operating policy rather than more delivery work.
- Prioritisation changes for understandable reasons after the KPI review, instead of relying on ad hoc meeting memory.

## Product OS Model Mapping

- Product: boundary for the KPI review and response
- WorkItems created or updated: investigation, mitigation, measurement-improvement, or rollout-refinement WorkItems created when KPI movement requires action
- Relationships created or used: `impacts`, `informs`, `supports`, `depends_on`, `relates_to` used to connect KPI movement to the existing Product graph
- KPI influenced: the reviewed KPI is updated or reinterpreted using current evidence and follow-up action
- Decision references: Decisions capture durable trade-offs revealed by KPI movement, especially when the response is not just "do more work"
