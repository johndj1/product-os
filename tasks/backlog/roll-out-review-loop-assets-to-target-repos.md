# Roll out review-loop assets to target repos

## Status
Backlog

## Assignee
codex

## Parent feature
Product OS multi-product rollout readiness

## Intended outcome
Ensure adopted repos receive the minimum task and review-loop assets needed for AI-assisted delivery to be executable, not just documented.

## Persona
AI Delivery Agent

## Journey
Run delivery without losing commercial context.

## Context
Product OS now has an active-task review loop in this repo, but future rollouts will still be incomplete if target repos only receive docs and templates without the executable checks that make the workflow reliable for humans and agents.

## Scope
- decide which review-loop assets are required for rollout into existing repos
- add the minimum missing assets to the bootstrap manifest
- document any manual integration step needed for target `package.json` or equivalent script entry points

## Constraints
- keep the rollout lightweight and compatible with repos that may not use the same stack
- avoid assuming every target repo is Node-first unless the task explicitly adds alternatives

## Acceptance criteria
- [ ] the required review-loop assets for adopted repos are explicitly defined
- [ ] the bootstrap manifest includes the minimal files needed for that loop where safe
- [ ] the docs explain what remains manual when a target repo cannot consume the default script wiring directly

## Operational readiness
Required. Failure visibility: rollout can look successful while still leaving agents without executable review checks. Recovery path: add the missing assets and rerun bootstrap into a disposable target repo. Blast radius: limited to repo workflow files and documentation in target repos. Monitoring gap: no production monitoring is needed, but the rollout docs should make incomplete adoption obvious.

## Implementation notes
- inspect `package.json`, `scripts/review-active-task.mjs`, and `tasks/templates/*`
- keep this task separate from broader CI or deployment module rollout

## Validation
- Task type: workflow-only
- inspect bootstrap manifest coverage for review-loop assets
- test the documented manual integration path in a disposable target repo shape
- run `npm run review:active-task` when this task becomes active
- broader product journey regression is not required because this task changes rollout workflow only
