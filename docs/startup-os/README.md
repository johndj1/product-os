# Startup Operating System

This section turns Product OS into a startup-ready operating system, not just a product-modeling app.

It is intentionally additive to the current documentation shape:

- `docs/platform` remains the source of truth for implemented platform behavior
- `docs/product-model` remains the source of truth for reusable documentation templates
- `docs/startup-os` adds the operating model needed to run Product OS like a startup

## Scope

This layer covers:

- product strategy and product truth
- ICP, personas, and customer journeys
- competitor analysis and market positioning
- offer creation and packaging
- validation strategy and evidence loops
- go-to-market and content strategy
- sales funnel assumptions and projection model
- automation setup across product, growth, and engineering
- delivery, engineering, and SRE operating construct

## Recommended Reading Order

1. `merge-plan.md`
2. `product-sources.md`
3. `product/prd.md`
4. `product/ideal-customer-profile.md`
5. `product/personas.md`
6. `product/customer-journeys.md`
7. `growth/go-to-market-strategy.md`
8. `growth/content-strategy.md`
9. `finance/sales-funnel-and-projections.md`
10. `operations/automation-setup.md`
11. `engineering/delivery-and-reliability-system.md`

## Design Rule

When a document overlaps with an existing source:

- do not overwrite the existing source blindly
- map it explicitly
- either reference it, extend it, or create a replacement target and migrate deliberately
