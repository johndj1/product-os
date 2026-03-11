# Story: Export a single WorkItem for builder review

## Linked Outcome
Support the Product OS execution-efficiency outcome that builders can move from structured WorkItems to confident follow-up action faster. Journey context: `Execute WorkItem End-To-End` and the derived step of preparing execution-ready WorkItem context for human and AI-assisted delivery.

## Description
Add the ability for a builder to export one WorkItem from Product OS as a bounded handoff package that can be reviewed by an AI system or a human without manual copy/paste reconstruction.

## Context / Background
Product OS already stores the title, type, status, description, acceptance criteria, parent chain, linked outcome context, and related graph references needed to understand a delivery item. Today, a builder must manually collect that material from the WorkItem detail page before asking an LLM to review or refine the work. That slows execution and increases the risk that exported context drops outcome linkage or delivery boundaries.

## Problem / Need
Without a direct single-item export path, Product OS cannot turn one selected WorkItem into a clean, reusable review package for downstream AI-assisted review or subsequent builder action.

## Scope of Work
- Add a single-WorkItem export action from an appropriate builder entry point such as the WorkItem detail view.
- Retrieve the selected WorkItem and the minimum linked context needed for review, including core fields and delivery lineage.
- Package the export in a bounded structure so one WorkItem remains one reviewable item.
- Preserve explicit indicators for missing optional context instead of inferring data that Product OS does not hold.

## Acceptance Criteria (Gherkin)
Given a builder is viewing a WorkItem detail page
When they choose to export that WorkItem
Then Product OS returns a single bounded export package for that WorkItem

Given the exported WorkItem has description and acceptance criteria
When the export is generated
Then those fields are included without requiring manual copy/paste

Given the exported WorkItem has missing optional linked context
When the export is generated
Then the export remains valid and marks the absent context explicitly

## Operational Readiness
- Export generation should fail clearly if the WorkItem cannot be found in the current Product scope.
- Logging or audit notes should be sufficient to understand which Product and WorkItem were exported.
- The action should be safe to use repeatedly without mutating the source WorkItem.

## Deliverables
- Builder-facing single-WorkItem export entry point
- Retrieval and serialization logic for one WorkItem package
- Tests covering valid export and missing-WorkItem handling
- Documentation showing how a builder uses the exported package for review

## Definition of Done
- Single-item export is implemented and verifiable end to end.
- Acceptance criteria pass.
- Handoff quality is high enough that the exported item can be used directly for review or next-step action.
