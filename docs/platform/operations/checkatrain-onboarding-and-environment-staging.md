# Check-a-Train Onboarding And Environment Staging

This guide describes the practical path for bringing Check-a-Train into Product OS at the current maturity level of the platform.

The immediate goal is not a perfect migration. The immediate goal is to prove that Product OS can manage a real Product with enough reliability to justify a later trusted environment.

## Current Recommendation

Start Check-a-Train inside Product OS dev.

Treat that first onboarding as a pilot:

- use real Check-a-Train context
- keep the initial graph small
- run real operating loops through it
- improve Product OS where friction appears
- only then decide whether to create a separate trusted personal prod environment

This keeps the work practical for a solo builder and avoids pretending that Product OS is already a stable system of record.

## The Three Environment Meanings

Product OS currently needs three clearly different meanings of environment.

### 1. Product OS Dev

Product OS dev is where Product OS itself is still being built and changed.

Use it for:

- schema and workflow changes
- view and UX iteration
- trying new Product, WorkItem, Relationship, Signal, KPI, and Decision patterns
- onboarding Check-a-Train as the first serious pilot Product
- finding missing capabilities before trusting Product OS with long-lived operating records

This is the correct starting point for Check-a-Train.

### 2. Product OS Stable Personal Prod

Stable personal prod is a separate environment that the owner trusts for running real Products day to day.

Use it for:

- real Product operations the owner does not want mixed with experimental changes
- trusted WorkItem, Decision, KPI, and Relationship records
- stable operating loops for planning, prioritisation, review, and follow-up

This is still a personal environment. It is not yet a public product for others.

### 3. Product OS Future Public Or Shared Offering

This is a later phase where Product OS could support other users managing their own Products.

That would require capabilities that should be treated as future work, including:

- authentication
- user and organisation model
- tenancy
- data isolation
- stronger operational hardening and support expectations

Do not confuse this with the immediate need for a stable personal prod environment. A trusted personal setup can exist long before Product OS is ready to be shared with other users.

## Why Check-a-Train Should Start As A Pilot

Check-a-Train should be the first serious pilot Product inside Product OS dev because it creates realistic pressure on the model without forcing a premature migration.

Pilot onboarding is the right approach because it lets you:

- validate whether Product, WorkItem, Relationship, Signal, KPI, and Decision are enough to run real work
- discover which views, constraints, and supporting pages are actually missing
- check that the graph stays understandable under real operating use
- prove the operating loop before protecting it as trusted production data

The first onboarding should not be treated as a full migration from legacy tooling. It should be treated as a controlled reconstruction of the useful current Product graph.

## Minimum Artefacts For Check-a-Train

Create the smallest set of artefacts that makes Check-a-Train operable inside Product OS dev.

### Product

Create:

- `Product: Check-a-Train`

This should give Check-a-Train a clear identity in the Product graph and a place to anchor WorkItems, KPIs, Decisions, and Pages.

### Initial KPIs

Start with 3 meaningful KPIs that reflect whether Check-a-Train is healthy and improving.

Choose KPIs that are:

- already measurable or easy to estimate consistently
- close to current product goals
- useful for prioritising work, not just reporting activity

Good categories would typically include:

- user value or usage
- delivery speed or quality
- reliability or operational health

### Initial WorkItems

Start with 5 to 8 WorkItems.

Use them to capture:

- the current goal Check-a-Train is trying to achieve
- the most important active delivery work
- one or two blockers, risks, or enabling tasks
- the shortest graph that links intent to execution

This should be enough to test prioritisation and execution without importing backlog sprawl.

### Initial Decisions

Start with 1 to 2 Decisions.

Capture decisions that already shape current work, for example:

- a product direction choice
- an architectural constraint
- a scope boundary

If a decision changes what WorkItems are valid or how the Product should evolve, it is worth recording.

### Initial Pages

Start with 2 to 3 supporting Pages.

Use Pages only where they reduce friction in operating the Product. For the first pass, that usually means:

- one Product overview page
- one current operating focus or roadmap page
- one context page for metrics, architecture, or service boundaries

Do not create a large wiki. Create only the pages needed to support the first operating loop.

## Recommended Onboarding Sequence

Use this sequence for the first Check-a-Train onboarding in Product OS dev.

1. Create `Product: Check-a-Train` in Product OS dev.
2. Add 3 meaningful KPIs tied to current product outcomes.
3. Add 5 to 8 initial WorkItems that reflect current goals and active delivery work.
4. Add 1 to 2 Decisions that explain important product or technical constraints.
5. Add 2 to 3 supporting Pages that make the Product graph easier to operate.
6. Link the artefacts so the graph shows how the current goal, work, metrics, and decisions connect.
7. Run one full end-to-end operating loop through the model:
   planning, prioritisation, execution, review, and follow-up.
8. Identify missing capabilities in Product OS:
   missing views, weak workflows, missing constraints, poor visibility, or awkward data entry.
9. Improve Product OS in dev based on those findings.
10. Only then decide whether Product OS is ready for a separate trusted personal prod environment.

The success condition for this sequence is not "everything migrated." The success condition is "Check-a-Train can be run meaningfully enough to expose what Product OS still lacks."

## Migration Philosophy

Do not migrate every existing backlog item.

Instead, reconstruct the useful Product graph.

That means:

- prioritise current goals over historical backlog completeness
- capture immediate active work rather than every old idea
- record the key Decisions that shape current delivery
- define the KPIs that matter now
- create Relationships that make the present operating model understandable

Avoid recreating Jira-style backlog sprawl inside Product OS. A large pile of stale WorkItems does not improve the graph. It usually makes prioritisation worse and hides the real operating state.

The first onboarding should answer:

- what Check-a-Train is trying to achieve now
- which WorkItems matter now
- which KPIs indicate whether progress is real
- which Decisions constrain the next set of choices

If older backlog items are still important later, they can be reintroduced deliberately.

## When Product OS Is Stable Enough For Trusted Personal Prod

Create a separate stable personal prod environment only when Product OS has earned enough trust to hold real operating records.

Practical signs include:

- the Check-a-Train graph is understandable without constant restructuring
- the core WorkItem and Relationship patterns have settled
- KPIs are being reviewed and used in real prioritisation
- Decisions are being recorded in a way that meaningfully affects work
- the current pages and views are sufficient to run the Product without workarounds every day
- schema or workflow changes are no longer frequent enough to put the operating record at risk

If the main use of Check-a-Train inside Product OS is still to discover how Product OS should work, stay in dev.

If the main use has become running real product operations with confidence, that is the point to prepare stable personal prod.

## What Stable Personal Prod Should Mean

For the current stage of Product OS, stable personal prod should stay simple.

It should mean:

- a separate environment from dev
- a more stable deployment and database
- trusted Product records for real day-to-day operation
- controlled changes rather than constant experimentation

It does not need to mean:

- multi-user platform support
- public onboarding flows
- organisation management
- complex environment promotion systems

The bar is "trusted enough for the owner to run real Products," not "ready to launch as SaaS."

## Future Shared Or Public Product Direction

Supporting other users is a later phase.

That later phase would need a proper shared-product foundation, including:

- auth
- user and organisation model
- tenancy boundaries
- data isolation
- stronger permissions, support, and operational safeguards

That work should be planned separately from Check-a-Train onboarding. It is strategically important, but it is not the immediate constraint.

Right now, the practical sequence is:

1. prove Product OS against a real pilot Product in dev
2. establish a trusted personal prod environment once the operating loop is stable
3. consider shared or public Product OS only after the personal operating model is dependable

## Lightweight Working Rule

Use this rule for now:

- onboard Check-a-Train in Product OS dev first
- keep the initial Check-a-Train graph small and useful
- use the pilot to improve Product OS itself
- create stable personal prod only after repeated successful operating loops
- treat public or shared Product OS as a later, separate phase
