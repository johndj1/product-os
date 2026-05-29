# Product OS Repo Workflow

## Purpose

This document defines the minimum Product OS-native repo workflow for working in this repository without carrying over another product's branch history, prompts, or delivery assumptions.

## First Checks In A New Thread

Before planning or coding:

1. confirm the current working directory is the Product OS repository
2. review the current branch and repo status
3. read `AGENTS.md`, `docs/product-os-grounding.md`, `docs/startup-os/product-sources.md`, and `docs/delivery-system/feature-delivery-system.md`
4. read the active task file in `tasks/active/` when one exists

## Branch Rule

- Branch names for Product OS work should describe a Product OS outcome, workflow, or repo change.
- If the current branch name carries another product's feature or incident context, create a new Product OS-native branch from the current HEAD before continuing broader Product OS work.
- Do not rewrite git history as part of routine cleanup. Normalize forward with a new branch and task.

## Task Loop

Default loop:

1. create or move one task into `tasks/active/`
2. run `npm run review:active-task`
3. implement the smallest safe change for that task
4. run the task's named validation
5. summarize the outcome and move the task to `tasks/done/` when complete, or explicitly propose that move

## Active Task Review Contract

`npm run review:active-task` should be run before or during implementation to verify:

- exactly one active task file exists
- the active task includes the standard task sections
- the repo has enough written context to execute the task safely

## Rollout Review-Loop Assets

Adopted repos need these minimum assets before the Product OS task loop is executable:

- `tasks/templates/task-template.md`
- `tasks/templates/codex-task-prompt-template.md`
- `tasks/backlog/`, `tasks/active/`, and `tasks/done/`
- `scripts/review-active-task.mjs`

The bootstrap manifest may copy these files and directories, but it does not edit a target repo's package or build configuration. For Node-capable repos, add this script entry manually:

```json
"review:active-task": "node scripts/review-active-task.mjs"
```

For repos that are not Node-first, either run `node scripts/review-active-task.mjs` directly when Node is available, or wire the equivalent task-runner command used by that repo. Adoption is incomplete until humans and agents have a documented command that executes the active-task review.

## Merge Rule

- Preserve `docs/platform/` as implementation truth.
- Use `docs/startup-os/` for Product OS startup truth and operating context.
- Use `docs/delivery-system/` for repo workflow and exportable delivery patterns.
- When earlier material must be retained for implemented examples, keep it in the authoritative implementation doc instead of surfacing it as Product OS startup framing.

## Safety Rule

- Do not import architecture constraints, product assumptions, or user framing from another repo unless Product OS docs explicitly adopt them.
- Prefer additive mapping and sidecar docs over replacing an existing source-of-truth file.
