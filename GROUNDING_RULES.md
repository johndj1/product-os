# GROUNDING_RULES.md

This is the canonical grounding rules file for coding agents working in Product OS.

Use it as the single reusable source for repository grounding in future agent prompts.

## Core Rules

- Inspect repository files before making changes.
- Product OS is outcome-driven.
- Use the mandatory hierarchy: `Product -> Persona -> Journey -> Journey Step -> Outcome -> Feature -> Story -> Task`.
- All work must trace to an `Outcome`.
- Validate proposed work against personas and journeys, not just implementation detail.
- Prefer small, explicit changes.
- Preserve behaviour unless intentionally changing it.
- Keep seed logic idempotent.
- Avoid duplicate records on reseed.
- Avoid unnecessary schema changes.
- Avoid auth, queues, background jobs, or infrastructure complexity unless explicitly requested.
- Recommend the most relevant verification steps before finishing.
- Pause and redesign when hierarchy or outcome linkage is missing.

## Product OS Interpretation

Product OS is not a generic backlog tool.

Delivery work exists to improve a real customer outcome derived from a journey step.

That means agents should reason in this order:

1. Product
2. Persona
3. Journey
4. Journey Step
5. Outcome
6. Feature
7. Story
8. Task

If the requested work cannot be explained in that chain, it likely needs better product framing before implementation.

## Mandatory Prompt References

Future grounding prompts should reference:

- `AGENTS.md`
- `PROJECT_STRUCTURE.md`
- `WORKFLOW.md`
- `GROUNDING_RULES.md`

Use these four files as the standard prompt foundation before inspecting implementation-specific files.

## Prompt Expectations

Grounding prompts should instruct the agent to:

- inspect the existing repository files before editing
- identify the linked Product, Persona, Journey, Journey Step, and Outcome
- explain where the work sits in the mandatory hierarchy
- preserve existing behaviour unless the task explicitly requires change
- reuse existing rules, route flows, and schema patterns before adding new abstractions
- stop when the work has no defensible outcome linkage

## Verification Expectations

Before finishing, recommend or run the smallest relevant checks for the change, such as:

- `npm run prisma:generate`
- `npm run db:push`
- `npm run db:seed`
- `npm run build`
- `npm run lint`

If checks are not run, say so explicitly.
