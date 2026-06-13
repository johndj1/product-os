/**
 * Backlog refinement for the Layer 2 execution engine plan.
 * - Improves acceptance criteria on stories that need it
 * - Wires blocks/depends_on relationships between stories
 * - Marks Wave 1 stories as ready
 *
 * Run with: npx tsx prisma/seed-refinement.ts
 */

import { PrismaClient, RelationshipType, WorkItemStatus } from "@prisma/client";

const p = new PrismaClient();

async function id(title: string): Promise<string> {
  const item = await p.workItem.findFirst({
    where: { product: { slug: "product-os" }, title },
    select: { id: true },
  });
  if (!item) throw new Error(`WorkItem not found: "${title}"`);
  return item.id;
}

async function main() {
  const product = await p.product.findFirst({
    where: { slug: "product-os" },
    select: { id: true },
  });
  if (!product) throw new Error("Product OS not found.");

  // -------------------------------------------------------------------------
  // 1. Refine acceptance criteria
  // -------------------------------------------------------------------------
  console.log("Refining acceptance criteria...");

  const acRefinements: Array<{ title: string; acceptance_criteria: string }> = [
    {
      title: "Resolve dependency graph to determine parallel vs sequential waves",
      acceptance_criteria: `Given a list of ready WorkItems with their outgoing blocks and depends_on relationships, when the decomposition function runs, then it returns an ordered array of waves where:
- Wave 1 contains all items with no depends_on edges pointing to other items in the list (parallel wave)
- Each subsequent wave contains items whose depends_on dependencies are all satisfied by earlier waves
- A wave is marked parallel when it contains more than one item with no inter-dependencies
- A wave is marked sequential when items within it must execute in order due to depends_on chains
- Items that depend on items outside the ready list are flagged in a blockedItems array and excluded from the plan`,
    },
    {
      title: "Spawn sub-agent for each task in a parallel wave",
      acceptance_criteria: `Given an ExecutionWave with wave_type=parallel and status=running, when the coordinator processes the wave, then:
- For each WorkItem assigned to the wave, a new AgentRun record is created with status=spawned
- The coordinator calls the Claude Agent SDK (Agent tool) once per WorkItem, passing the context package as the prompt
- Each agent call is made in parallel (single message with multiple Agent tool calls)
- Each AgentRun transitions to status=running when its agent call begins, recording started_at
- AgentRun records are linked to the wave and the WorkItem`,
    },
    {
      title: "Handle agent failure: create delivery_risk signal and continue",
      acceptance_criteria: `Given an AgentRun that transitions to status=failed, when the failure is recorded, then:
- A delivery_risk signal is created with title "Agent failure: [WorkItem title]" and the AgentRun output_summary as description
- The signal is linked to the failed WorkItem
- A routing_note is set: "Agent execution failed. Created delivery_risk follow-up."
- Other AgentRuns in the same wave are NOT cancelled — they continue to completion
- The wave is marked failed only when all AgentRuns in it have reached a terminal state (done or failed) and at least one is failed
- The wave is marked done when all AgentRuns reach done`,
    },
    {
      title: "Build context package from WorkItem and direct parents",
      acceptance_criteria: `Given a work_item_id, when buildContextPackage(id) is called, then it returns a typed object with:
- workItem: { id, title, description, acceptance_criteria, type, status }
- parent: { title, type } | null (direct parent WorkItem only)
- relationships: Array<{ relationship_type, linkedItemTitle }> (max 10, outgoing only)
- product: { definition_of_done }
The function makes at most 2 database queries. It does not traverse grandparents or siblings.`,
    },
    {
      title: "Structure context package for prompt cache eligibility",
      acceptance_criteria: `Given a context package object, when it is serialised into a prompt string for a sub-agent, then:
- The prompt is structured in two sections: STABLE (first) and VARIABLE (last)
- STABLE contains: product definition_of_done, parent feature title and description, WorkItem acceptance_criteria — these fields do not change between runs for the same WorkItem
- VARIABLE contains: WorkItem current status, linked signals (if any), and any runtime instructions
- STABLE section is identical across runs for the same WorkItem, making it eligible for Claude's prompt cache
- The serialised prompt is verified to be under 8000 characters before being passed to the agent`,
    },
    {
      title: "Merge completed wave worktree branch to main",
      acceptance_criteria: `Given an ExecutionWave with status=done and a valid worktree_path, when the coordinator triggers merge, then:
- git merge feature/wave-[waveId] is run on the main branch inside the worktree
- On success: the merge commit hash is stored in ExecutionWave (add merge_commit field), wave status remains done
- On conflict: wave status is NOT changed to failed here — conflict detection is handled by the "Detect merge conflicts" story
- The merge is a non-fast-forward merge (--no-ff) to preserve wave history in the git log
- The coordinator does not hold the full diff in context — only the merge result status (success | conflict)`,
    },
    {
      title: "PATCH /api/execution-plans/[planId]/waves/[waveId]/complete",
      acceptance_criteria: `Given an ExecutionPlan with a running wave, when PATCH .../waves/[waveId]/complete is called with { status: 'done' | 'failed' }, then:
- The wave status is updated to the provided value
- If status=done: the next wave (wave_number + 1) has its status set to running; if no next wave exists, the plan status is set to done
- If status=failed: the plan status is set to failed; no further waves are started
- If the wave is not in running status when the request arrives, return 409 Conflict
- Response body includes the updated plan status and next wave id (if any)`,
    },
  ];

  for (const refinement of acRefinements) {
    const workItemId = await id(refinement.title);
    await p.workItem.update({
      where: { id: workItemId },
      data: { acceptance_criteria: refinement.acceptance_criteria },
    });
    console.log(`  Refined AC: ${refinement.title}`);
  }

  // -------------------------------------------------------------------------
  // 2. Wire dependency relationships
  // -------------------------------------------------------------------------
  console.log("\nWiring depends_on relationships...");

  const dependencies: Array<{ from: string; to: string }> = [
    // Schema dependencies
    {
      from: "Add cost tracking fields to AgentRun model",
      to: "Add AgentRun model to Prisma schema",
    },
    {
      from: "Track AgentRun status transitions",
      to: "Add AgentRun model to Prisma schema",
    },
    {
      from: "Spawn sub-agent for each task in a parallel wave",
      to: "Add AgentRun model to Prisma schema",
    },
    {
      from: "Link AgentRun output to WorkItem via relationship",
      to: "Add AgentRun model to Prisma schema",
    },
    {
      from: "Record model_used, input_tokens, output_tokens, cost_usd on AgentRun completion",
      to: "Add cost tracking fields to AgentRun model",
    },
    {
      from: "Create isolated Git worktree for each ExecutionWave",
      to: "Add ExecutionWave model to Prisma schema",
    },
    {
      from: "Spawn sub-agent for each task in a parallel wave",
      to: "Add ExecutionWave model to Prisma schema",
    },
    {
      from: "GET /api/execution-plans/[planId]",
      to: "Add ExecutionPlan model to Prisma schema",
    },

    // Signal type dependencies
    {
      from: "Add ingestion rule: agent_completed updates WorkItem status to done",
      to: "Add agent_started, agent_completed, merge_conflict to SignalType enum",
    },
    {
      from: "Add ingestion rule: merge_conflict creates delivery_risk follow-up",
      to: "Add agent_started, agent_completed, merge_conflict to SignalType enum",
    },
    {
      from: "POST /api/execution-plans/[planId]/execute",
      to: "Add agent_started, agent_completed, merge_conflict to SignalType enum",
    },
    {
      from: "Emit agent_completed signal on agent success",
      to: "Add agent_started, agent_completed, merge_conflict to SignalType enum",
    },
    {
      from: "Detect merge conflicts and create merge_conflict signal",
      to: "Add agent_started, agent_completed, merge_conflict to SignalType enum",
    },

    // Test type dependencies
    {
      from: "Update priority scoring for test WorkItems",
      to: "Add test type to work-item-rules.ts and allowed hierarchy",
    },
    {
      from: "Render test WorkItem detail view",
      to: "Add test type to work-item-rules.ts and allowed hierarchy",
    },

    // Context packaging chain
    {
      from: "Validate context package stays within token budget",
      to: "Build context package from WorkItem and direct parents",
    },
    {
      from: "Structure context package for prompt cache eligibility",
      to: "Build context package from WorkItem and direct parents",
    },
    {
      from: "Agent reads WorkItem context and writes code to assigned worktree",
      to: "Build context package from WorkItem and direct parents",
    },
    {
      from: "Assign model tier per WorkItem type",
      to: "Build context package from WorkItem and direct parents",
    },

    // Wave decomposition chain
    {
      from: "Resolve dependency graph to determine parallel vs sequential waves",
      to: "Query ready WorkItems sorted by priority score for a product",
    },
    {
      from: "Create ExecutionPlan and ExecutionWave records from decomposition result",
      to: "Resolve dependency graph to determine parallel vs sequential waves",
    },
    {
      from: "Spawn sub-agent for each task in a parallel wave",
      to: "Resolve dependency graph to determine parallel vs sequential waves",
    },

    // API chain
    {
      from: "POST /api/execution-plans/create",
      to: "Create ExecutionPlan and ExecutionWave records from decomposition result",
    },
    {
      from: "POST /api/execution-plans/[planId]/execute",
      to: "POST /api/execution-plans/create",
    },
    {
      from: "PATCH /api/execution-plans/[planId]/waves/[waveId]/complete",
      to: "POST /api/execution-plans/[planId]/execute",
    },
    {
      from: "Execution plans list view on Product workspace",
      to: "GET /api/execution-plans/[planId]",
    },
    {
      from: "Execution plan detail view with wave and agent run status",
      to: "Execution plans list view on Product workspace",
    },

    // Agent execution chain
    {
      from: "Agent executes test suite and captures pass/fail result",
      to: "Agent reads WorkItem context and writes code to assigned worktree",
    },
    {
      from: "Emit test_failure signal on agent test failure",
      to: "Agent executes test suite and captures pass/fail result",
    },
    {
      from: "Emit agent_completed signal on agent success",
      to: "Agent executes test suite and captures pass/fail result",
    },

    // Lifecycle chain
    {
      from: "Handle agent failure: create delivery_risk signal and continue",
      to: "Track AgentRun status transitions",
    },

    // Worktree chain
    {
      from: "Delete worktree after wave completion or failure",
      to: "Create isolated Git worktree for each ExecutionWave",
    },
    {
      from: "Merge completed wave worktree branch to main",
      to: "Create isolated Git worktree for each ExecutionWave",
    },
    {
      from: "Detect merge conflicts and create merge_conflict signal",
      to: "Merge completed wave worktree branch to main",
    },
    {
      from: "Update WorkItem status to done on successful merge",
      to: "Merge completed wave worktree branch to main",
    },

    // Cost chain
    {
      from: "Emit cost_overrun signal when AgentRun exceeds budget",
      to: "Record model_used, input_tokens, output_tokens, cost_usd on AgentRun completion",
    },
    {
      from: "Show cost summary per AgentRun and per ExecutionPlan in UI",
      to: "Execution plan detail view with wave and agent run status",
    },
    {
      from: "Show cost summary per AgentRun and per ExecutionPlan in UI",
      to: "Record model_used, input_tokens, output_tokens, cost_usd on AgentRun completion",
    },

    // Context discipline chain
    {
      from: "Validate coordinator does not load full WorkItem graph",
      to: "Document coordinator and sub-agent context budgets",
    },
  ];

  let wired = 0;
  let skipped = 0;
  for (const dep of dependencies) {
    const fromId = await id(dep.from);
    const toId = await id(dep.to);
    try {
      await p.relationship.create({
        data: {
          product_id: product.id,
          from_work_item_id: fromId,
          to_work_item_id: toId,
          relationship_type: RelationshipType.depends_on,
        },
      });
      wired++;
    } catch {
      skipped++;
    }
  }
  console.log(`  Wired: ${wired} depends_on relationships (${skipped} already existed)`);

  // -------------------------------------------------------------------------
  // 3. Mark Wave 1 stories as ready
  // -------------------------------------------------------------------------
  console.log("\nMarking Wave 1 stories as ready...");

  const wave1Titles = [
    // Schema changes (can all run in parallel)
    "Add ExecutionPlan model to Prisma schema",
    "Add ExecutionWave model to Prisma schema",
    "Add AgentRun model to Prisma schema",
    "Add test and build to WorkItemType enum",
    "Add verified_by to RelationshipType enum",
    "Add agent_started, agent_completed, merge_conflict to SignalType enum",
    // Code-only, no schema dependencies
    "Add test type to work-item-rules.ts and allowed hierarchy",
    "Query ready WorkItems sorted by priority score for a product",
    "Build context package from WorkItem and direct parents",
    "Assign model tier per WorkItem type",
    // Documentation, no code dependencies
    "Document coordinator and sub-agent context budgets",
    "Document prompt caching rules and cache hit targets",
  ];

  for (const title of wave1Titles) {
    const workItemId = await id(title);
    await p.workItem.update({
      where: { id: workItemId },
      data: { status: WorkItemStatus.ready },
    });
  }
  console.log(`  Marked ${wave1Titles.length} stories as ready`);

  // -------------------------------------------------------------------------
  // 4. Report
  // -------------------------------------------------------------------------
  const readyCount = await p.workItem.count({
    where: { product: { slug: "product-os" }, status: "ready", type: { in: ["story", "task"] } },
  });
  const newCount = await p.workItem.count({
    where: { product: { slug: "product-os" }, status: "new", type: { in: ["story", "task"] } },
  });
  const depCount = await p.relationship.count({
    where: { product: { slug: "product-os" }, relationship_type: "depends_on" },
  });

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Refinement report — product-os — Layer 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stories improved (AC refined): ${acRefinements.length}
Dependencies wired:             ${wired}
Stories marked ready:           ${wave1Titles.length}

Current backlog state:
  ready  ${readyCount}
  new    ${newCount}
  depends_on relationships: ${depCount}

Wave 1 (ready to start now — run in parallel):
${wave1Titles.map((t) => `  ✓ ${t}`).join("\n")}

Flagged for attention:
  • "Add AgentRun model" and "Add cost tracking fields to AgentRun model" are
    separate stories but must land in the same Prisma migration. Whoever picks
    up the cost fields story should coordinate with the AgentRun story or merge
    them into one PR.
  • "Merge completed wave worktree branch to main" AC references a merge_commit
    field on ExecutionWave that is not yet in the schema story. Add it to the
    "Add ExecutionWave model" story AC before that story is worked.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
