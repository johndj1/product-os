# Journey: Review Prioritised Work

## Metadata

- Journey name: Review Prioritised Work
- Product: Product OS
- Journey owner: Product OS team
- Last updated: 2026-03-08

## Actor

Primary actor: Full-Stack Product Owner  
Supporting actor: Engineering Lead

## Trigger

A planning session, daily review, or response to new Signal pressure starts and the team needs to confirm what deserves attention next.

## Steps

1. Open the Product Work view for the relevant Product.
2. Review the recommended next WorkItems produced by deterministic priority scoring.
3. Inspect each priority reason, looking for status effects, outcome or KPI relevance, active Signal pressure, and blocker or dependency pressure.
4. Open specific WorkItems when needed to confirm whether the title, status, and linked context still reflect reality.
5. Update WorkItem statuses where progress has changed so the ranking is based on current information.
6. Add or correct Relationships when dependency pressure or strategic linkage is missing from the graph.
7. Cross-check the top WorkItems against KPI movement and recent Signals to confirm the queue reflects current Product needs.
8. Record a Decision if the review reveals a meaningful trade-off that should stay visible beyond the meeting.

## Pain Points

- Priority scoring is useful only when status, hierarchy, and Relationships are maintained.
- Work can appear more important than it is if stale Signals remain active or finished WorkItems are not updated.
- Teams can over-focus on urgent operational pressure and lose sight of KPI or outcome relevance.

## Opportunities

- Use the score explanation as a debugging tool for the Product graph, not just a ranking output.
- Improve prioritization quality by fixing missing Relationship context instead of manually overriding everything.
- Turn repeated review friction into new WorkItems that improve graph hygiene or Signal handling.

## Signals

- Signal source: Active Signals already linked to WorkItems in the Product
- Signal type: Any active Signal, especially `delivery_risk`, `test_failure`, `incident_alert`, and `kpi_change`
- Signal payload notes: Severity and active status affect the amount of pressure added to a WorkItem's priority score
- Expected routing behavior: Signals do not directly reorder work in this view by hand; they influence the deterministic scoring inputs

## Desired Outcome

The next set of WorkItems is understandable, justified by visible context, and credible enough that the team can act without a separate reconciliation exercise.

## Success Signals

- Recommended next WorkItems have explanations that make sense to the reviewing operators.
- Priority shifts can usually be explained by a change in status, strategic linkage, active Signals, or dependency pressure.
- The review produces small graph corrections that improve the next cycle instead of only one-off manual decisions.

## Product OS Model Mapping

- Product: scope for the review session
- WorkItems created or updated: active WorkItems under review, plus any follow-up Decision or hygiene work discovered during review
- Relationships created or used: `blocks`, `depends_on`, `supports`, `relates_to`, `informs`, `impacts`
- KPI influenced: review checks whether prioritized work still supports KPI movement
- Decision references: Decisions capture important trade-offs uncovered during prioritization
