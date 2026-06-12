# ADR-004: Layer 2 Execution Engine

## Status

Proposed

## Context

Product OS Layer 1 operates as a planning and tracking system: work is defined, decomposed, prioritised, and linked via signals. Execution happens outside the system, by humans.

The product vision is an all-in-one product build system — definition → scope → features → tasks → tests → build. Realising this requires a Layer 2 execution engine that reads ready WorkItems from the product graph and executes them using AI sub-agents, feeding results back as signals.

## Decision

Add a coordinator + sub-agent execution engine following a Factory Model pattern.

### Core concepts

**ExecutionPlan** — a plan created by a coordinator agent from a set of ready WorkItems in a Product. Decomposes work into ordered waves.

**ExecutionWave** — an ordered batch within a plan. Each wave is either `parallel` (multiple sub-agents run simultaneously in separate worktrees) or `sequential` (one sub-agent handles tasks in order). Wave type is determined by dependency relationships between WorkItems.

**AgentRun** — a record of a sub-agent executing a single WorkItem. Tracks status, output summary, and timing.

### Execution flow

1. Coordinator queries `ready` WorkItems for a Product, sorted by priority score.
2. Coordinator resolves `blocks` and `depends_on` relationships to determine wave order and parallelism.
3. Coordinator creates an `ExecutionPlan` with ordered `ExecutionWave` records.
4. For each wave: create isolated Git worktree, spawn sub-agent(s) with lean context package.
5. Sub-agents write code, run tests, store output in `AgentRun.output_summary`.
6. Coordinator merges completed worktrees to main, updates WorkItem status to `done`.
7. Execution events emit signals (`agent_completed`, `test_failure`, `merge_conflict`) that feed back into Layer 1.

### New schema elements

**WorkItem types added:** `test`, `build`

**RelationshipType added:** `verified_by` (story → test)

**SignalType added:** `agent_started`, `agent_completed`, `merge_conflict`

**New models:**

```
ExecutionPlan
  id            uuid
  product_id    uuid → Product
  status        draft | running | done | failed
  created_at    timestamp
  updated_at    timestamp

ExecutionWave
  id            uuid
  plan_id       uuid → ExecutionPlan
  wave_number   int
  wave_type     parallel | sequential
  status        pending | running | done | failed
  worktree_path string?
  created_at    timestamp
  updated_at    timestamp

AgentRun
  id             uuid
  wave_id        uuid → ExecutionWave
  work_item_id   uuid → WorkItem
  status         spawned | running | done | failed
  output_summary string?
  started_at     timestamp?
  completed_at   timestamp?
  created_at     timestamp
  updated_at     timestamp
```

### Context discipline

A key architectural constraint: context must be kept lean at every level.

- **Coordinator context**: ExecutionPlan + current wave status only. Not the full WorkItem graph.
- **Sub-agent context**: assigned WorkItem + direct parents + acceptance criteria only.
- **Output**: stored in `AgentRun.output_summary`, not accumulated in the coordinator's context window.

This is not optional — token consumption spirals out of control without explicit context budgets at each agent boundary.

## Consequences

- Product OS closes the loop: work defined in Layer 1 is executed by Layer 2, and results flow back as signals.
- The system is self-hosting: Layer 2 can execute the very WorkItems that define Layer 2 itself.
- Merge conflicts and test failures surface as first-class signals, preserving the existing feedback model.
- Context discipline becomes a first-class architectural concern with explicit rules per agent role.
- Adding `test` and `build` as WorkItem types makes tests traceable in the product graph, not a side-channel.
