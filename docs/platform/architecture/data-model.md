# Data Model

## Primary Models

- `Product`: context root for all Product data.
- `WorkItem`: main execution and planning node.
- `Relationship`: directional edge between two WorkItems in the same Product.
- `EntityLink`: additive directional edge between Product entities in the same Product context.
- `Signal`: operational/feedback input, optionally linked to a WorkItem.
- `Page`, `Comment`, `User`: supporting collaboration models.

## Product Graph Mapping

- Product contains many WorkItems, Relationships, and Signals.
- Product contains many EntityLinks.
- WorkItems form a hierarchy via `parent_id`.
- WorkItems also form a graph via Relationship edges.
- Product, WorkItem, Signal, and Page can form a cross-entity graph via EntityLinks.
- KPI is represented as WorkItems where `type = kpi`.
- Decision is represented as WorkItems where `type = decision`.

## WorkItem Types

`outcome`, `kpi`, `capability`, `feature`, `story`, `task`, `bug`, `research`, `incident`, `decision`

## WorkItem Statuses

`new`, `ready`, `in_progress`, `blocked`, `done`, `cancelled`

## Relationship Types

`supports`, `relates_to`, `blocks`, `depends_on`, `informs`, `impacts`

## Entity Types

`product`, `work_item`, `signal`, `page`

## EntityLink Types

`measures`, `impacts`, `triggered_by`, `informs`, `supports`, `documents`, `references`, `relates_to`, `creates`

## Graph Semantics

- Hierarchy uses `WorkItem.parent_id` and represents decomposition through the golden thread.
- `Relationship` represents WorkItem-to-WorkItem graph edges and stays focused on execution and traceability between WorkItems.
- `EntityLink` represents cross-entity graph edges without requiring bespoke foreign keys for every pair of entity types.
- `EntityLink` is additive in v1 and does not replace hierarchy or existing WorkItem relationship logic.

## Signal Types

`kpi_change`, `customer_feedback`, `incident_alert`, `delivery_risk`, `test_failure`, `deployment_event`, `usage_pattern`, `anomaly`, `dependency_change`, `external_change`
