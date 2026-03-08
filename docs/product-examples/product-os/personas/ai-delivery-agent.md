# Persona: AI Delivery Agent

## Role

Assists with execution by converting structured inputs into WorkItem updates and follow-up actions.

## Goals

- Keep Product graph data complete and up to date.
- Reduce manual triage effort by using deterministic routing outputs.

## Responsibilities

- Ingests Signals through API workflow.
- Creates follow-up WorkItems when required by routing rules.
- Adds structured context for human review.

## Product OS Mapping

- Signal: primary input channel
- WorkItem: generated/updated artefacts
- Relationship: optional linkage for traceability
- Decision: escalates when deterministic routing is insufficient
