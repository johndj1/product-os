# Environment Strategy

Product OS currently has two realities at once:

- It is a Product still being actively built.
- It is intended to become a stable operating system for managing real Products.

That means Product OS needs a clear distinction between:

- Product OS development work
- Product OS operational use
- experimental Product data
- trusted Product operating records

This guidance keeps that distinction lightweight and practical for a solo builder or small product team.

## Why Separate Dev And Prod

Product OS is still changing at the code, schema, workflow, and UX levels. During this phase, the same environment should not carry both:

- active Product OS development risk
- trusted operating data for real Products

Without separation, a normal change such as a Prisma schema update, a new Signal routing rule, or a revised WorkItem workflow could damage live product records or distort operational history.

Separate environments make it possible to:

- develop Product OS quickly without treating every change as production-safe
- test new WorkItem, Relationship, Signal, KPI, and Decision flows on realistic data
- protect trusted product operating records from accidental corruption
- promote Product OS into a stable operating tool only when it has earned that role

## Code Environments Versus Product-Data Environments

These are related, but they are not the same thing.

### Code Environments

Code environments answer: "Which version of Product OS am I running?"

Examples in the current repo stage:

- local development environment on a developer machine
- a future stable deployed environment, once it exists

### Product-Data Environments

Product-data environments answer: "How trusted is the Product data inside this Product OS instance?"

Typical states:

- experimental data used to shape the model and workflows
- pilot data used with realistic operating behavior but still under observation
- trusted data used as the operational record for real Product management

One code environment often maps to one product-data environment, but the important thing is the trust boundary around the data, not just the deployment shape.

## Recommended Model

For the current maturity level of this repository, the recommended model is:

### Product OS Dev

Use Product OS dev for:

- local or development deployments of Product OS
- active Product OS build and workflow changes
- schema evolution and experimental features
- experimental Products and early Product graphs
- test Signals and realistic-but-non-trusted operating data
- pilot usage for a real Product that is still validating the model

In practice, Product OS dev is where Product OS itself is improved and where candidate Products are first onboarded.

### Product OS Prod

Use Product OS prod only after a stable deployment exists and the team is ready to trust it as an operating system.

Product OS prod should hold:

- stable Product OS code and schema
- trusted Product data
- real product operating records
- real Decisions, KPIs, Signals, Relationships, and WorkItems used to run Products day to day

Product OS prod is not required yet. It should be introduced later, when the operating model is stable enough that the data needs protection more than the code needs freedom.

## What Belongs In Product OS Dev

Product OS dev is the right place for:

- building and changing Product OS itself
- validating new workflows
- testing Signal ingestion and routing behavior
- refining WorkItem hierarchy and Relationship usage
- trialing KPI and Decision patterns
- onboarding the first external Product in a controlled way

This is also the right place to find missing capabilities before any trusted live operating model is established.

## What Belongs In Product OS Prod

Once it exists, Product OS prod should be reserved for:

- trusted Products being actively managed
- operational Decisions with real consequences
- KPI histories that need continuity
- Signals that reflect real product conditions
- WorkItem and Relationship graphs that are treated as the current source of operational truth

If the team would be uncomfortable losing, rewriting, or contaminating the data, it belongs in Product OS prod, not Product OS dev.

## Check-a-Train Adoption Path

Check-a-Train should start inside Product OS dev, not a production environment.

### Why Check-a-Train Starts As A Pilot

Product OS is still under construction. Check-a-Train is valuable because it can provide realistic usage, but that value comes from helping validate Product OS before any live trusted operating setup exists.

Treating Check-a-Train as a pilot Product inside Product OS dev allows the team to:

- model real work without pretending the operating system is already stable
- exercise the graph using realistic WorkItems and Relationships
- validate how Signals, KPIs, and Decisions behave in practice
- expose gaps in Product OS before trusted usage begins

### Recommended Pilot Steps

1. Create `Product: Check-a-Train` in Product OS dev first.
2. Model a small initial Product graph rather than the full Product at once.
3. Add a realistic but limited set of WorkItems, Relationships, Signals, KPIs, and Decisions.
4. Run real planning and review workflows through that graph.
5. Note where Product OS is missing views, constraints, automations, or safety checks.
6. Improve Product OS in dev based on those findings.
7. Introduce a stable production environment only after the workflow is dependable enough for trusted use.

### Suggested Initial Scope For Check-a-Train

Keep the first pilot graph small:

- 1 Product
- a few top-level WorkItems
- a small golden thread from outcome to delivery work
- 1 to 3 KPIs
- a handful of realistic Signals
- a small number of Decisions that affect delivery or product direction

The goal is not full migration. The goal is proving that Product OS can manage real operating behavior without unnecessary friction.

## Moving From Pilot To Trusted Use

A Product should move from pilot use in Product OS dev to live trusted use in Product OS prod only when the operating model is stable enough to rely on.

Practical signs that a Product is ready:

- the core Product graph is understandable and maintained regularly
- WorkItem and Relationship patterns are no longer changing every few days
- KPI tracking is clear enough to inform real decisions
- Signal handling is predictable and does not create noise or accidental follow-up work
- the team trusts the current workflows for planning, prioritisation, and record-keeping
- schema and app changes can be introduced without fear of breaking operating data

If the main purpose is still learning how Product OS should work, the Product is still in pilot use.

## Risks And Guardrails

Keep the guardrails simple and concrete.

### Risk: Schema Changes Break Live Usage

While Product OS is evolving, database changes can invalidate existing records or change behavior unexpectedly.

Guardrail:

- keep dev and prod in separate Supabase projects or separate databases
- test schema changes in dev first
- avoid treating dev data as a trusted long-term system of record

### Risk: Test And Trusted Data Get Mixed

If test Signals or experimental WorkItems sit alongside real operating data, the Product graph becomes unreliable.

Guardrail:

- keep experimental and trusted data in separate environments
- use Product OS dev for test Signals, model changes, and exploratory workflows
- reserve Product OS prod for trusted operating records only

### Risk: Unstable Workflows Drive Real Decisions

Early workflow designs often change once used with real Products.

Guardrail:

- use pilot Products in dev to validate the workflow first
- only rely on Product OS prod for operational decisions once the workflow has settled

### Risk: Dogfooding Hides Environment Boundaries

Because Product OS is also the first example Product, it is easy to blur the line between building the platform and operating a Product through it.

Guardrail:

- explicitly separate "Product OS as the Product under construction" from "Product OS as the operating system"
- document whether a given Product graph is experimental, pilot, or trusted

## Lightweight Working Rule

Use this simple rule until a stable production deployment exists:

- build and experiment in Product OS dev
- onboard Check-a-Train in Product OS dev as a pilot Product
- treat Product OS prod as a later step for trusted operational use, not as something that already exists today

That keeps Product OS flexible while it is still being shaped, without pretending that live operational trust has already been earned.
