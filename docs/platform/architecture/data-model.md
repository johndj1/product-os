# Data Model

## Primary Models

- `Product`: context root for all Product data.
- `WorkItem`: main execution and planning node.
- `Relationship`: directional edge between two WorkItems in the same Product.
- `Signal`: operational/feedback input, optionally linked to a WorkItem.
- `Page`, `Comment`, `User`: supporting collaboration models.

## Product Graph Mapping

- Product contains many WorkItems, Relationships, and Signals.
- WorkItems form a hierarchy via `parent_id`.
- WorkItems also form a graph via Relationship edges.
- KPI is represented as WorkItems where `type = kpi`.
- Decision is represented as WorkItems where `type = decision`.

## WorkItem Types

`outcome`, `kpi`, `capability`, `feature`, `story`, `task`, `bug`, `research`, `incident`, `decision`

## WorkItem Statuses

`new`, `ready`, `in_progress`, `blocked`, `done`, `cancelled`

## Relationship Types

`supports`, `relates_to`, `blocks`, `depends_on`, `informs`, `impacts`

## Signal Types

`kpi_change`, `customer_feedback`, `incident_alert`, `delivery_risk`, `test_failure`, `deployment_event`, `usage_pattern`, `anomaly`, `dependency_change`, `external_change`
