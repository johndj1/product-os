# Rewrite PRD for repo-native Product OS

## Status
Done

## Parent feature
Product OS product definition refinement

## Intended outcome
Reframe the Product OS PRD around a repo-native operating-system model in which product truth lives in docs, execution lives in markdown task files, and reusable build/export capabilities are defined through `product-os-core`.

## Persona
Founder-operator

## Journey
Define a new product.

## Context
Recent use of Codex and Claude Code clarified that Product OS should not primarily behave like a machine-driven Jira replacement with UI-owned work items. The stronger model is a repo-native operating system where AI and product owners define product truth in docs, agents derive thin backlog tasks from that truth, and the same operating system can scaffold delivery and engineering foundations for live products and future rollouts.

## Scope
- rewrite `docs/startup-os/product/prd.md` to reflect the repo-native markdown backlog model
- make the relationship between Product OS and `product-os-core` explicit
- define a practical MVP and iteration model for proving changes in Product OS before export to other repos

## Constraints
- keep the PRD grounded in existing Product OS startup docs rather than importing external product framing
- do not turn this task into implementation of bootstrap, CI, or environment changes

## Acceptance criteria
- [x] the PRD clearly states that product docs and markdown tasks are the canonical execution model
- [x] the PRD explains `product-os-core` as the reusable delivery and engineering layer beneath Product OS
- [x] the PRD defines an MVP and a proof-before-export iteration model that can support future SaaS packaging without making SaaS the current source of truth

## Operational readiness
Doc-only change. Operational readiness: not applicable — no pipeline, DB, workflow, or external side effects.

## Implementation notes
- kept `docs/startup-os/product/offer-creation.md` and `docs/startup-os/product/validation-strategy.md` aligned conceptually without broadening the edit scope
- preserved the distinction between implementation truth in `docs/platform/` and startup/product truth in `docs/startup-os/`

## Validation
- Task type: doc-only
- inspected the updated PRD against the user’s stated product direction
- inspected related startup source docs for consistency after the rewrite
- ran `npm run review:active-task` while this task was active
- broader regression was not required because this task changed product definition docs only
