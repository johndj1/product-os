# Feature: Import reviewed WorkItem updates back into Product OS

## Outcome Validation

- Linked Product: `Product OS`
- Primary persona: `Full-Stack Product Owner`
- Supporting perspectives: `Lead Engineer`, `Agile Delivery Lead`
- Linked Journey: `Execute WorkItem End-To-End`
- Derived Journey Step: `Review externally refined WorkItem updates and safely apply approved changes back into Product OS`
- Linked Outcome: `Builders can round-trip reviewed WorkItem refinements back into Product OS without losing outcome linkage, hierarchy integrity, provenance, or review control.`
- Assumption: Product OS does not currently expose an exact named Outcome for round-trip WorkItem update import, so this Feature uses the nearest builder execution-control Outcome implied by the `Execute WorkItem End-To-End` journey and the existing builder handoff/export examples.
- Work type: `feature`
- Classification: `enabling support work`
- Why this work should proceed now: Product OS can already move WorkItem context outward into builder handoff packages, but the return path is still manual and error-prone. That leaves reviewed improvements trapped in external tools, encourages copy-paste overwrites, and weakens the system's role as the trusted source of outcome-linked delivery work.
- Evidence that the Outcome improved:
  - Builders can review externally refined WorkItem updates inside Product OS before applying them
  - Imported updates preserve `Outcome -> Feature -> Story -> Task` traceability and do not create hierarchy drift
  - Reviewers can see which fields changed, which fields were rejected, and why before any Product OS record is updated
  - Fewer manual copy-paste edits are needed to bring approved refinements back into canonical WorkItem records
- Proceed: `Yes`

## Title
Import reviewed WorkItem updates back into Product OS.

## Summary
Provide Product OS builders with a bounded round-trip workflow that accepts reviewed WorkItem update packages from external review tools or AI-assisted refinement flows, validates them against the current Product OS model, shows a field-level review surface, and applies only explicitly approved changes back to existing WorkItems. The goal is to preserve Product OS as the authoritative system for outcome-linked delivery work while making external review practical, not to create a generic two-way sync or blind overwrite mechanism.

## Scope Includes
- A builder-facing import path for reviewed update packages that originated from Product OS handoff exports or a compatible canonical update envelope.
- Update import for existing Product-scoped WorkItems only, using stable source identifiers and provenance metadata to match incoming changes to the correct records.
- A normalization and validation layer that converts incoming reviewed content into one canonical proposed-change model before any Product OS record is updated.
- Safe review-and-apply workflow behavior, including:
  - side-by-side or field-by-field diff of current Product OS values versus proposed imported values
  - explicit approve, reject, or skip handling per WorkItem or per changed field
  - validation warnings when imported content is stale, incomplete, or conflicts with current Product OS state
  - clear reporting of what was applied, what was not applied, and why
- Controlled update scope for fields that can safely participate in round-trip refinement, such as:
  - title
  - description
  - acceptance criteria
  - status where the transition remains valid and reviewable
  - bounded relationship or reference suggestions as review-only proposals when they do not fit direct update rules
- Preservation of Product OS hierarchy and traceability rules:
  - imported `feature` updates must retain valid `outcome_id` linkage
  - imported `story` updates must remain attached to a valid parent `feature`
  - imported `task` updates must remain attached to a valid parent `story`
  - imported changes must not silently convert relationship metadata into hierarchy or vice versa
- Conflict and provenance safeguards, including:
  - source WorkItem id and export version checks
  - stale-update detection when the Product OS record changed after export
  - visible handling for unsupported fields, missing source references, or cross-Product mismatches
- Perspective-specific needs:
  - Full-Stack Product Owner: retain customer outcome context while reviewing refined content
  - Lead Engineer: keep updates deterministic, auditable, and constrained to valid Product OS semantics
  - Agile Delivery Lead: make batch review bounded, legible, and safe enough for real execution throughput

## Out of Scope
- Blind overwrite of Product OS WorkItems from imported files or agent responses
- Generic bidirectional sync between Product OS and arbitrary external tools
- Import paths that create new Products, Personas, Journeys, Journey Steps, or Outcomes
- Free-form updates that can re-parent delivery work outside the existing hierarchy rules
- Autonomous application of AI-suggested changes with no human review checkpoint
- Unbounded bulk update runs that apply changes across an entire Product without review guardrails
- Background-job orchestration, queueing, or long-running synchronization infrastructure
- Replacing canonical Product OS editing screens for routine direct edits inside the app

## Dependencies
- The round-trip update flow must preserve the current Product OS model and guardrails defined in:
  - `prisma/schema.prisma`
  - `src/lib/work-item-rules.ts`
  - `src/lib/work-item-hierarchy.ts`
  - `src/app/products/[productId]/work/create/route.ts`
- The workflow should align with the existing builder handoff direction already described in:
  - `docs/product-examples/product-os/features/export-workitems-for-builder-agent-handoffs.md`
  - `docs/product-examples/product-os/stories/serialize-workitems-to-markdown.md`
- Imported reviewed content should reuse canonical WorkItem-writing standards already used for Product OS generated work rather than inventing a second content model.
- Product OS must remain the source of truth for hierarchy, Outcome linkage, and Product scoping; imported files can propose changes but cannot redefine those rules.
- Lead Product Owner dependency: the review surface must show linked Outcome, Journey Step, and Journey context clearly enough to verify that refined content still supports the intended customer value.
- Lead Engineer dependency: matching, diffing, conflict detection, and apply behavior must be deterministic and testable for the same import payload and current record state.
- Agile Delivery Lead dependency: batch limits, approval visibility, and apply reporting must keep the workflow reviewable instead of turning it into uncontrolled backlog mutation.

## Value
This Feature improves the linked Outcome by completing the builder round-trip: Product OS can already prepare WorkItems for external review, but it still needs a safe path for approved refinements to come back without degrading the product graph. For the Full-Stack Product Owner, value comes from capturing useful AI-assisted or external review improvements while keeping Outcome intent visible and protected. For the Lead Engineer, value comes from deterministic update application that respects current hierarchy, identifiers, and authoritative record ownership. For the Agile Delivery Lead, value comes from faster review cycles with fewer manual copy-paste merges and a lower risk of accidental backlog corruption. Evidence of value should appear as shorter time from external review to approved Product OS update, fewer manual reconciliation edits, fewer hierarchy or linkage mistakes during update application, and clearer auditability of which reviewed changes were accepted.

## Acceptance Criteria
- Given a builder imports a reviewed update package for a single exported WorkItem produced from Product OS or a compatible canonical envelope
  When Product OS parses the package
  Then each proposed update is matched to an existing WorkItem in the same Product by stable source identifiers before any apply action is allowed

- Given a proposed update targets a `feature`, `story`, or `task`
  When Product OS validates the import
  Then the system confirms the existing record still preserves valid `Outcome -> Feature -> Story -> Task` traceability and rejects any update that would break required linkage or parent-child rules

- Given a reviewed package includes proposed title, description, or acceptance-criteria changes
  When a builder opens the import review step
  Then Product OS shows the current value and proposed value for each changed field so the builder can approve or reject them explicitly

- Given a reviewed package includes unsupported fields or structure changes
  When the import is validated
  Then Product OS flags those changes as unsupported and does not silently apply or reinterpret them

- Given the source WorkItem changed in Product OS after the reviewed package was exported
  When the builder attempts to apply the import
  Then Product OS detects the stale or conflicting update, warns the builder, and requires an explicit review decision instead of silently overwriting newer state

- Given a reviewed package references a WorkItem from another Product or a missing WorkItem id
  When Product OS validates the import
  Then the update is rejected with a clear provenance or scope error and no record is modified

- Given a builder approves only a subset of proposed changes in a valid import batch
  When the apply action runs
  Then Product OS applies only the approved changes, leaves rejected or skipped fields untouched, and reports the final applied results per WorkItem

- Given a builder imports a reviewed package containing multiple WorkItem updates
  When Product OS validates the batch
  Then each proposed update is matched, previewed, and reported independently so one invalid item does not silently corrupt or overwrite another

- Given an imported update proposes a status change
  When Product OS validates and applies it
  Then the status update is allowed only if it maps to a valid Product OS status value and remains reviewable in context rather than being treated as an uncontrolled sync action

- Given a builder imports a bounded batch of reviewed updates
  When Product OS completes validation
  Then the system reports valid, conflicted, rejected, and unsupported items separately so the batch can be reviewed safely before apply

- Given approved updates are applied successfully
  When the builder later views the WorkItem in Product OS
  Then the resulting record remains in the canonical Product OS content standard and retains its original hierarchy and Outcome traceability rather than appearing as an externally owned variant

## Definition of Done
- Reviewed-update import is implemented as a bounded review-and-apply workflow for existing Product OS WorkItems.
- Matching, normalization, diffing, validation, and apply behavior are deterministic and preserve Product scoping.
- Outcome linkage, hierarchy semantics, and canonical WorkItem content remain faithful to current Product OS rules after import.
- Stale data, unsupported fields, provenance errors, and conflict conditions are surfaced clearly before changes are applied.
- The workflow makes external review useful without introducing blind overwrite behavior or generic two-way synchronization.
- Documentation explains the accepted reviewed-update package shape, provenance requirements, supported update fields, and apply semantics.
- The Feature is decomposed into execution-ready Stories covering at least:
  - reviewed-update package schema and normalization
  - import diff and approval UX
  - conflict detection and provenance validation
  - safe apply execution and reporting
