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
  model_used     string?
  input_tokens   int?
  output_tokens  int?
  cost_usd       float?
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

### FinOps

Token costs are a first-class concern, not an afterthought. Three levers:

**1. Cost observability** — `AgentRun` records `model_used`, `input_tokens`, `output_tokens`, and `cost_usd` on every run. The execution plan UI surfaces per-run and per-plan totals. A `cost_overrun` signal is emitted when a run exceeds its budget threshold.

**2. Model tier strategy** — not every task needs the most capable model. The coordinator (high-level decomposition, conflict resolution) uses a strong reasoning model. Sub-agents executing a scoped story with clear acceptance criteria use a lighter model (15-20x cheaper). Model assignment is determined by WorkItem type and complexity, not hardcoded.

**3. Prompt caching** — stable context fields (acceptance criteria, parent feature description, product Definition of Done) are structured to be cache-eligible. Re-sending identical prefixes on every turn of a multi-turn agent is the primary source of avoidable token spend.

## Consequences

- Product OS closes the loop: work defined in Layer 1 is executed by Layer 2, and results flow back as signals.
- The system is self-hosting: Layer 2 can execute the very WorkItems that define Layer 2 itself.
- Merge conflicts and test failures surface as first-class signals, preserving the existing feedback model.
- Context discipline and cost management are first-class architectural concerns with explicit rules per agent role.
- Adding `test` and `build` as WorkItem types makes tests traceable in the product graph, not a side-channel.
- Cost per story is a measurable KPI, not invisible infrastructure spend.
