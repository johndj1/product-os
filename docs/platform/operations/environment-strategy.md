# Environment Strategy

Product OS currently has three practical stages of use:

- a development environment for building Product OS itself
- a future stable personal production environment for running real Products such as Check-a-Train
- a later possible shared or public Product OS for other users

These stages should not be treated as the same thing.

## Why The Distinction Matters

Product OS is still changing at the code, schema, workflow, and UX levels. During this phase, the same environment should not carry both:

- active Product OS development risk
- trusted operating data for a real Product

Without separation, a normal Prisma change, workflow revision, or model experiment can damage the records that a real Product depends on.

This distinction should stay lightweight. The immediate need is not a complex release model. The immediate need is to keep Product OS flexible while it is being built, then introduce a trusted personal environment only when the operating loop is stable enough to deserve it.

## The Recommended Three-Stage Model

### Product OS Dev

Use Product OS dev for:

- building and changing Product OS itself
- schema evolution and workflow iteration
- realistic pilot usage with non-trusted data
- onboarding the first serious external Product
- discovering missing capabilities in the model and UI

Check-a-Train should start here.

### Product OS Stable Personal Prod

Use stable personal prod only once Product OS is trusted enough to run real Products without mixing that work with ongoing experimentation.

Use it for:

- trusted Product, WorkItem, Relationship, Signal, KPI, and Decision records
- stable day-to-day operating loops
- real product management that the owner would not want casually rewritten or broken

This is still a personal environment, not a public product.

### Product OS Future Public Or Shared Offering

This is a later phase where other users could adopt Product OS for their own Products.

That phase would require additional capabilities such as:

- auth
- user and organisation model
- tenancy
- data isolation

This later direction should not be confused with the near-term need for a trusted personal environment.

## Code Version Versus Data Trust

Code environments answer:
"Which version of Product OS am I running?"

Data environments answer:
"How trusted is the Product data in this instance?"

The practical trust states are:

- experimental
- pilot
- trusted

In the current repo stage, the important boundary is the trust level of the Product data, not whether the deployment looks formally production-like.

## Check-a-Train Path

The practical Check-a-Train path is:

1. onboard Check-a-Train in Product OS dev
2. treat that onboarding as a pilot, not a full migration
3. run end-to-end operating loops through the model
4. fix Product OS gaps revealed by real use
5. only then prepare a separate trusted personal prod environment

For the detailed onboarding sequence and migration philosophy, see `docs/platform/operations/checkatrain-onboarding-and-environment-staging.md`.

## Lightweight Working Rule

Use this rule for now:

- build and experiment in Product OS dev
- onboard Check-a-Train in Product OS dev as the first serious pilot Product
- create stable personal prod only after Product OS proves dependable in repeated real operating loops
- treat shared or public Product OS as a later phase
