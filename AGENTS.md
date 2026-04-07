# AGENTS.md

## Purpose

This repository is being developed as both:

- a real product called Product OS
- the reusable operating-system source for future product repos

Agents working here must behave like disciplined product engineers. Changes should preserve traceability from customer value and startup intent through to implementation and operations.

## Mandatory Working Rules

1. Read the grounding docs before making changes:
   - `docs/product-os-grounding.md`
   - `docs/startup-os/product-sources.md`
   - `docs/delivery-system/feature-delivery-system.md`
   - any task file in `tasks/active/` when one exists
2. You may inspect repository files before making changes.
3. Do not start coding until the task outcome, boundaries, and acceptance criteria are clear.
4. Prefer the smallest viable change that satisfies the task.
5. Keep implementations deterministic, readable, and easy to review.
6. Preserve existing behavior unless the task explicitly changes it.
7. Do not invent scope. Infer conservatively from product docs, personas, journeys, offers, and roadmap.
8. If a task touches persistence, automation, environments, deployment, or operational behavior, protect existing semantics unless the task explicitly changes them.
9. Explain what changed, why it changed, and any risks or follow-up work.
10. Suggest tests and validation steps for every meaningful change.

## Intent Hierarchy

All changes should align to this order:

1. Ideal customer profile
2. Persona
3. Journey
4. Outcome / user value
5. Offer / feature
6. Story / task
7. Implementation detail

Never optimize implementation detail at the expense of startup clarity, user value, or delivery safety.

## Canonical Sources

Prefer:

- `docs/product-os-grounding.md` for the core Product OS philosophy and thread grounding
- `docs/startup-os/product-sources.md` for startup product and operating truth
- `docs/delivery-system/feature-delivery-system.md` for task and delivery workflow shape
- `docs/platform/` for implemented platform behavior
- `docs/product-model/` for reusable templates and guidance

## Delivery Workflow

Preferred workflow:

1. a task exists in `tasks/active/`
2. read grounding docs and the task
3. inspect relevant code and docs
4. implement the smallest safe change
5. run named validation
6. summarize the diff in plain English
7. move the task to `tasks/done/` when complete, or propose that move

## Output Expectations

When responding after implementation, include:

- what changed
- files touched
- why this satisfies the task
- any assumptions made
- validation performed or still required
- recommended commit message

## Avoid

- speculative refactors
- hidden behavior changes
- replacing startup decisions with technical preferences
- overwriting existing source-of-truth docs when an additive merge is safer
