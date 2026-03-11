# Feature: Fix WorkItem status management flow

## Outcome Validation

- Linked Product: `Product OS`
- Primary persona: `Full-Stack Product Owner / Product Builder`
- Supporting perspectives: `Engineering Lead`, `AI Delivery Agent`
- Linked Journey: `Review Prioritised Work`
- Derived Journey Step: `Inspect current WorkItem state and update status immediately when the delivery reality has changed`
- Linked Outcome: `The next set of WorkItems is understandable, justified by visible context, and credible enough that the team can act without a separate reconciliation exercise.`
- Assumption: Product OS does not currently define a separate named Outcome specifically for status management, so this Feature attaches to the nearest existing builder outcome in `Review Prioritised Work`, where trustworthy status is required for credible queue review and execution decisions.
- Work type: `feature`
- Classification: `enabling support work`
- Why this work should proceed now: Product OS already uses WorkItem status in prioritisation, execution flow, and signal follow-up review, but the current status-management experience is still fragmented across a narrow backend route, partial UI controls, and unclear transition expectations. That weakens builder trust in the graph and makes routine backlog curation and delivery management more manual than they should be.
- Evidence that the Outcome improved:
  - Builders can see the current status clearly in every main WorkItem review surface
  - Builders can update status from the places where review and execution decisions already happen
  - Status changes persist reliably and immediately influence prioritisation and execution context
  - Fewer planning or execution conversations are spent reconciling whether a WorkItem is really `ready`, `in_progress`, `blocked`, or `done`
- Proceed: `Yes`

## Title
Fix WorkItem status management flow

## Summary
Provide Product OS builders with a consistent status-management capability that makes WorkItem lifecycle state visible, reliable, and usable across the backend and the main builder UI surfaces. Builders should be able to see current status clearly, understand what statuses are allowed, update status from the places where they already work, and trust that those changes persist correctly. The goal is to make progress management practical inside Product OS day to day, not to introduce a generic workflow engine or heavyweight admin console.

## Scope Includes
- Consistent status visibility for WorkItems in the main builder workflow surfaces, including:
  - Product Work view
  - WorkItem detail view
  - any nearby builder context where status is already used to explain priority or execution readiness
- A reliable Product-scoped backend update path for WorkItem status that:
  - validates the requested status against the canonical Product OS status enum
  - confirms the WorkItem belongs to the selected Product
  - updates the persisted record deterministically
  - returns clear success or error outcomes to the UI
- UI controls that let builders update status from the places where they already review or act on work rather than sending them to a separate maintenance flow.
- Clear definition and display treatment for canonical statuses:
  - `new`
  - `ready`
  - `in_progress`
  - `blocked`
  - `done`
  - `cancelled`
- Clarification of the practical status flow builders should use when managing delivery work, including:
  - when a Feature, Story, or Task should remain `new`
  - when work is ready enough to move to `ready`
  - when active work should move to `in_progress`
  - when execution friction should be represented as `blocked`
  - when accepted or superseded work should move to `done` or `cancelled`
- Clear allowed status transitions or transition guidance so Product OS does not leave builders guessing which lifecycle moves are expected in routine use.
- Practical builder workflow support for the most common status operations:
  - moving planned work into `ready`
  - starting active work with `in_progress`
  - marking delivery friction with `blocked`
  - completing accepted work with `done`
  - cancelling work that should no longer affect prioritisation
- Immediate feedback in builder views so updated status is visible without ambiguity after save.
- Priority-scoring alignment so status changes continue to affect recommended-next-work behaviour using the existing deterministic scoring model.
- Error handling for common failure cases, including:
  - invalid status values
  - missing or cross-Product WorkItem references
  - stale or failed updates that would otherwise leave builders unsure whether the save worked
- Perspective-specific needs:
  - Full-Stack Product Owner / Product Builder: keep backlog curation, review, and active delivery state aligned in one place
  - Engineering Lead: keep active delivery flow visible and current without status drift
  - AI Delivery Agent: consume stable status values that match the current Product OS record when generating or reviewing execution support

## Out of Scope
- Introducing custom workflow states beyond the canonical Product OS status set
- Complex workflow engines or configurable state-machine tooling
- Role-based approval workflows for moving work between states
- Enterprise BPM or process-orchestration tooling
- Replacing hierarchy, Relationship, or Outcome linkage with status-driven logic
- Generic admin tooling for mass editing arbitrary fields outside builder review and execution workflows
- Autonomous status changes driven by AI, Signals, or background jobs without explicit builder review
- Assignment, scheduling, SLA tracking, or time-in-state analytics unless separately defined
- A full workflow-rule engine with type-specific transition policies beyond the current canonical status model
- Bulk status mutation across an entire Product with no bounded builder review step
- New notification systems or alerting behavior unless already supported elsewhere in Product OS

## Dependencies
- Status management must remain faithful to the canonical WorkItem model and status enum in:
  - `prisma/schema.prisma`
  - `src/lib/work-item-rules.ts`
- The capability should strengthen, not weaken, existing Product-scoped write behaviour in:
  - `src/app/products/[productId]/work/[workItemId]/status/route.ts`
  - `src/app/products/[productId]/work/[workItemId]/update/route.ts`
  - `src/app/products/[productId]/work/page.tsx`
  - `src/app/products/[productId]/work/[workItemId]/page.tsx`
- Existing status validation rules and canonical values already used during WorkItem creation and update must remain aligned with:
  - `src/app/products/[productId]/work/create/route.ts`
- Status changes must continue to interact correctly with current prioritisation behaviour in:
  - `src/lib/priority-scoring.ts`
- The workflow must preserve the Product OS model in which status is a lifecycle attribute on a WorkItem, not a replacement for Outcome linkage, parent-child hierarchy, Relationships, or Signals.
- Full-Stack Product Owner / Product Builder dependency: the same status shown in review surfaces must be the status stored by the backend so curation and prioritisation do not depend on hidden state.
- Engineering Lead dependency: the status interaction must be fast enough for routine delivery hygiene rather than feeling like a separate admin task.
- AI Delivery Agent dependency: exported or prompt-generated WorkItem context should reflect the same canonical persisted status builders see in the UI.

## Value
This Feature improves the linked Outcome by removing one of the main reasons prioritised work becomes untrustworthy: stale, unclear, or hard-to-update lifecycle state. For the Full-Stack Product Owner / Product Builder, value comes from being able to curate backlog items, start delivery work, unblock reviews, and close or cancel outdated work without leaving the main Product OS workflow. For the Engineering Lead, value comes from seeing delivery flow represented credibly through `ready`, `in_progress`, `blocked`, `done`, and `cancelled` rather than through tribal knowledge. For the AI Delivery Agent, value comes from consuming stable, current WorkItem state when preparing execution support. Evidence of value should appear as clearer builder understanding of active versus superseded work, faster correction of incorrect status, smoother backlog curation, more reliable prioritisation signals, and fewer disagreements about whether work is ready, in progress, blocked, complete, or no longer relevant.

## Acceptance Criteria
- Given a builder opens the Product Work view
  When WorkItems are rendered
  Then each WorkItem shows its current canonical status clearly and offers a direct status update control in that workflow

- Given a builder opens an individual WorkItem detail view
  When they inspect execution context
  Then the current status is visible there and can be updated without returning to a separate list-only control

- Given a builder is working with a Feature, Story, or Task
  When they inspect the available status options
  Then Product OS makes the allowed canonical statuses and the intended practical flow between them clear enough for routine builder use

- Given a builder submits a valid status change for a WorkItem in the current Product
  When Product OS processes the request
  Then the backend persists the new canonical status and the UI confirms the update clearly

- Given a status update request includes a value outside the canonical Product OS status set
  When the backend validates the request
  Then the update is rejected and the builder receives a clear error instead of a silent failure or partial write

- Given a status update request targets a WorkItem that does not belong to the selected Product or no longer exists
  When Product OS validates the request
  Then the update is rejected with a Product-scoped not-found error and no other WorkItem is modified

- Given a builder changes a WorkItem from an active status to `done` or `cancelled`
  When they return to prioritised work views
  Then the WorkItem's ranking and active-work treatment reflect the existing deterministic priority rules for completed or cancelled work

- Given a builder changes a WorkItem into `blocked`
  When another builder later reviews the queue
  Then the blocked state is visible in the main builder UI and can be acted on without needing backend inspection

- Given a builder is curating backlog items before execution starts
  When they use status in the Work view
  Then they can distinguish work that is merely captured, ready to start, actively in progress, blocked, completed, or superseded without relying on hidden conventions

- Given a builder updates status successfully
  When they later open the same WorkItem in another first-party Product OS surface
  Then the same persisted status is shown consistently rather than conflicting with the previous view

- Given the status-management capability is used on `feature`, `story`, `task`, `bug`, `research`, `incident`, `decision`, `outcome`, `kpi`, or `capability` WorkItems
  When Product OS renders and updates the record
  Then the status behaviour stays consistent with the shared canonical WorkItem lifecycle rather than creating a special-case admin path

- Given a builder completes a status change from the UI
  When the request succeeds or fails
  Then Product OS provides clear result feedback so the builder knows whether the new state is now authoritative

## Definition of Done
- Status management is reviewable end to end in the backend and the main builder UI surfaces used for prioritisation and execution.
- Builders can view and update canonical WorkItem status without leaving the normal Product OS workflow.
- Allowed statuses and practical transition guidance are implemented or documented clearly enough for day-to-day Feature, Story, and Task management.
- Product scoping, validation, and error handling are deterministic and clear.
- Updated status remains consistent across list, detail, and downstream Product OS usage such as prioritisation and execution support.
- Builder workflow for backlog curation and delivery management is demonstrated end to end.
- Documentation or in-product guidance is updated where needed so builders understand the intended status flow.
- Status updates are verified in practice across backend and UI behavior.
- The capability improves builder workflow reliability without introducing a generic workflow engine or weakening Outcome-linked delivery modelling.
- The Feature is decomposed into execution-ready Stories covering at least:
  - status update backend hardening
  - Work view status interaction improvements
  - WorkItem detail status editing
  - cross-surface consistency and prioritisation verification
