# Story Template

## Title
Short, implementable Story title that describes one reviewable slice of delivery.

## Linked Outcome
State the customer Outcome this Story supports, plus the Journey Step when known.

## Description
Summarise the change in practical delivery terms.

## Context / Background
Explain the relevant product, journey, feature, system, or operational context needed to implement the Story safely.

## Problem / Need
State the concrete problem to solve or the need this Story addresses.

## Scope of Work
- The exact behaviour, integration, UI, data, observability, or reliability work in scope
- Clear boundaries so the Story stays reviewable and handoff-ready

## Acceptance Criteria (Gherkin)
Use `Given / When / Then` scenarios that cover the core user or system behaviour plus the main non-happy-path condition.

## Operational Readiness
- Logging, monitoring, alerting, fallback, support, or rollout concerns
- Anything needed so the Story is valid in a production-like environment

## Deliverables
- Code, tests, fixtures, documentation, instrumentation, or runbook changes expected from the Story

## Definition of Done
- Story scope is implemented and verifiable
- Acceptance criteria pass
- Operational readiness and handoff quality are good enough for the next delivery step
