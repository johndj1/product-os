import { PrismaClient, RelationshipType, SignalStatus, SignalType, UserType, WorkItemStatus, WorkItemType } from "@prisma/client";
import { assertAllowedChildType } from "../src/lib/work-item-hierarchy";

const prisma = new PrismaClient();

type CreateWorkItemInput = {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  type: WorkItemType;
  status?: WorkItemStatus;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  lastUpdatedAt?: Date;
  parentId?: string;
  productId: string;
  createdBy?: string;
};

async function createWorkItem(input: CreateWorkItemInput) {
  if (input.parentId) {
    const parent = await prisma.workItem.findUniqueOrThrow({
      where: { id: input.parentId },
      select: { type: true },
    });
    assertAllowedChildType(parent.type, input.type);
  }

  return prisma.workItem.create({
    data: {
      title: input.title,
      description: input.description,
      acceptance_criteria: input.acceptanceCriteria,
      type: input.type,
      status: input.status ?? WorkItemStatus.new,
      current_value: input.currentValue,
      target_value: input.targetValue,
      unit: input.unit,
      last_updated_at: input.lastUpdatedAt,
      parent_id: input.parentId,
      product_id: input.productId,
      created_by: input.createdBy,
    },
  });
}

async function main() {
  await prisma.comment.deleteMany();
  await prisma.page.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const systemUser = await prisma.user.create({
    data: {
      email: "system@product-os.local",
      name: "Product OS System",
      user_type: UserType.system,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: "Product OS",
      slug: "product-os",
      description: "Dogfooded product for operating outcomes through a canonical product graph.",
      definition_of_done:
        "- Code merged to main\n- Tests passing\n- Documentation updated\n- Deployment path validated",
    },
  });

  const outcome = await createWorkItem({
    title: "Build an AI-native Product OS",
    type: WorkItemType.outcome,
    status: WorkItemStatus.in_progress,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const kpi = await createWorkItem({
    title: "Reduce time from idea to deployed change",
    type: WorkItemType.kpi,
    status: WorkItemStatus.ready,
    currentValue: 14,
    targetValue: 3,
    unit: "days",
    lastUpdatedAt: new Date(),
    parentId: outcome.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const coreGraphCapability = await createWorkItem({
    title: "Core Product Graph",
    type: WorkItemType.capability,
    status: WorkItemStatus.in_progress,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const canonicalDomainFeature = await createWorkItem({
    title: "Canonical domain model",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    parentId: coreGraphCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const defineEntitiesStory = await createWorkItem({
    title: "Define core entities",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    parentId: canonicalDomainFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Implement Product, WorkItem, Page, Comment, User, and Signal schema",
    type: WorkItemType.task,
    status: WorkItemStatus.done,
    parentId: defineEntitiesStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const enforceHierarchyStory = await createWorkItem({
    title: "Enforce golden-thread hierarchy",
    type: WorkItemType.story,
    status: WorkItemStatus.in_progress,
    parentId: canonicalDomainFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Implement hierarchy guardrails for allowed parent-child types",
    type: WorkItemType.task,
    status: WorkItemStatus.in_progress,
    parentId: enforceHierarchyStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const workspaceCapability = await createWorkItem({
    title: "Product workspace",
    type: WorkItemType.capability,
    status: WorkItemStatus.in_progress,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const workspaceShellFeature = await createWorkItem({
    title: "Workspace shell",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    parentId: workspaceCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const createOverviewStory = await createWorkItem({
    title: "Create Product overview page",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    acceptanceCriteria:
      "- Overview route loads Product context\n- KPI summary and recent activity are visible\n- Golden-thread view renders without errors",
    parentId: workspaceShellFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Render golden-thread tree view",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    acceptanceCriteria:
      "- Parent-child hierarchy is rendered in order\n- WorkItem type and status are visible per node\n- Empty state is shown when no WorkItems exist",
    parentId: workspaceShellFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const automationCapability = await createWorkItem({
    title: "Automation foundation",
    type: WorkItemType.capability,
    status: WorkItemStatus.ready,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const workedExampleCapability = await createWorkItem({
    title: "Worked example delivery backlogs",
    type: WorkItemType.capability,
    status: WorkItemStatus.ready,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainHistoricalLookupFeature = await createWorkItem({
    title: "Historical Delay Repay Lookup",
    description:
      "Summary\nAllow Check-a-Train to identify the most likely historical service for a past journey, retrieve actual running data, and present a first-pass Delay Repay eligibility signal.\n\nThis enables users to check whether a past train was delayed or cancelled without manually piecing together operator websites, historical timetables, or rail data sources.\n\nScope Includes\n- Search historical services using HSP serviceMetrics\n- Match services by:\n  - origin station\n  - destination station\n  - approximate departure time\n  - time window\n- Enrich the top matched candidate using HSP serviceDetails\n- Retrieve and normalize:\n  - planned departure/arrival\n  - actual departure/arrival\n  - operator\n  - cancellation status\n- Derive:\n  - first-pass delay status\n  - delay minutes when available\n  - first-pass Delay Repay eligibility signal\n- Present the result in the existing Check-a-Train journey result UI\n\nOut of Scope\n- Full journey planning\n- Multi-leg journey reconstruction\n- Returning all possible route alternatives\n- Operator-specific compensation policy differences\n- Autofilling operator claim forms\n- Background polling or monitoring\n\nDependencies\n- Linked customer outcome: User can view accurate delay information for their train\n- Journey step context: Check delay details\n- Journey context: Claim compensation for a delayed train\n- HSP gateway access and valid API key\n- Existing journey provider orchestration\n- Existing delay derivation and eligibility logic\n- Existing result card UI\n\nValue\nImprove the user's ability to verify whether a past journey was delayed or cancelled by using historical service data rather than live-only board data.\n\nThis gives Check-a-Train a credible historical lookup path and strengthens trust in the product for completed journeys.\n\nDefinition of Done\n- Historical past-date search works end-to-end through the app\n- HSP serviceMetrics and serviceDetails are both integrated\n- Normalized historical service results are returned through /api/journeys\n- Real historical status can be surfaced in the UI\n- The implementation is documented and testable locally\n- Current MVP limitations are documented clearly enough for future refinement",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    acceptanceCriteria:
      "- Historical searches use HSP instead of Darwin live board data\n- HSP serviceMetrics is used to identify plausible candidate services for the searched route and time window\n- The top matched candidate is enriched with HSP serviceDetails using RID\n- The normalized service includes planned and actual timing data where available\n- The system derives a historical status such as On time, Delayed, or Cancelled where supported by the data\n- The result is displayed through the existing journey result flow without requiring a separate UI\n- If HSP enrichment fails, the base historical candidate is still returned safely and eligibility remains unknown rather than being guessed\n- The feature is explicit about current MVP limits, including that only the top matched direct service is returned",
    parentId: workedExampleCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainHistoricalLookupStory = await createWorkItem({
    title: "Use the historical HSP lookup path when live resolution has no match",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    acceptanceCriteria:
      "- Historical lookup falls back to HSP when the live train lookup path cannot resolve a service\n- Supported historical services now return a usable match via the HSP path\n- Shipped work is recorded separately from follow-on coverage expansion",
    parentId: checkATrainHistoricalLookupFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Wire the historical HSP fallback into service resolution",
    type: WorkItemType.task,
    status: WorkItemStatus.done,
    parentId: checkATrainHistoricalLookupStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainHistoricalCoverageStory = await createWorkItem({
    title: "Expand Historical Journey Candidate Coverage",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    description:
      "Linked Outcome\n- User can view accurate delay information for their train\n\nDescription\nThe current historical lookup returns only the top matched direct service from the HSP search window. This works for confident users who know roughly which train they boarded, but it is too narrow for users who only remember an approximate time or who may have taken a nearby alternative service.\n\nContext / Background\nHistorical search now uses HSP successfully for past-date lookups. HSP serviceMetrics returns candidate services, and the app currently enriches the top match with serviceDetails to derive historical timings and status.\n\nThis is useful, but narrow. A user may search for:\n- a train they boarded a few minutes earlier or later than remembered\n- a nearby alternative service\n- a journey where multiple plausible services existed within the same window\n\nProblem / Need\nReturning only one matched service can hide the correct train and reduce user confidence, especially when the user is unsure of the exact departure.\n\nThe historical search should return a small set of plausible services and let the user identify the right one.\n\nScope of Work\n- Update the HSP historical provider path to retain multiple candidate services from the search window\n- Rank candidates by route relevance and time proximity\n- Return the top 3 to 5 plausible services rather than only the best match\n- Preserve existing enrichment for the best candidate where practical\n- Ensure each returned candidate includes enough detail for user verification\n- Update the UI to display multiple plausible historical services cleanly\n- Keep the current top match visually prominent\n\nOperational Readiness\n- Historical provider logs show candidate count and ranking decisions\n- The result remains safe if fewer than 3 candidates are available\n- No crash occurs when enrichment succeeds for only some candidates\n\nDeliverables\n- Updated historical provider logic to retain multiple candidates\n- Ranking logic for historical services\n- UI support for multiple historical result cards\n- Local verification examples for realistic historical searches\n\nDefinition of Done\n- Historical searches can return multiple candidate services\n- The top 3 to 5 plausible results are shown when available\n- Ranking is understandable and stable\n- Each service retains independent status and eligibility evaluation\n- The UI continues to work cleanly for both single-result and multi-result historical searches",
    acceptanceCriteria:
      "Feature: Expand historical journey candidate coverage\n\nScenario: Multiple historical services are returned within the search window\nGiven a past-date journey search with multiple plausible services in HSP\nWhen the search is executed\nThen the provider returns more than one candidate service\nAnd the services are ranked by route relevance and departure-time proximity\n\nScenario: The UI displays multiple plausible historical services\nGiven the provider returns several historical candidates\nWhen the results are rendered\nThen the UI displays multiple journey cards\nAnd each card includes enough detail for the user to identify the right train\n\nScenario: The most likely service remains clear\nGiven multiple candidate services are returned\nWhen the user reviews the results\nThen the most likely match is still identifiable in the UI\nAnd the ranking remains stable and explainable\n\nScenario: Eligibility is calculated per candidate\nGiven multiple historical candidate services are returned\nWhen the system derives delay and eligibility signals\nThen each candidate displays its own status and eligibility state\nAnd unknown values remain unknown rather than guessed",
    parentId: checkATrainHistoricalLookupFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Define additional historical candidate selection scenarios",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    parentId: checkATrainHistoricalCoverageStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const signalIngestionFeature = await createWorkItem({
    title: "Signal ingestion foundation",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    acceptanceCriteria:
      "- Signals can be ingested via API and UI flow\n- Deterministic routing note is recorded on signal\n- Follow-up WorkItems are created for matching rules",
    parentId: automationCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainCoverageBug = await createWorkItem({
    title: "Historical lookup misses services outside the current HSP candidate set",
    description:
      "Context / Background\n- Check-a-Train now resolves supported historical services through the HSP lookup path.\n- Some historical services still fail when the correct train is not present in the current candidate set.\n- This bug captures known gaps to be addressed by the follow-on historical candidate coverage Story.\n\nRepro Steps\n1. Open a historical journey that falls through to HSP lookup.\n2. Use a service where the correct match is not included in the current candidate set.\n3. View the lookup result.\n\nExpected Result\n- A valid historical candidate is found and selected.\n\nActual Result\n- No match is returned even though a valid historical service exists.\n\nSeverity\n- Medium\n\nEnvironment\n- Check-a-Train historical lookup experience\n- Historical services resolved via HSP fallback",
    acceptanceCriteria:
      "- Historical services outside the current narrow candidate set can still be matched when valid HSP data exists\n- Candidate expansion does not regress the already-working HSP fallback path\n- Regression coverage exists for previously missed historical candidate scenarios",
    type: WorkItemType.bug,
    status: WorkItemStatus.ready,
    parentId: checkATrainHistoricalCoverageStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const signalResearch = await createWorkItem({
    title: "Investigate signal routing quality",
    type: WorkItemType.research,
    status: WorkItemStatus.ready,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await prisma.relationship.createMany({
    data: [
      {
        product_id: product.id,
        from_work_item_id: coreGraphCapability.id,
        to_work_item_id: kpi.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: canonicalDomainFeature.id,
        to_work_item_id: kpi.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: createOverviewStory.id,
        to_work_item_id: workspaceShellFeature.id,
        relationship_type: RelationshipType.relates_to,
      },
      {
        product_id: product.id,
        from_work_item_id: signalResearch.id,
        to_work_item_id: signalIngestionFeature.id,
        relationship_type: RelationshipType.informs,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainHistoricalLookupFeature.id,
        to_work_item_id: outcome.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainHistoricalLookupFeature.id,
        to_work_item_id: kpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: signalIngestionFeature.id,
        to_work_item_id: workspaceShellFeature.id,
        relationship_type: RelationshipType.impacts,
      },
    ],
  });

  await prisma.page.create({
    data: {
      title: "Product OS Overview",
      body: "Initial workspace notes for Product OS.",
      product_id: product.id,
      work_item_id: workspaceShellFeature.id,
      author_id: systemUser.id,
    },
  });

  await prisma.signal.create({
    data: {
      title: "First ingestion heartbeat",
      description: "Seeded baseline signal for workspace validation.",
      signal_type: SignalType.deployment_event,
      status: SignalStatus.triaged,
      severity: "medium",
      payload: {
        source: "seed",
      },
      product_id: product.id,
      work_item_id: signalIngestionFeature.id,
      reporter_id: systemUser.id,
      routing_note: "Seed baseline signal.",
    },
  });

  await prisma.signal.create({
    data: {
      title: "Check-a-Train historical lookup misses a valid HSP candidate",
      description: "Observed historical lookup falling through to HSP but still returning no match because the valid train was outside the current candidate set.",
      signal_type: SignalType.test_failure,
      status: SignalStatus.new,
      severity: "medium",
      payload: {
        source: "seed",
        product: "Check-a-Train",
        component: "historical-hsp-lookup",
        scenario: "candidate-coverage-gap",
        lookupPath: "hsp-fallback",
        result: "no-match",
        expectedResult: "historical-candidate-found",
      },
      product_id: product.id,
      work_item_id: checkATrainCoverageBug.id,
      reporter_id: systemUser.id,
      routing_note: "Seeded historical candidate coverage gap for the active Check-a-Train Feature.",
    },
  });

  await prisma.comment.create({
    data: {
      body: "Seeded baseline comment for overview metrics.",
      product_id: product.id,
      author_id: systemUser.id,
    },
  });

  console.log("Seed complete: Product OS workspace initialized.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
