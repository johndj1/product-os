# Journey: Create A New Product

## Metadata

- Journey name: Create A New Product
- Product: Product OS
- Journey owner: Product OS team
- Last updated: 2026-03-08

## Actor

Full-Stack Product Owner

## Trigger

A new Product needs a workspace with enough structure to support planning, prioritization, and KPI tracking from day one.

## Steps

1. Create the Product record with a clear name, description, and definition of done.
2. Add the first outcome-level WorkItem so the Product has a visible strategic anchor.
3. Add a KPI WorkItem with current value, target value, and unit so outcome progress can be inspected in the overview.
4. Add the first capability, feature, story, or task WorkItems using allowed hierarchy rules rather than a flat list.
5. Add Relationships where they clarify why work exists beyond the parent-child hierarchy.
6. Open the Product overview and Work views to confirm the Product, KPI summary, and WorkItem tree render as expected.
7. Adjust titles or structure if the graph already feels confusing before more work is added.

## Pain Points

- A Product without an outcome or KPI quickly turns into a delivery list with weak strategic context.
- Poor initial naming makes the WorkItem tree harder to read and maintain.
- Missing Relationships early on can make later prioritization feel arbitrary.

## Opportunities

- Use the product-model templates to establish a consistent starting shape.
- Add only enough structure to make the Product graph legible, then evolve it through real work.
- Treat the first KPI as a forcing function for outcome clarity rather than an afterthought.

## Signals

- Signal source: Early operator feedback during Product setup
- Signal type: Informal setup feedback and validation outcomes
- Signal payload notes: Usually qualitative observations about missing context, naming, or graph shape
- Expected routing behavior: Signals from setup should inform follow-up WorkItems if onboarding friction or structural gaps become repeatable

## Desired Outcome

The Product has a usable initial graph with a visible outcome, at least one KPI, a small set of connected WorkItems, and enough clarity that future Signals and prioritization decisions have somewhere sensible to attach.

## Success Signals

- The Product overview shows meaningful description, definition of done, and KPI context.
- The Work view renders a clear initial hierarchy rather than an unstructured backlog.
- Early follow-up work can be linked to existing Product context instead of starting from scratch.

## Product OS Model Mapping

- Product: newly created operating boundary
- WorkItems created or updated: outcome, KPI, capability, feature, story, task as needed
- Relationships created or used: manual links that clarify support, impact, or related context
- KPI influenced: initial KPI baseline and target for the new Product
- Decision references: optional early Decision if a structural choice needs to be recorded
