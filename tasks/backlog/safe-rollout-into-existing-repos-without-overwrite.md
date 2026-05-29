# Safe rollout into existing repos without overwrite

## Status
Backlog

## Assignee
codex

## Parent feature
Product OS multi-product rollout readiness

## Intended outcome
Allow a founder or engineering lead to roll Product OS delivery and startup assets into an existing repo without overwriting current source-of-truth files or silently changing repo behavior.

## Persona
Engineering lead

## Journey
Replicate the operating system across products.

## Context
Product OS already includes a bootstrap manifest and script, but the rollout promise in the roadmap requires a safer and more explicit contract for existing repos. The first rollout task should define and implement the minimum safe behavior for adding Product OS files into a repo that already has docs, workflows, and conventions.

## Scope
- define the expected bootstrap behavior when target files already exist
- tighten the bootstrap file set and report shape around non-destructive rollout
- document the operator-facing workflow for reviewing sidecars and merge output

## Constraints
- do not overwrite existing repo files automatically
- do not assume the target repo already uses Product OS task or branch conventions
- preserve current Product OS bootstrap behavior unless the task explicitly tightens it

## Acceptance criteria
- [ ] bootstrap behavior is explicit for create, skip, and sidecar outcomes
- [ ] the operator gets a usable report that makes manual merge work obvious
- [ ] the rollout docs explain how to adopt Product OS into an existing repo without hidden behavior changes

## Operational readiness
Required. Failure visibility: a bad rollout could be partially silent unless bootstrap output and docs are explicit. Recovery path: revert created files in the target repo and re-run after fixing manifest or reporting behavior. Blast radius: repo-level docs and workflow files in the target repo; changes must be reversible and non-destructive. Monitoring gap: there is no automated rollout verification yet, so the task should keep the behavior reviewable via bootstrap output.

## Implementation notes
- inspect `scripts/bootstrap/init-product-repo.mjs` and `scripts/bootstrap/bootstrap-manifest.json`
- keep `docs/startup-os/merge-plan.md` and `docs/delivery-system/github-and-environment-modules.md` aligned with the final rollout rules

## Validation
- Task type: workflow-only
- run the bootstrap command against a disposable local target repo and inspect the generated report
- inspect sidecar and skip behavior for existing files and directories
- run `npm run review:active-task`
- broader product journey regression is not required because this task changes rollout workflow rather than Product OS app behavior
