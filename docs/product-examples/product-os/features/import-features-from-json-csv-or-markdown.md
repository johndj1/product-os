# Feature: Import Features from JSON, CSV, or Markdown

## Outcome Validation

- Linked Product: `Product OS`
- Primary persona: `Full-Stack Product Owner`
- Supporting perspectives: `Lead Engineer`, `Agile Delivery Lead`
- Linked Journey: `Execute WorkItem End-To-End`
- Derived Journey Step: `Turn structured builder inputs into reviewable Feature records without breaking Product OS traceability`
- Linked Outcome: `Builders can import multiple new Features from practical working formats while preserving Outcome linkage, canonical Feature quality, and safe review boundaries.`
- Assumption: Product OS does not currently expose an exact pre-existing named Outcome for multi-format Feature import, so this Feature uses the nearest suitable builder execution-efficiency Outcome implied by the `Execute WorkItem End-To-End` journey and the existing builder export/template examples.
- Work type: `feature`
- Classification: `enabling support work`
- Why this work should proceed now: Product OS can already create individual Features and can define a canonical CSV authoring template, but builders still lack a native way to turn prepared JSON, CSV, or Markdown inputs into Product OS Feature records without manual re-entry. That gap slows throughput, creates inconsistent Feature quality, and encourages off-platform preparation flows that can bypass outcome linkage.
- Evidence that the Outcome improved:
  - Builders can import prepared Feature batches from supported formats with fewer manual form submissions
  - Imported Features consistently retain linked Outcome references and canonical Feature sections
  - Import attempts fail early and clearly when hierarchy, template, or reference requirements are not met
  - Cleanup work after import decreases because builders preview and validate records before creation
- Proceed: `Yes`

## Title
Import Features from JSON, CSV, or Markdown into canonical Product OS Feature records.

## Summary
Provide builders with a native import flow that accepts bounded JSON, CSV, or Markdown inputs and converts them into Product OS `feature` WorkItems that remain linked to existing Outcomes, follow the canonical Feature template, and stay safe to review before creation. The goal is faster builder throughput for practical drafting workflows, not a broad document-management or free-form content-ingestion system.

## Scope Includes
- A builder-facing import entry point for creating multiple `feature` WorkItems from supported input formats:
  - structured JSON
  - canonical CSV
  - constrained Markdown that maps to the existing Feature template sections
- A normalization layer that converts each supported format into one canonical Product OS Feature draft shape before any records are written.
- Required linkage to an existing Outcome derived from a Journey Step for every imported Feature, using stable identifiers or deterministic matching rules that are visible to the builder.
- Validation that imported records respect current Product OS rules, including:
  - `feature` type only for this import path
  - valid `outcome_id` or equivalent resolvable Outcome reference
  - optional `capability -> feature` parent only where allowed by existing hierarchy rules
  - no silent creation of free-floating delivery work outside the golden thread
- Canonical Feature-template enforcement so imported records produce Product OS-ready Feature content with the expected sections:
  - `Title`
  - `Summary`
  - `Scope Includes`
  - `Out of Scope`
  - `Dependencies`
  - `Value`
  - `Acceptance Criteria`
  - `Definition of Done`
- A review step before write, including:
  - parsed preview of each candidate Feature
  - validation errors and warnings per row or document
  - explicit count of valid, invalid, and skipped items
  - clear separation between authoritative imported fields and Product OS-derived context
- Safe bulk-import workflow behavior:
  - bounded batch size appropriate for reviewable builder work
  - duplicate or collision handling for obviously conflicting Feature titles or references in the same Product context
  - partial-failure reporting that explains exactly which records were created and which were rejected
- Practical format-specific handling:
  - JSON for structured builder and agent outputs
  - CSV for spreadsheet-assisted backlog shaping
  - Markdown for human-authored or LLM-authored Feature drafts that already follow the canonical template
- Perspective-specific needs:
  - Full-Stack Product Owner: preserves why each Feature exists and which Outcome it improves
  - Lead Engineer: provides deterministic parsing, stable references, and import-safe validation behavior
  - Agile Delivery Lead: supports bounded bulk creation with clear readiness checks and manageable review surfaces

## Out of Scope
- Importing `story`, `task`, `bug`, or mixed WorkItem types through the same path
- Creating new Products, Personas, Journeys, Journey Steps, or Outcomes from imported files
- Generic document library features, file storage systems, or long-lived document-management workflows
- Unbounded whole-product imports or migration tooling for arbitrary external backlog systems
- Background-job orchestration, asynchronous queues, or autonomous retry pipelines
- Two-way sync between Product OS and spreadsheet, markdown, or external document tools
- Automatic decomposition of imported Features into Stories and Tasks during the same import action
- Free-form Markdown ingestion that accepts arbitrary headings or prose outside the canonical Feature template shape

## Dependencies
- The import flow must preserve the current Product OS hierarchy and rule model defined in:
  - `prisma/schema.prisma`
  - `src/lib/work-item-rules.ts`
  - `src/lib/work-item-hierarchy.ts`
  - `src/app/products/[productId]/work/create/route.ts`
- Imported Features must attach to existing Outcomes derived from Journey Steps; this flow must not weaken the `Outcome -> Feature -> Story -> Task` chain.
- Canonical Feature content must align with the repository standard in:
  - `docs/workitem-templates/feature-template.md`
  - `src/lib/workitem-templates.ts`
- The import flow should reuse existing Product OS creation semantics where possible instead of inventing a second write path with weaker validation.
- JSON, CSV, and Markdown parsers must map into one normalized internal representation so validation and record creation remain deterministic across formats.
- Lead Product Owner dependency: imported drafts must surface Outcome, Journey Step, and Journey context clearly enough to confirm customer-value alignment before creation.
- Lead Engineer dependency: format parsing, reference resolution, and duplicate handling must be explicit and testable.
- Agile Delivery Lead dependency: the import experience must keep batch size, review quality, and failure handling visible enough to avoid uncontrolled backlog growth.

## Value
This Feature improves the linked Outcome by letting builders move prepared Feature drafts into Product OS without repetitive copy-paste or row-by-row manual entry, while still preserving the system's outcome-driven structure. For the Full-Stack Product Owner, value comes from faster backlog shaping that does not lose Outcome context or canonical Feature quality. For the Lead Engineer, value comes from deterministic import behavior that respects existing hierarchy rules and avoids a second-class bulk write path. For the Agile Delivery Lead, value comes from reviewable batch creation with explicit validation, which increases throughput without turning Product OS into a generic intake queue. Evidence of value should appear as shorter time from prepared draft set to created Features, fewer malformed Feature records, fewer missing-template corrections after import, and consistent preservation of Outcome linkage in imported work.

## Acceptance Criteria
- Given a builder provides a supported JSON, CSV, or Markdown input
  When Product OS parses the file
  Then each candidate item is converted into one canonical Feature draft shape before validation or creation

- Given a candidate Feature lacks a resolvable Outcome reference
  When the import is validated
  Then Product OS rejects that candidate and explains that Features must link to an existing Outcome derived from a Journey Step

- Given a candidate Markdown Feature does not follow the canonical Feature template
  When Product OS validates the parsed draft
  Then the import reports the missing required sections and does not silently create a degraded Feature record

- Given a builder imports a valid batch
  When they review the import preview
  Then Product OS shows the parsed Feature title, linked Outcome context, template completeness, and any warnings before records are created

- Given a builder confirms creation for valid candidates
  When the import is executed
  Then Product OS creates only `feature` WorkItems in the selected Product context and preserves `outcome_id` linkage for each created record

- Given an imported candidate includes an optional parent capability reference
  When that reference resolves to an allowed `capability` WorkItem in the same Product
  Then the created Feature is attached using the existing `capability -> feature` hierarchy rule

- Given an imported candidate includes an invalid parent reference or parent type
  When the import is validated
  Then Product OS rejects that parent assignment and explains the hierarchy violation without creating an invalid relationship

- Given a batch contains both valid and invalid candidates
  When the builder runs the import
  Then Product OS reports exactly which candidates were created, skipped, or rejected, with actionable reasons for each invalid item

- Given a builder attempts to import an oversized or unreviewable batch
  When Product OS evaluates the request
  Then the system enforces a bounded limit and instructs the builder to split the batch into smaller reviewable sets

- Given a valid imported Feature is created
  When the builder later views it in Product OS
  Then the resulting record uses the same canonical Feature-writing standard as manually created Features rather than a format-specific variant

## Definition of Done
- Import from JSON, CSV, and Markdown is reviewable end to end as a builder workflow for creating outcome-linked Features.
- Supported formats map to one normalized internal Feature draft model with deterministic validation and creation behavior.
- Outcome linkage, optional capability parenting, and existing hierarchy rules remain faithful to Product OS domain constraints.
- Canonical Feature-template compliance is enforced so imported Features match the repository standard already used for Feature content.
- Preview, warnings, and failure reporting are clear enough that builders can correct issues before or after import without hidden data loss.
- Batch-size guardrails and conflict handling keep the workflow practical for builders without enabling uncontrolled bulk backlog creation.
- Documentation explains the expected JSON, CSV, and Markdown input shapes and how they map to Product OS Feature fields.
- The Feature is decomposed into execution-ready Stories covering at least:
  - input schema and parser normalization
  - preview and validation UX
  - hierarchy and Outcome-reference resolution
  - safe write execution and import reporting
