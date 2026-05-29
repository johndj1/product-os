# Startup OS Merge Plan

## Purpose

This plan explains how Product OS can absorb proven repo-driven delivery and product documentation patterns from earlier source repos without overwriting the docs that already exist here.

## Merge Strategy

Use a three-lane merge:

1. Preserve current source-of-truth docs that describe implemented Product OS behavior
2. Add missing startup-operating documents in a new namespace
3. Promote reusable patterns into templates only after they are generalized

## Preserve As-Is

These should remain authoritative and should not be replaced by imported documents:

- `docs/platform/architecture/*`
- `docs/platform/decisions/*`
- `docs/platform/operations/*`
- `docs/platform/pdd/product-os.md`
- `docs/product-model/guidance/*`
- `docs/product-model/templates/*`
- `docs/product-os-grounding.md`

## Add As New Startup Sources

These documents are needed to run Product OS like a startup and are currently missing or incomplete:

- PRD with startup framing
- Ideal Customer Profile
- personas and customer journeys
- competitor analysis
- offer creation and packaging
- validation strategy
- GTM strategy
- content strategy
- sales funnel assumptions and projections
- automation setup
- delivery, engineering, and SRE operating model
- startup roadmap

## Adapt From Earlier Source Repos

The following patterns may be adapted when they are useful to Product OS, but they should not be copied literally or allowed to drag in another product's framing:

- product context document pattern
- product sources map
- feature delivery system
- decision log pattern
- task backlog lifecycle
- active-task review and close-out rules
- workflow and incident-management operating model

## Safe File Rules

- New startup-operating docs live under `docs/startup-os/`
- New reusable delivery templates should live under `docs/delivery-system/` or `docs/product-model/templates/`
- Existing files must not be overwritten automatically
- If a bootstrap process encounters an existing target file, it should create a `.new.md` sibling or mark it for manual merge

## Current Mapping

- Existing platform product definition:
  `docs/platform/pdd/product-os.md`
- Existing platform architecture:
  `docs/platform/architecture/system-overview.md`
- Existing reusable product-documentation guidance:
  `docs/product-model/guidance/how-to-document-a-product-in-product-os.md`
- New startup product and growth layer:
  `docs/startup-os/`

## Outcome

After this merge, Product OS should function as both:

- a real startup product with a full operating system around it
- the canonical source for reusable product, delivery, engineering, and operations templates for future products
