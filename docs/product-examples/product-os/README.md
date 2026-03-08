# Product OS Worked Example

This folder documents Product OS as a Product using the reusable templates.

Product OS plays two roles in this repository:

- it is the platform under active construction
- it is also the first dogfooded example Product documented inside that platform model

That means this example should be read as both:

- a worked Product definition for Product OS itself
- a reference for how a real Product can be expressed using Product, WorkItem, Relationship, Signal, KPI, and Decision

## Contents

- `pdd/`: Product definition
- `personas/`: primary and supporting personas
- `journeys/`: realistic usage journeys
- `journeys/execute-work-item-end-to-end.md`: shows how prioritised work is executed, validated, completed, and fed back into Product OS
- `journeys/respond-to-kpi-movement-and-create-follow-up-work.md`: shows how KPI movement is interpreted, converted into follow-up WorkItems or Decisions, and fed back into prioritisation
- `personas-and-journeys-thread.md`: connects the persona set and journey set into one operating loop
- `kpis/`: KPI definitions
- `decisions/`: key product-level decisions

## Primary Persona

Full-Stack Product Owner

## Example Goal

Show how Product OS concepts (WorkItem, Relationship, Signal, KPI, Decision) can be documented for a real Product that is already implemented, while also reflecting that Product OS is still being actively developed as a platform.

## How This Example Relates To Check-a-Train Onboarding

This Product OS example is useful as a documentation and modelling reference, but it should not be mistaken for proof that Product OS is already ready for trusted production use.

When onboarding Check-a-Train:

- use this example to understand the shape of a Product expressed in Product OS terms
- start Check-a-Train in Product OS dev as a pilot Product
- keep the first graph intentionally small and operational
- use the pilot to discover what Product OS still lacks before creating a stable personal prod environment

For the practical staging guidance, see `docs/platform/operations/checkatrain-onboarding-and-environment-staging.md`.

## How To Use The Personas And Journeys

Use the persona files to understand who operates Product OS, what evidence they respond to, and which Product OS objects they are responsible for keeping healthy. Use the journey files as realistic reference flows when designing new features, prompts, automations, or documentation updates, and keep proposed changes anchored to the implemented Product, WorkItem, Relationship, Signal, KPI, and Decision model rather than generic backlog tooling.
