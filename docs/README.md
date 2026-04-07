# Product OS Documentation

This directory is the documentation system for Product OS.

## Start Here

- If you need to understand Product OS itself, start in `docs/platform`.
- If you need the startup operating model for Product OS as a company-building product, start in `docs/startup-os`.
- If you need the reusable delivery and engineering operating model, start in `docs/delivery-system`.
- If you need to document a new Product, start in `docs/product-model/templates`.
- If you want a complete reference example, start in `docs/product-examples/product-os`.

## Documentation Layers

### 1) Platform Documentation (`docs/platform`)

Describes the implemented Product OS platform:

- Product definition and intent
- Architecture and data model
- Architecture decisions (ADRs)
- Operations guidance (local development, database, health checks)

### 2) Product Model (`docs/product-model`)

Reusable templates and guidance for documenting any Product managed in Product OS.

- `templates/`: copy-ready templates for PDD, persona, journey, KPI, decision, architecture
- `guidance/`: principles and usage guidance

### 3) Product Examples (`docs/product-examples`)

Worked examples that apply the templates in practice.

- `product-os/`: first documented Product example

### 4) Startup Operating System (`docs/startup-os`)

Additive company-building documentation for Product OS itself:

- product strategy and product documentation
- ICP, personas, journeys, and offer design
- validation, GTM, content, and sales planning
- automation, delivery, engineering, and SRE operating model
- non-destructive merge guidance from the current docs shape

### 5) Delivery System (`docs/delivery-system`)

Reusable delivery and engineering workflow patterns:

- task lifecycle and close-out rules
- AI grounding prompt patterns
- GitHub and environment module guidance
- task templates for rollout into future products

## Recommended Workflow For A New Product

1. Create Product PDD from `docs/product-model/templates/product-pdd-template.md`.
2. Add personas and journeys using the matching templates.
3. Define KPIs and decisions.
4. Add architecture documentation.
5. Keep mappings explicit to Product, WorkItem, Relationship, Signal, KPI, and Decision.

## Documentation Rules

- Describe implemented behavior only.
- Use consistent Product OS terms.
- Keep sections structured and field-based for reuse and machine interpretation.
- Prefer additive changes over replacing existing source-of-truth docs when evolving the documentation system.
