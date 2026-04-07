# Feature Delivery System

## Goal

Turn startup and product intent into a repeatable AI-assisted delivery loop:

ICP -> Persona -> Journey -> Outcome -> Offer / Feature -> Task -> Code -> Review -> Commit

Primary grounding lives in:

- `docs/product-os-grounding.md`
- `docs/startup-os/product-sources.md`

## Rule 1: Work is outcome-led

Every feature or task should state:

- who it is for
- what journey it supports
- what outcome it creates
- what is in scope now
- what is explicitly out of scope

## Rule 2: Tasks are implementation-sized

A task should be small enough for one focused coding pass.

A task should not mix:

- product discovery
- major architecture redesign
- multiple unrelated changes

## Rule 3: Task files are the contract

A task file should be sufficient for an implementation agent to:

- understand the desired change
- inspect the right repo areas
- make the change safely
- validate success

## Standard Task Anatomy

Each task should include:

- Title
- Parent feature
- Intended outcome
- Persona
- Journey
- Context
- Scope
- Constraints
- Acceptance criteria
- Operational readiness when relevant
- Implementation notes
- Validation

### Operational Readiness Section

Required when the task touches:

- deployment or environments
- DB schema or data
- auth or security logic
- background jobs, cron, or automation
- GitHub Actions or workflow automation
- monitoring, alerting, or incident response
- anything with external side effects

Answer these four questions:

1. Failure visibility: if this fails in production, will it alert or be silent?
2. Recovery path: what is the manual or automated recovery action?
3. Blast radius: is the change reversible and what is the worst-case scope?
4. Monitoring gap: does this introduce a new thing that should be monitored?

For purely UI, doc, or deterministic logic tasks, include:

`Operational readiness: not applicable — no pipeline, DB, workflow, or external side effects.`

## Standard Validation Shape By Task Type

### Product or customer behavior change

Use when the task changes product behavior, user journeys, AI-visible outputs, workflow behavior experienced by users, or critical business logic.

Validation should normally include:

- the task-specific command or inspection that proves the changed behavior
- the closest deterministic regression or smoke path that covers the affected journey
- `npm run review:active-task` when that script exists

### Workflow-only change

Use when the task changes repo workflow, review, task-runner behavior, deployment logic, or automation without changing user-facing product behavior.

Validation should normally include:

- the script or workflow command that was changed
- one direct inspection showing the updated behavior or output
- `npm run review:active-task` when that script exists

State explicitly when broader journey regressions are not required.

### Doc-only change

Use when the task changes documentation only and does not change scripts, application behavior, or workflow behavior.

Validation should normally include:

- inspection of the updated docs
- inspection of at least one concrete example against the new wording when process guidance changes
- `npm run review:active-task` when that script exists

State explicitly when regressions are not required.

## Backlog Flow

Use folders like this:

- `tasks/backlog/` for queued work
- `tasks/active/` for work in progress
- `tasks/done/` for completed work

Suggested flow:

1. create a task markdown file
2. move one task into `tasks/active/`
3. implement from that task
4. review diff and validation
5. commit and move the task to `tasks/done/`

Only one active task should normally exist at a time unless a human explicitly wants parallel work.

## AI Generation Rules

When generating tasks from startup or product docs, always:

1. map back to ICP, persona, and journey
2. keep the slice thin
3. avoid bundling multiple features together
4. include testable acceptance criteria
5. include assumptions explicitly
6. preserve current scope boundaries
7. keep wording practical enough for safe execution
8. prefer low-blast-radius changes over broad refactors

## Commit Discipline

Recommended pattern:

- one task
- one branch
- one commit or a very small set of commits

Avoid mixed-purpose commits.

## Review Discipline

Before a task is considered done, verify:

- it satisfies the acceptance criteria
- it does not expand scope accidentally
- it preserves product and startup framing
- it remains understandable to a future agent without hidden context
