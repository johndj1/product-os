/**
 * Seeds FinOps additions into the existing Layer 2 execution engine plan.
 * Run with: npx tsx prisma/seed-finops.ts
 *
 * Idempotent — skips if the cost KPI already exists.
 */

import { PrismaClient, WorkItemStatus, WorkItemType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: { slug: "product-os" },
    select: { id: true, name: true },
  });

  if (!product) {
    throw new Error("Product OS not found. Run `npm run db:seed` first.");
  }

  const costKpi = await prisma.workItem.findFirst({
    where: { product_id: product.id, title: "Cost per story executed" },
    select: { id: true },
  });

  if (costKpi) {
    console.log("FinOps items already seeded. Skipping.");
    return;
  }

  console.log(`Seeding FinOps additions into "${product.name}"...`);

  // Add cost KPI under the Layer 2 outcome
  const outcome = await prisma.workItem.findFirst({
    where: {
      product_id: product.id,
      title: "Product OS autonomously executes product work end-to-end",
    },
    select: { id: true },
  });

  if (!outcome) {
    throw new Error("Layer 2 outcome not found. Run seed-execution-engine.ts first.");
  }

  await prisma.workItem.create({
    data: {
      product_id: product.id,
      type: WorkItemType.kpi,
      status: WorkItemStatus.new,
      parent_id: outcome.id,
      title: "Cost per story executed",
      description:
        "Measures the average total LLM cost (USD) incurred per story WorkItem completed by the execution engine. Drives model tier selection and context discipline decisions.",
      current_value: null,
      target_value: 0.10,
      unit: "USD",
    },
  });
  console.log("  Created kpi: Cost per story executed");

  // Add cost tracking story under "Execution Plan and Wave schema"
  const schemaFeature = await prisma.workItem.findFirst({
    where: { product_id: product.id, title: "Execution Plan and Wave schema" },
    select: { id: true },
  });

  if (schemaFeature) {
    await prisma.workItem.create({
      data: {
        product_id: product.id,
        type: WorkItemType.story,
        status: WorkItemStatus.new,
        parent_id: schemaFeature.id,
        title: "Add cost tracking fields to AgentRun model",
        acceptance_criteria:
          "AgentRun model has model_used (String?), input_tokens (Int?), output_tokens (Int?), and cost_usd (Float?) fields. Fields are nullable so runs that predate cost tracking are not broken. Migration applied.",
      },
    });
    console.log("  Created story: Add cost tracking fields to AgentRun model");
  }

  // Add "Execution cost management" feature under Agent Dispatch capability
  const agentDispatch = await prisma.workItem.findFirst({
    where: { product_id: product.id, title: "Agent Dispatch" },
    select: { id: true },
  });

  if (agentDispatch) {
    const costFeature = await prisma.workItem.create({
      data: {
        product_id: product.id,
        type: WorkItemType.feature,
        status: WorkItemStatus.new,
        parent_id: agentDispatch.id,
        title: "Execution cost management",
        description:
          "Tracks and controls the token cost of each AgentRun. Covers cost observability, model tier selection, and prompt caching to prevent token spend from spiralling as execution volume grows.",
        acceptance_criteria:
          "Every AgentRun records model, tokens, and cost. The execution plan UI shows per-run and per-plan cost totals. Sub-agents executing scoped stories use a lighter model tier by default. Stable context fields are structured for prompt cache eligibility.",
      },
      select: { id: true },
    });
    console.log("  Created feature: Execution cost management");

    const costStories = [
      {
        title: "Record model_used, input_tokens, output_tokens, cost_usd on AgentRun completion",
        acceptance_criteria:
          "When an AgentRun transitions to done or failed, the API route writes model_used, input_tokens, output_tokens, and cost_usd to the record. Values come from the Claude API response usage fields.",
      },
      {
        title: "Assign model tier per WorkItem type",
        acceptance_criteria:
          "A model tier config maps WorkItem type to model id: coordinator uses claude-sonnet-4-6 or higher; sub-agents executing story or task use claude-haiku-4-5-20251001. Config is environment-variable overridable. Model is recorded in AgentRun.model_used.",
      },
      {
        title: "Structure context package for prompt cache eligibility",
        acceptance_criteria:
          "Stable fields (product Definition of Done, parent feature description, acceptance_criteria) are placed at the start of the context package so they form a cacheable prefix. Variable fields (current status, linked signals) are appended at the end. Cache hit rate is visible in AgentRun token breakdown.",
      },
      {
        title: "Emit cost_overrun signal when AgentRun exceeds budget",
        acceptance_criteria:
          "A per-WorkItem-type cost budget is configurable (default: story = $0.20, task = $0.05). If AgentRun.cost_usd exceeds the budget on completion, a delivery_risk signal is created with title 'Cost overrun: [WorkItem title]' and the actual vs budget in the description.",
      },
      {
        title: "Show cost summary per AgentRun and per ExecutionPlan in UI",
        acceptance_criteria:
          "Execution plan detail view shows cost_usd and model_used for each AgentRun. A plan-level total aggregates cost across all AgentRuns. Displayed as '$0.00' when cost_usd is null.",
      },
    ];

    for (const story of costStories) {
      await prisma.workItem.create({
        data: {
          product_id: product.id,
          type: WorkItemType.story,
          status: WorkItemStatus.new,
          parent_id: costFeature.id,
          title: story.title,
          acceptance_criteria: story.acceptance_criteria,
        },
      });
      console.log(`    Created story: ${story.title}`);
    }
  }

  // Add prompt caching story under "Coordinator context discipline"
  const contextDiscipline = await prisma.workItem.findFirst({
    where: { product_id: product.id, title: "Coordinator context discipline" },
    select: { id: true },
  });

  if (contextDiscipline) {
    await prisma.workItem.create({
      data: {
        product_id: product.id,
        type: WorkItemType.story,
        status: WorkItemStatus.new,
        parent_id: contextDiscipline.id,
        title: "Document prompt caching rules and cache hit targets",
        acceptance_criteria:
          "ADR-005 or CLAUDE.md section defines which context fields must be cache-eligible (Definition of Done, acceptance_criteria, parent description), the ordering rule (stable prefix before variable suffix), and a target cache hit rate of >60% for sub-agent runs after the first execution.",
      },
    });
    console.log("  Created story: Document prompt caching rules and cache hit targets");
  }

  const counts = await prisma.workItem.groupBy({
    by: ["type"],
    where: { product_id: product.id },
    _count: true,
  });

  console.log("\nDone. Updated WorkItem counts:");
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
