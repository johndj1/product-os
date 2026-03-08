# KPI: Reduce Time From Idea To Deployed Change

## Definition

Measure elapsed time (in days) between accepted product idea and deployed change.

## Current Example Values

- Baseline/current value: 14
- Target value: 3
- Unit: days

## Why It Matters

This KPI reflects end-to-end Product delivery effectiveness and directly indicates whether Product OS improves flow.

## Measurement Approach

- Represent KPI as a `WorkItem` with `type = kpi`.
- Store `current_value`, `target_value`, `unit`, and `last_updated_at` on that WorkItem.
- Update via `kpi_change` Signal ingestion when payload includes `kpiTitle` and `newValue`.

## Related Product OS Concepts

- WorkItem: KPI record
- Signal: `kpi_change` updates
- Relationship: links KPI to supporting delivery work
- Decision: prioritization and investment trade-offs tied to KPI movement
