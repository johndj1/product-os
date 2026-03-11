# Story: Validate export safety and selection handling

## Linked Outcome
Support the Product OS execution-efficiency outcome that builders can use exports confidently without creating unsafe or misleading downstream inputs. Journey context: `Execute WorkItem End-To-End` and the derived step of preparing execution-ready WorkItem context for human and AI-assisted delivery.

## Description
Add validation and safety handling around export selection, unsupported states, and missing readiness signals so exported WorkItems are safe for downstream AI review and builder action.

## Context / Background
Machine-readable exports are useful only if they are bounded, explicit, and trustworthy. Product OS should not let builders create exports that silently omit critical context, over-export Product data, or present incomplete work as execution-ready without warning.

## Problem / Need
Without explicit export-safety handling, builders may hand malformed, over-broad, or misleading payloads to downstream systems, which increases review noise and weakens traceability.

## Scope of Work
- Validate empty, unsupported, or out-of-scope selections before export generation.
- Surface readiness gaps such as missing canonical sections or absent acceptance criteria where relevant.
- Prevent builder handoff actions from behaving like generic whole-product dump utilities.
- Add clear error or warning semantics so downstream users understand the export’s quality and limits.

## Acceptance Criteria (Gherkin)
Given a builder attempts to export an empty selection
When the export is requested
Then Product OS returns a clear validation response and no malformed export is generated

Given a builder attempts an unsupported or over-broad export selection
When the export is requested
Then Product OS blocks the request with a clear explanation of the limit

Given a selected WorkItem is missing canonical sections or acceptance criteria
When the export is generated
Then the export marks the readiness gap explicitly instead of implying the WorkItem is fully execution-ready

## Operational Readiness
- Validation behavior should be logged clearly enough for support and debugging.
- Warnings and errors should be understandable to a builder using the export flow under time pressure.
- Safety rules should be documented so future builder workflows do not bypass them accidentally.

## Deliverables
- Export validation and safety rules
- Warning and error semantics for selection and readiness issues
- Tests covering empty, unsupported, and low-readiness exports
- Documentation for safe downstream AI usage

## Definition of Done
- Export safety validation is implemented and verifiable.
- Acceptance criteria pass.
- The export flow is safe enough for production-like builder usage.
