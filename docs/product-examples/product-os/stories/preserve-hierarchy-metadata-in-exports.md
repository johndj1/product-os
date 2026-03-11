# Story: Preserve hierarchy metadata in exported WorkItems

## Linked Outcome
Support the Product OS execution-efficiency outcome that builders can hand off work without losing the meaning of where it sits in the delivery chain. Journey context: `Execute WorkItem End-To-End` and the derived step of preparing execution-ready WorkItem context for human and AI-assisted delivery.

## Description
Ensure exported WorkItems preserve the hierarchy and traceability metadata needed for downstream reviewers to understand how the work fits into `Outcome -> Feature -> Story -> Task`.

## Context / Background
Product OS is outcome-driven, and exported work loses much of its value if it becomes disconnected from the customer outcome, the parent Feature, or the child execution slices that explain how delivery should proceed. External AI systems are especially prone to making weak recommendations when hierarchy context is missing or flattened.

## Problem / Need
Without explicit hierarchy metadata, exported WorkItems become generic tickets instead of outcome-linked delivery records, which undermines Product OS principles and lowers review quality.

## Scope of Work
- Include linked Outcome context for exported Features.
- Include parent and child references needed to reconstruct `Feature -> Story -> Task` lineage for exported Stories and Tasks.
- Preserve hierarchy semantics without misusing Relationships or other graph links as parent-child structure.
- Expose missing hierarchy context explicitly when it is absent from the source data.

## Acceptance Criteria (Gherkin)
Given a feature WorkItem is exported
When the export is generated
Then the linked Outcome context is included in the export

Given a story or task WorkItem is exported
When the export is generated
Then the export includes enough parent lineage to trace the item through the delivery chain

Given related Relationships, Signals, Decisions, or Pages also exist
When the export is generated
Then those references are kept distinct from hierarchy metadata and are not represented as parent-child links

## Operational Readiness
- Export validation should detect when hierarchy metadata is incomplete or unavailable.
- Sample exports should be reviewed to confirm that downstream AI systems can identify the delivery chain correctly.
- Documentation should clarify the difference between hierarchy and other graph context in the export.

## Deliverables
- Hierarchy metadata mapping for export payloads
- Tests covering feature, story, and task lineage preservation
- Example exports showing correct traceability handling
- Documentation for hierarchy semantics in export output

## Definition of Done
- Hierarchy metadata preservation is implemented and verifiable.
- Acceptance criteria pass.
- Exported work remains meaningfully traceable to the Product OS delivery chain.
