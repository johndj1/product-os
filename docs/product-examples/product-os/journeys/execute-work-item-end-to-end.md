# Journey: Execute WorkItem End-To-End

## Metadata

- Journey name: Execute WorkItem End-To-End
- Product: Product OS
- Journey owner: Product OS team
- Last updated: 2026-03-08

## Actor

Primary actor: Execution agent  
Possible actors: Full-Stack Product Owner, Engineering Lead, AI Delivery Agent

## Trigger

A WorkItem has already been prioritised and is ready to move from planned work into active execution.

## Preconditions

- The Product already exists and the WorkItem is visible in the Product Work view.
- The WorkItem has enough context to start, ideally including description, acceptance criteria, parent context, and relevant Relationships.
- Any supporting Page, linked Signal, or related Decision needed for execution is already available or can be created before execution begins.
- The execution agent understands whether the work will be carried out manually, with Codex assistance, or through an automation pipeline outside Product OS.

## Steps

1. Select the WorkItem from the Product Work view or a recommended-next-work list and confirm it is the right thing to execute now.
2. Open the WorkItem detail view and review the title, description, acceptance criteria, status, parent WorkItem, related Signals, related Pages, and incoming or outgoing Relationships.
3. Check whether the WorkItem has enough context to be executable. If key information is missing, add clarifying notes, create a supporting Page, or create or update Relationships before starting.
4. Confirm what "done" means for this WorkItem by reading the acceptance criteria and any Product-level definition of done that applies.
5. Move the WorkItem into active execution by updating status when appropriate, then carry out the work in the relevant delivery environment.
6. Execute the change through the appropriate path:
   - Human-led path: a person implements the work, refers back to Product OS for context, and updates status or comments as the work progresses.
   - AI-assisted path: an AI delivery agent uses the WorkItem context and acceptance criteria as structured instructions, while a human still reviews outcomes.
   - Automation path: a pipeline or deterministic workflow performs a repeatable execution step, with Product OS remaining the place where resulting state and follow-up evidence are linked back.
7. Validate the result against the acceptance criteria and any operational checks that matter for the Product, such as whether the expected behavior changed, whether a prior failure stopped recurring, or whether the intended WorkItem outcome is now true.
8. Update the WorkItem status to `done` once the execution agent can credibly say the acceptance criteria are met.
9. Record the resulting feedback into Product OS by linking or ingesting any new Signal created by the work outcome, and update related KPI WorkItems if a measurable change is observed.
10. Review whether the completed WorkItem changed priority or context for related WorkItems, and add a Decision or Relationship if the completion exposed a durable trade-off or dependency lesson.

## Pain Points

- WorkItems that are well-prioritised can still be hard to execute if acceptance criteria are vague or supporting context lives outside the Product graph.
- Human, AI, and automation execution paths differ in speed, but they all fail when the WorkItem lacks clear boundaries or expected outcomes.
- Teams often mark work complete without feeding back the resulting Signal or KPI effect, which breaks the Product OS learning loop.

## Opportunities

- Treat acceptance criteria as the minimum contract for executable work, not optional decoration.
- Use Pages and Relationships to make execution context reusable instead of restating it in chat, commits, or ephemeral notes.
- Make "done" include feedback capture, not only implementation, so Product OS reflects whether the completed WorkItem had the intended effect.

## Signals

- Signal source: Execution outcome, validation result, operational monitoring, or post-release observation
- Signal type:
  - `test_failure` when a change does not meet validation expectations
  - `incident_alert` when execution causes or reveals production issues
  - `delivery_risk` when execution uncovers dependency or sequencing problems
  - `kpi_change` when the work outcome produces a measurable KPI movement
- Signal payload notes:
  - Validation evidence may start as notes on the WorkItem or a linked Page before it becomes a formal Signal
  - KPI feedback is most useful when it includes a matching KPI title and a new measured value
- Expected routing behavior: Resulting Signals should feed back into the Product OS loop through normal ingestion and may create or update follow-up WorkItems if the execution outcome reveals more work

## Desired Outcome

The selected WorkItem is executed with enough context to finish confidently, marked `done` only when its acceptance criteria are satisfied, and its resulting evidence is fed back into Product OS through Signals, KPI updates, and any necessary follow-up WorkItems or Decisions.

## Success Signals

- The execution agent can understand what to do from the WorkItem, its acceptance criteria, linked Page context, and Relationships.
- The WorkItem reaches `done` with a credible explanation of why it is complete.
- Validation outcomes and post-execution feedback are captured as Product OS evidence rather than disappearing into external tooling.
- Completion of one WorkItem improves the next prioritisation cycle because related Signals, KPI movement, and dependencies are now more accurate.

## Product OS Model Mapping

- Product: execution boundary and review context
- WorkItems created or updated: selected WorkItem updated through execution; follow-up WorkItems may be created if execution reveals new work
- Relationships created or used: existing dependency or support links used during execution; new links added if execution exposes missing context
- KPI influenced: relevant KPI WorkItems may show movement after successful or failed execution
- Decision references: a Decision may be recorded if execution exposes a lasting product or architecture choice

## Notes For Future Feature Design

- A WorkItem is only executable when context, acceptance criteria, and links to relevant Product objects are strong enough for either a human or an AI delivery agent to act without guessing.
- Human and AI execution paths overlap on the need for structured context; they differ mainly in who interprets ambiguity and who is trusted to declare completion.
- Product OS should be designed as an execution loop, not only a planning surface, so completion, validation, and feedback remain first-class parts of the model.
