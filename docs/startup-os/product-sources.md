# Startup OS Product Sources

## Purpose

This file maps the canonical source documents for Product OS as a startup product.

## Canonical Sources

- Startup merge and documentation rules:
  `docs/startup-os/merge-plan.md`
- Product definition and product truth:
  `docs/startup-os/product/prd.md`
- Ideal customer profile:
  `docs/startup-os/product/ideal-customer-profile.md`
- personas:
  `docs/startup-os/product/personas.md`
- customer journeys:
  `docs/startup-os/product/customer-journeys.md`
- competitor and market framing:
  `docs/startup-os/product/competitor-analysis.md`
- offer definition:
  `docs/startup-os/product/offer-creation.md`
- validation plan:
  `docs/startup-os/product/validation-strategy.md`
- GTM and content:
  `docs/startup-os/growth/`
- financial planning assumptions:
  `docs/startup-os/finance/`
- automation, delivery, engineering, and SRE:
  `docs/startup-os/operations/` and `docs/startup-os/engineering/`
- startup roadmap:
  `docs/startup-os/roadmap.md`

## Existing Sources That Still Matter

These remain authoritative for current implemented behavior and should be read alongside the startup layer:

- `docs/platform/pdd/product-os.md`
- `docs/platform/architecture/system-overview.md`
- `docs/platform/decisions/`
- `docs/platform/operations/`
- `docs/product-os-grounding.md`

## Interpretation Order

1. current implemented platform behavior in `docs/platform/`
2. startup strategy and operating model in `docs/startup-os/`
3. reusable templates and guidance in `docs/product-model/`

## Rule

If two docs overlap, do not silently choose one. Either:

- treat one as implementation truth and the other as planning truth
- update the merge plan
- or consolidate deliberately in a later pass
