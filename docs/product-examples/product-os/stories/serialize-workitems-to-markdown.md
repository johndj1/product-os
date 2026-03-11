# Story: Serialize exported WorkItems to markdown

## Linked Outcome
Support the Product OS execution-efficiency outcome that builders can quickly turn structured work into review-ready prompts and action packages. Journey context: `Execute WorkItem End-To-End` and the derived step of preparing execution-ready WorkItem context for human and AI-assisted delivery.

## Description
Provide markdown serialization for exported WorkItems so builders can use Product OS output directly in LLM prompts, review documents, and handoff notes without reformatting the source material manually.

## Context / Background
Markdown is the most practical interchange format for many builder workflows because it is readable by humans, accepted by most LLM tools, and easy to paste into prompt-driven refinement flows. Product OS already uses canonical Feature and Story templates, which makes markdown export a strong fit if the serializer preserves structure consistently.

## Problem / Need
Without markdown serialization, builders cannot easily use exported WorkItems in prompt construction or review flows that expect readable structured text.

## Scope of Work
- Serialize single and bulk export content into structured markdown.
- Preserve canonical headings and list structure where they exist on Feature and Story content.
- Make the exported markdown readable by humans and stable enough for AI review.
- Include provenance and context sections that explain what was exported and from where.

## Acceptance Criteria (Gherkin)
Given a builder exports a WorkItem in markdown format
When the export is generated
Then the output is valid markdown with readable structure and explicit section boundaries

Given the exported WorkItem contains canonical Feature or Story content
When markdown is produced
Then the canonical structure is preserved rather than flattened into unlabelled text

Given a builder exports a selected bulk set to markdown
When the export is generated
Then each WorkItem remains clearly separated and identifiable in the document

## Operational Readiness
- Markdown output should be deterministic for the same input data.
- Formatting should avoid ambiguous structure that makes downstream review harder.
- Sample markdown exports should be reviewed in a real builder prompt workflow.

## Deliverables
- Markdown serializer for single and bulk WorkItem exports
- Tests covering canonical content preservation and item separation
- Sample markdown exports
- Documentation showing markdown-based AI review usage

## Definition of Done
- Markdown export is implemented and verifiable.
- Acceptance criteria pass.
- The format is good enough for direct builder review and prompt construction.
