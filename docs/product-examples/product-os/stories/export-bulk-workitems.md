# Story: Export a selected bulk set of WorkItems

## Linked Outcome
Support the Product OS execution-efficiency outcome that builders can review and act on grouped delivery work faster without losing the delivery chain. Journey context: `Execute WorkItem End-To-End` and the derived step of preparing execution-ready WorkItem context for human and AI-assisted delivery.

## Description
Allow a builder to export a selected, bounded set of WorkItems from Product OS so grouped review, bulk refinement, and downstream automation support can happen without manually stitching multiple records together.

## Context / Background
Many builder workflows involve reviewing several related WorkItems together, such as a Feature with its Stories or a selected set of backlog items prepared for prompt construction. Product OS already holds the graph context needed for those items, but there is no native bulk export slice that keeps item boundaries explicit and avoids turning the export into an unbounded graph dump.

## Problem / Need
Without a bounded bulk export path, builders must export or copy WorkItems one by one, which increases friction, reduces consistency, and makes grouped AI review less reliable.

## Scope of Work
- Add support for exporting a selected set of WorkItems rather than only one record.
- Keep item boundaries explicit so downstream tools can distinguish one WorkItem from another.
- Enforce bounded selection behavior rather than allowing a whole-product export from a builder handoff action.
- Preserve the selected set’s hierarchy references where items relate to one another.

## Acceptance Criteria (Gherkin)
Given a builder has selected multiple WorkItems for export
When they trigger a bulk export
Then Product OS returns one bounded export package containing each selected WorkItem as a distinct item

Given the selected WorkItems include parent and child delivery items
When the bulk export is generated
Then hierarchy references between the selected items are preserved

Given the builder submits an empty or unsupported selection
When the bulk export is requested
Then Product OS responds with a clear validation message and does not generate malformed output

## Operational Readiness
- Selection limits or validation should prevent accidental whole-product export from the builder workflow.
- Export results should remain deterministic for the same selected set.
- Auditability should identify the Product and selected WorkItem ids in the export event.

## Deliverables
- Builder-facing bulk export entry point for selected WorkItems
- Selection validation and bounded bulk serialization logic
- Tests covering valid, empty, and unsupported selections
- Documentation for bulk review and refinement workflows

## Definition of Done
- Selected bulk export is implemented and verifiable end to end.
- Acceptance criteria pass.
- The output is safe and reviewable enough for grouped downstream builder action.
