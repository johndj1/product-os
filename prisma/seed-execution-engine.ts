/**
 * Seeds the Layer 2 Execution Engine plan into the existing Product OS product.
 * Run with: npx tsx prisma/seed-execution-engine.ts
 *
 * Idempotent — skips if the outcome already exists.
 */

import { PrismaClient, RelationshipType, WorkItemStatus, WorkItemType } from "@prisma/client";

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const OUTCOME = {
  title: "Product OS autonomously executes product work end-to-end",
  description:
    "Product OS moves beyond tracking work to executing it. An AI execution engine reads ready WorkItems, decomposes them into execution waves, dispatches sub-agents to build and test in isolated Git worktrees, and integrates results back into the product graph. The system is self-hosting: Layer 2 executes the WorkItems that define Layer 2 itself.",
  acceptance_criteria:
    "Any WorkItem with status=ready and populated acceptance_criteria can be picked up and completed by the execution engine without human intervention. Time from ready feature to deployed change is under 60 minutes for a standard story.",
};

const KPIS = [
  {
    title: "Time from ready feature to deployed change",
    description: "Measures elapsed time from a feature WorkItem reaching status=ready to its changes being merged and deployed.",
    current_value: null as number | null,
    target_value: 60,
    unit: "minutes",
  },
  {
    title: "Agent execution success rate",
    description: "Percentage of WorkItems completed by the execution engine without requiring human intervention or rollback.",
    current_value: 0,
    target_value: 90,
    unit: "%",
  },
];

const CAPABILITIES = [
  {
    title: "Execution Planning",
    description:
      "Turns a set of ready WorkItems into an ordered, wave-based execution plan. Resolves dependencies to determine which tasks can run in parallel and which must run sequentially.",
    features: [
      {
        title: "Execution Plan and Wave schema",
        description: "Prisma models for ExecutionPlan, ExecutionWave, and AgentRun. New WorkItem types: test, build. New RelationshipType: verified_by.",
        acceptance_criteria:
          "Prisma schema defines ExecutionPlan, ExecutionWave, and AgentRun models. WorkItemType enum includes test and build. RelationshipType enum includes verified_by. Migration applied and types generated.",
        stories: [
          {
            title: "Add ExecutionPlan model to Prisma schema",
            acceptance_criteria: "ExecutionPlan model exists in schema.prisma with id, product_id, status (draft|running|done|failed), created_at, updated_at. Foreign key to Product with cascade delete.",
          },
          {
            title: "Add ExecutionWave model to Prisma schema",
            acceptance_criteria: "ExecutionWave model exists with id, plan_id, wave_number, wave_type (parallel|sequential), status (pending|running|done|failed), worktree_path, timestamps. Foreign key to ExecutionPlan.",
          },
          {
            title: "Add AgentRun model to Prisma schema",
            acceptance_criteria: "AgentRun model exists with id, wave_id, work_item_id, status (spawned|running|done|failed), output_summary, started_at, completed_at, timestamps. Foreign keys to ExecutionWave and WorkItem.",
          },
          {
            title: "Add test and build to WorkItemType enum",
            acceptance_criteria: "WorkItemType enum in schema.prisma and work-item-rules.ts includes test and build. story is an allowed parent of test in ALLOWED_CHILDREN_BY_PARENT.",
          },
          {
            title: "Add verified_by to RelationshipType enum",
            acceptance_criteria: "RelationshipType enum in schema.prisma includes verified_by. Relationship from a story to a test WorkItem with type verified_by can be created.",
          },
        ],
      },
      {
        title: "Wave decomposition algorithm",
        description: "Logic that takes a set of ready WorkItems and produces ordered ExecutionWave records by resolving blocks and depends_on relationships.",
        acceptance_criteria:
          "Given a list of ready WorkItems, the algorithm produces a plan where WorkItems with no inter-dependencies are grouped into a parallel wave, and WorkItems with blocks/depends_on edges are placed in sequential waves respecting dependency order.",
        stories: [
          {
            title: "Query ready WorkItems sorted by priority score for a product",
            acceptance_criteria: "Function returns all WorkItems with status=ready for a product, ordered by priority_score descending. Includes their outgoing blocks and depends_on relationships.",
          },
          {
            title: "Resolve dependency graph to determine parallel vs sequential waves",
            acceptance_criteria: "Given a list of WorkItems with dependency relationships, returns an ordered array of waves where each wave is marked parallel or sequential. Items with no dependencies on other ready items are placed in the first parallel wave.",
          },
          {
            title: "Create ExecutionPlan and ExecutionWave records from decomposition result",
            acceptance_criteria: "Function takes a product_id and decomposition result, creates one ExecutionPlan with status=draft and one ExecutionWave record per wave. Returns the plan id.",
          },
        ],
      },
      {
        title: "Execution plan API",
        description: "API routes to create, read, and trigger execution plans.",
        acceptance_criteria:
          "POST /api/execution-plans/create creates a plan from ready WorkItems. GET /api/execution-plans/[planId] returns plan with waves and agent runs. POST .../execute transitions plan to running and starts the first wave.",
        stories: [
          {
            title: "POST /api/execution-plans/create",
            acceptance_criteria: "Route accepts product_id, calls wave decomposition, creates ExecutionPlan + ExecutionWave records, returns plan id and wave summary. Returns 400 if no ready WorkItems exist.",
          },
          {
            title: "GET /api/execution-plans/[planId]",
            acceptance_criteria: "Route returns ExecutionPlan with nested ExecutionWaves and AgentRuns. Includes linked WorkItem title and status for each AgentRun.",
          },
          {
            title: "POST /api/execution-plans/[planId]/execute",
            acceptance_criteria: "Route transitions plan status from draft to running, sets first wave status to running, emits agent_started signals for each WorkItem in the wave.",
          },
          {
            title: "PATCH /api/execution-plans/[planId]/waves/[waveId]/complete",
            acceptance_criteria: "Route marks wave as done, advances plan to next wave or marks plan as done if all waves are complete. Triggers merge orchestration for the completed wave.",
          },
        ],
      },
      {
        title: "Execution plan UI",
        description: "Views for managing and monitoring execution plans within a Product workspace.",
        acceptance_criteria:
          "Execution plans are accessible from the Product workspace. A list view shows all plans with status. A detail view shows waves, agent runs, status, and output summaries.",
        stories: [
          {
            title: "Execution plans list view on Product workspace",
            acceptance_criteria: "New /products/[productId]/execution tab shows a list of ExecutionPlans with status, wave count, and created date. Create Plan button triggers POST /api/execution-plans/create.",
          },
          {
            title: "Execution plan detail view with wave and agent run status",
            acceptance_criteria: "Detail view at /products/[productId]/execution/[planId] shows ordered waves, each wave's type and status, and each AgentRun with linked WorkItem title, status, and output_summary.",
          },
        ],
      },
    ],
  },
  {
    title: "Agent Dispatch",
    description:
      "Spawns and manages sub-agents in isolated Git worktrees. Each sub-agent receives a lean context package containing only its assigned WorkItem and direct context. Agent lifecycle and status are tracked via AgentRun records.",
    features: [
      {
        title: "Git worktree management",
        description: "Create and clean up isolated Git worktrees for each ExecutionWave so sub-agents work without interfering with each other.",
        acceptance_criteria:
          "Each parallel wave gets its own worktree at a deterministic path. Worktrees are cleaned up after the wave completes or fails.",
        stories: [
          {
            title: "Create isolated Git worktree for each ExecutionWave",
            acceptance_criteria: "On wave start, a new Git worktree is created at .worktrees/wave-[waveId] on a branch feature/wave-[waveId]. The path is stored in ExecutionWave.worktree_path.",
          },
          {
            title: "Delete worktree after wave completion or failure",
            acceptance_criteria: "On wave done or failed transition, the worktree directory is removed and the branch deleted. ExecutionWave.worktree_path is cleared.",
          },
        ],
      },
      {
        title: "Sub-agent lifecycle",
        description: "Spawn sub-agents, track their status through spawned → running → done | failed, and handle failures gracefully.",
        acceptance_criteria:
          "Each AgentRun transitions through defined statuses. Failures create a delivery_risk signal and do not halt other running agents in a parallel wave.",
        stories: [
          {
            title: "Spawn sub-agent for each task in a parallel wave",
            acceptance_criteria: "For each WorkItem in a parallel wave, create an AgentRun with status=spawned, then transition to running when the agent starts. Record started_at timestamp.",
          },
          {
            title: "Track AgentRun status transitions",
            acceptance_criteria: "PATCH /api/agent-runs/[runId]/status accepts spawned, running, done, failed. Updates status and records started_at or completed_at as appropriate.",
          },
          {
            title: "Handle agent failure: create delivery_risk signal and continue",
            acceptance_criteria: "On AgentRun failure, a delivery_risk signal is created linked to the WorkItem with the agent's output_summary as description. Other agents in the wave continue. Wave status is set to failed only if all agents fail.",
          },
        ],
      },
      {
        title: "Agent context packaging",
        description: "Build a lean context package for each sub-agent containing only its assigned WorkItem, direct parent, acceptance criteria, and linked relationship summaries.",
        acceptance_criteria:
          "Context package is under 2000 tokens. It does not include the full product graph or unrelated WorkItems.",
        stories: [
          {
            title: "Build context package from WorkItem and direct parents",
            acceptance_criteria: "Function accepts a work_item_id and returns a structured context object with: title, description, acceptance_criteria, type, status, parent title and type, and a list of linked relationship summaries (relationship_type + linked item title only).",
          },
          {
            title: "Validate context package stays within token budget",
            acceptance_criteria: "Context package serialised to JSON must be under 8000 characters. If over budget, relationship summaries are truncated first, then description, never acceptance_criteria.",
          },
        ],
      },
    ],
  },
  {
    title: "Build and Test Execution",
    description:
      "Sub-agents write code, run tests, and produce deployable artifacts within their assigned Git worktrees. Tests are first-class WorkItem nodes linked to stories via verified_by relationships.",
    features: [
      {
        title: "Test WorkItem type",
        description: "First-class test nodes in the product graph. Stories are linked to test WorkItems via verified_by relationships, making test coverage traceable.",
        acceptance_criteria:
          "A WorkItem of type=test can be created as a child of a story or linked via verified_by relationship. Test WorkItems have acceptance_criteria that define the test scope.",
        stories: [
          {
            title: "Add test type to work-item-rules.ts and allowed hierarchy",
            acceptance_criteria: "WORK_ITEM_TYPE_VALUES includes test. ALLOWED_CHILDREN_BY_PARENT for story includes test. getAllowedParentTypes(test) returns [story].",
          },
          {
            title: "Update priority scoring for test WorkItems",
            acceptance_criteria: "priority-scoring.ts assigns a base score to test type. Test WorkItems linked to active stories via verified_by receive a strategic relevance bonus.",
          },
          {
            title: "Render test WorkItem detail view",
            acceptance_criteria: "WorkItem detail page for type=test shows acceptance_criteria prominently as the test definition. Relationships section shows the parent story via verified_by.",
          },
        ],
      },
      {
        title: "Agent coding runtime",
        description: "Agent receives WorkItem context, writes code to its worktree, runs the test suite, and reports results back.",
        acceptance_criteria:
          "Agent completes a story WorkItem by writing code that satisfies acceptance_criteria, passes tests, and stores a concise output summary in AgentRun.output_summary.",
        stories: [
          {
            title: "Agent reads WorkItem context and writes code to assigned worktree",
            acceptance_criteria: "Sub-agent receives context package, writes implementation to the assigned worktree path, commits with message referencing the WorkItem id and title.",
          },
          {
            title: "Agent executes test suite and captures pass/fail result",
            acceptance_criteria: "Agent runs npm test (or equivalent) in the worktree. Pass/fail result and summary are stored in AgentRun.output_summary. Exits with status reflecting test outcome.",
          },
          {
            title: "Emit test_failure signal on agent test failure",
            acceptance_criteria: "If test run fails, agent emits a test_failure signal linked to the WorkItem with the failure output as description. Signal ingestion creates a bug WorkItem per existing rules.",
          },
          {
            title: "Emit agent_completed signal on agent success",
            acceptance_criteria: "If test run passes, agent emits an agent_completed signal linked to the WorkItem. Signal ingestion rule updates WorkItem status to done.",
          },
        ],
      },
    ],
  },
  {
    title: "Result Integration",
    description:
      "Coordinator merges completed wave worktrees back to the main branch, resolves conflicts, and updates WorkItem statuses. The product graph reflects the real state of the codebase.",
    features: [
      {
        title: "Wave merge orchestration",
        description: "Coordinator merges each completed wave's worktree branch to main after all agents in the wave are done.",
        acceptance_criteria:
          "After a wave reaches status=done, its branch is merged to main. Merge conflicts surface as signals rather than halting the pipeline.",
        stories: [
          {
            title: "Merge completed wave worktree branch to main",
            acceptance_criteria: "On wave done, coordinator runs git merge for the wave branch into main inside the worktree. On success, records merge commit hash in ExecutionWave.",
          },
          {
            title: "Detect merge conflicts and create merge_conflict signal",
            acceptance_criteria: "On merge conflict, coordinator creates a merge_conflict signal linked to the wave's WorkItems with conflict details in description. Wave status is set to failed. Execution continues with the next wave.",
          },
        ],
      },
      {
        title: "WorkItem completion flow",
        description: "WorkItems are marked done when their AgentRun succeeds and changes are merged. The product graph stays in sync with the codebase.",
        acceptance_criteria:
          "WorkItem status transitions to done automatically after successful merge. The AgentRun is linked back to the WorkItem for traceability.",
        stories: [
          {
            title: "Update WorkItem status to done on successful merge",
            acceptance_criteria: "After wave merge succeeds, all WorkItems in the wave with a completed AgentRun have their status updated to done. updated_at is recorded.",
          },
          {
            title: "Link AgentRun output to WorkItem via relationship",
            acceptance_criteria: "A relates_to relationship is created from the completed WorkItem to a Page containing the AgentRun output_summary, for traceability in the product graph.",
          },
        ],
      },
    ],
  },
  {
    title: "Execution Feedback",
    description:
      "New signal types and ingestion rules for execution events. Keeps Layer 1 and Layer 2 in sync: execution outcomes flow back into the product graph as signals, triggering the same deterministic routing rules as any other signal.",
    features: [
      {
        title: "Execution signal types",
        description: "New SignalType values for execution events: agent_started, agent_completed, merge_conflict.",
        acceptance_criteria:
          "All three signal types are defined in the schema and handled by signal ingestion. agent_completed transitions the linked WorkItem to done. merge_conflict creates a delivery_risk follow-up.",
        stories: [
          {
            title: "Add agent_started, agent_completed, merge_conflict to SignalType enum",
            acceptance_criteria: "SignalType enum in schema.prisma includes agent_started, agent_completed, and merge_conflict. Prisma client regenerated.",
          },
          {
            title: "Add ingestion rule: agent_completed updates WorkItem status to done",
            acceptance_criteria: "In signal-ingestion.ts, agent_completed rule finds the linked WorkItem and sets status to done. routing_note records the AgentRun id.",
          },
          {
            title: "Add ingestion rule: merge_conflict creates delivery_risk follow-up",
            acceptance_criteria: "In signal-ingestion.ts, merge_conflict rule creates a story WorkItem titled 'Resolve merge conflict: [signal title]' with status=new. Follows existing delivery_risk pattern.",
          },
        ],
      },
      {
        title: "Coordinator context discipline",
        description: "Explicit rules and enforcement for what the coordinator holds in context at any point. Token budget per agent role.",
        acceptance_criteria:
          "Coordinator never loads the full WorkItem graph into context. Sub-agents receive only their context package. Context budget is documented and validated.",
        stories: [
          {
            title: "Document coordinator and sub-agent context budgets",
            acceptance_criteria: "ADR-005 or a CLAUDE.md section defines: coordinator budget (plan + wave status only, max 4000 tokens), sub-agent budget (context package, max 8000 tokens). Rationale references token cost and quality degradation above budget.",
          },
          {
            title: "Validate coordinator does not load full WorkItem graph",
            acceptance_criteria: "Coordinator code path does not call any query that returns the full work_items table without a status=ready filter and a field projection. Enforced by code review checklist in CLAUDE.md.",
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main() {
  const product = await prisma.product.findFirst({
    where: { slug: "product-os" },
    select: { id: true, name: true },
  });

  if (!product) {
    throw new Error("Product OS not found. Run `npm run db:seed` first.");
  }

  const existing = await prisma.workItem.findFirst({
    where: { product_id: product.id, title: OUTCOME.title },
    select: { id: true },
  });

  if (existing) {
    console.log("Layer 2 execution engine plan already seeded. Skipping.");
    return;
  }

  console.log(`Seeding Layer 2 execution engine plan into "${product.name}"...`);

  // Outcome
  const outcome = await prisma.workItem.create({
    data: {
      product_id: product.id,
      type: WorkItemType.outcome,
      status: WorkItemStatus.new,
      title: OUTCOME.title,
      description: OUTCOME.description,
      acceptance_criteria: OUTCOME.acceptance_criteria,
    },
    select: { id: true },
  });

  console.log(`  Created outcome: ${OUTCOME.title}`);

  // KPIs
  for (const kpi of KPIS) {
    await prisma.workItem.create({
      data: {
        product_id: product.id,
        type: WorkItemType.kpi,
        status: WorkItemStatus.new,
        parent_id: outcome.id,
        title: kpi.title,
        description: kpi.description,
        current_value: kpi.current_value,
        target_value: kpi.target_value,
        unit: kpi.unit,
      },
    });
    console.log(`  Created kpi: ${kpi.title}`);
  }

  // Capabilities → Features → Stories
  for (const cap of CAPABILITIES) {
    const capability = await prisma.workItem.create({
      data: {
        product_id: product.id,
        type: WorkItemType.capability,
        status: WorkItemStatus.new,
        title: cap.title,
        description: cap.description,
      },
      select: { id: true },
    });

    await prisma.relationship.create({
      data: {
        product_id: product.id,
        from_work_item_id: capability.id,
        to_work_item_id: outcome.id,
        relationship_type: RelationshipType.supports,
      },
    });

    console.log(`  Created capability: ${cap.title}`);

    for (const feat of cap.features) {
      const feature = await prisma.workItem.create({
        data: {
          product_id: product.id,
          type: WorkItemType.feature,
          status: WorkItemStatus.new,
          parent_id: capability.id,
          title: feat.title,
          description: feat.description,
          acceptance_criteria: feat.acceptance_criteria,
        },
        select: { id: true },
      });

      console.log(`    Created feature: ${feat.title}`);

      for (const story of feat.stories) {
        await prisma.workItem.create({
          data: {
            product_id: product.id,
            type: WorkItemType.story,
            status: WorkItemStatus.new,
            parent_id: feature.id,
            title: story.title,
            acceptance_criteria: story.acceptance_criteria,
          },
        });
        console.log(`      Created story: ${story.title}`);
      }
    }
  }

  const counts = await prisma.workItem.groupBy({
    by: ["type"],
    where: { product_id: product.id },
    _count: true,
  });

  console.log("\nDone. WorkItem counts for product:");
  for (const row of counts) {
    console.log(`  ${row.type}: ${row._count}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
