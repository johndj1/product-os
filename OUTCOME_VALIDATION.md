# OUTCOME_VALIDATION.md

This file defines the standard outcome-validation prompt pattern for future coding-agent work in Product OS.

Use it before implementation begins for a `feature`, `story`, or `task`.

## Purpose

The goal is to confirm that the proposed work improves the linked customer outcome rather than adding disconnected scope.

Agents should pause when the linked outcome, journey context, or reason for improvement is missing.

## Standard Validation Pattern

Before implementing a `Feature`, `Story`, or `Task`, confirm:

- linked `Outcome`
- linked `Journey Step`
- linked `Journey`
- how the work improves the `Outcome`
- whether the work is direct user value, enabling support work, or drift
- whether implementation should proceed

## Standard Prompt Block

Use this block in future coding-agent prompts:

```text
Before implementation, complete an Outcome Validation check.

Return:
- Linked Outcome:
- Linked Journey Step:
- Linked Journey:
- Work item:
- Work type:
- How this work improves the Outcome:
- Classification: direct user value, enabling support work, or drift
- Why this work should proceed now:
- What evidence would show the Outcome improved:
- Proceed / Pause:

If the work does not clearly improve or support the linked Outcome, pause and redesign before implementation.
```

## Classification Guidance

- `direct user value`: the work changes the user experience or product behaviour in a way that directly improves the linked outcome
- `enabling support work`: the work is not directly user-visible, but it is necessary to deliver, measure, or safely operate an outcome-improving feature
- `drift`: the work adds scope, technical motion, or local optimization without a clear path to improving the linked outcome

Only proceed when the work is either direct user value or clearly justified enabling support work.

## Check-a-Train Example

Outcome:

`User understands whether their journey qualifies for Delay Repay`

Feature:

`Calculate Delay Repay eligibility`

Validation:

This Feature directly improves the Outcome by translating delay data into a clear user-facing eligibility decision.

Classification:

`direct user value`

Proceed:

`Yes`
