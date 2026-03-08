# Product OS Documentation

This directory is the documentation system for Product OS.

## Start Here

- If you need to understand Product OS itself, start in `docs/platform`.
- If you need to document a new Product, start in `docs/product-model/templates`.
- If you want a complete reference example, start in `docs/product-examples/product-os`.

## Documentation Layers

### 1) Platform Documentation (`docs/platform`)

Describes the implemented Product OS platform:

- Product definition and intent
- Architecture and data model
- Architecture decisions (ADRs)
- Operations guidance (local development, database, health checks)

Key operations guidance:

- `docs/platform/operations/local-development.md`: local setup and baseline verification
- `docs/platform/operations/environment-strategy.md`: how to separate Product OS dev, stable personal prod, and a later shared/public direction
- `docs/platform/operations/checkatrain-onboarding-and-environment-staging.md`: practical Check-a-Train onboarding path and environment staging guidance

### 2) Product Model (`docs/product-model`)

Reusable templates and guidance for documenting any Product managed in Product OS.

- `templates/`: copy-ready templates for Product PDD, persona, customer journey, Signal, KPI, decision, and architecture documentation
- `guidance/`: principles and usage guidance

Product-model templates currently include:

- Product PDD templates
- Persona templates
- Customer journeys
- Signal templates
- KPI templates
- Decision templates

### 3) Product Examples (`docs/product-examples`)

Worked examples that apply the templates in practice.

- `product-os/`: first documented Product example

## Recommended Workflow For A New Product

1. Create Product PDD from `docs/product-model/templates/product-pdd-template.md`.
2. Add personas and journeys using the matching templates.
3. Define Signals, KPIs, and decisions.
4. Add architecture documentation.
5. Keep mappings explicit to Product, WorkItem, Relationship, Signal, KPI, and Decision.

For the first serious pilot Product onboarding, also review `docs/platform/operations/checkatrain-onboarding-and-environment-staging.md` before attempting a full migration from existing tooling.

## Suggested Reading For Personas And Journeys

- Start with `docs/product-model/guidance/how-to-use-personas-and-journeys.md` for the minimal rules.
- Then review `docs/product-examples/product-os/personas-and-journeys-thread.md` to see how the example personas and journeys connect into one operating loop.

## Documentation Rules

- Describe implemented behavior only.
- Use consistent Product OS terms.
- Keep sections structured and field-based for reuse and machine interpretation.
