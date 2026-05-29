# Normalize Product OS docs and review loop

## Status
Done

## Parent feature
Product OS delivery system rollout

## Intended outcome
Make the Product OS repository readable and executable as its own delivery system by cleaning the docs structure, preserving implemented-platform truth, and adding a minimal active-task review loop.

## Persona
Product OS maintainer

## Journey
Set up and run Product OS safely as both a real product repo and the source operating system for future repos.

## Context
The repository already contains platform, startup, and delivery docs, but the top-level story still carried cross-project wording and did not yet expose an executable active-task review loop. This task normalized the Product OS framing without rewriting implementation truth.

## Scope
- clean the top-level and docs index wording so Product OS reads as the primary context
- merge existing implemented-platform docs into the new startup and delivery structure through clearer mapping and workflow docs
- add a minimal `review:active-task` script and package entry for the current repo workflow

## Constraints
- preserve current implemented behavior and existing platform source-of-truth docs
- do not seed new backlog tasks in this task

## Acceptance criteria
- [x] the top-level repo and docs indexes describe Product OS using Product OS-native framing
- [x] the delivery docs define a Product OS repo workflow that avoids cross-project branch and thread carryover
- [x] `npm run review:active-task` validates the active task shape in this repo

## Operational readiness
Workflow-only change. Failure visibility is local via script output. Recovery path is to fix the task file or workflow docs. Blast radius is low and reversible because this change is repo-local documentation and script wiring. Monitoring gap: not applicable beyond local review usage.

## Implementation notes
- keep platform docs authoritative for current implementation details
- prefer additive mapping and index cleanup over broad rewrites

## Validation
- Task type: workflow-only
- ran `npm run review:active-task`
- inspected updated docs indexes and workflow docs for Product OS-native wording and source mapping
- broader product journey regression was not required because no application behavior changed
