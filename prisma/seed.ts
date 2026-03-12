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
    title: "Investigate HSP timeout and same-day historical lookup performance",
    description:
      "Context / Background\n- Product: Check-a-Train\n- Journey: Claim compensation for a delayed train\n- Journey Step: Check delay details\n- Customer Outcome: User can view accurate delay information for their train\n- Check-a-Train supports Darwin live lookup for current and upcoming journeys and HSP lookup for past-date journeys.\n- The historical path uses HSP serviceMetrics candidate search, HSP serviceDetails RID-based enrichment, first-pass delay or cancellation derivation, Delay Repay eligibility signalling, and operator claim routing.\n- Same-day historical-style searches route to HSP correctly but can fail after about 5 seconds with a timeout.\n- Graceful degradation to metrics-only results is an acceptable temporary MVP mitigation if enrichment is the failing step, but the underlying root cause still needs investigation.\n\nRepro Steps\n1. Run Case A to confirm the historical HSP path can succeed.\n2. Search from CST to SEV on 2026-03-10 at 17:25.\n3. Confirm the lookup uses darwin.hsp and returns a historical result with serviceMetrics and serviceDetails data.\n4. Run Case B to reproduce the same-day performance issue.\n5. Search from TON to SEV on 2026-03-12 at 16:00 with a 30-minute window.\n6. Observe the API and UI response after about 5 seconds.\n\nExpected Result\n- Historical lookups routed to darwin.hsp complete within the allowed timeout budget when matching HSP data exists.\n- Same-day historical-style searches return a valid result, or at minimum a clear degraded result if metrics are available but enrichment fails.\n- The user can still view reliable delay information without the system implying that no service exists when the actual issue is timeout or slow enrichment.\n\nActual Result\n- The same-day historical-style search from TON to SEV on 2026-03-12 at 16:00 fails after about 5 seconds.\n- The failure is reported as timeout behaviour on the HSP path.\n- The API returns 503 and the UI shows: Train running data is taking too long to respond. Please try again.\n\nEvidence / Observations\n- Case A, working historical search:\n  - from: CST\n  - to: SEV\n  - date: 2026-03-10\n  - time: 17:25\n  - result: source darwin.hsp, serviceMetrics succeeded, serviceDetails succeeded, actual departure and arrival returned, status derived as Cancelled\n- Case B, failing same-day historical search:\n  - from: TON\n  - to: SEV\n  - date: 2026-03-12\n  - time: 16:00\n  - window: 30\n  - result: source darwin.hsp, request fails around 5 seconds, failureClass timeout, API returns 503, UI reports train running data taking too long to respond\n- Observed logs include chosenSource darwin.hsp, historical HSP lookup failed, failureClass timeout, and technicalMessage Darwin request timed out.\n- HSP serviceMetrics works successfully via direct curl against the Rail Data gateway.\n- HSP serviceDetails enrichment works successfully for at least some routes and dates.\n- Same-day historical searches appear more brittle than non-same-day past-date searches.\n- Other rail sites can return historical-like results, so this should be investigated rather than assuming HSP slowness is the only explanation.\n\nLikely Investigation Areas\n- HSP latency for certain same-day searches or result shapes.\n- Shared timeout values being too aggressive for HSP-backed lookups.\n- Too many or poorly targeted serviceDetails enrichment calls.\n- Wrong or overly serial enrichment sequencing.\n- Same-day historical searches being inherently slower or differently shaped than earlier past-date searches.\n- Payload or query strategy issues affecting candidate retrieval.\n- Candidate matching or ranking causing unnecessary enrichment work.\n- Missing metrics-first fallback in provider orchestration.\n\nImpact\n- Users checking a recently completed trip cannot reliably confirm whether the train was delayed or cancelled.\n- Delay Repay confidence drops at a high-intent moment because the journey appears to fail rather than degrade gracefully.\n- The current failure mode obscures whether the issue is HSP latency, orchestration, timeout configuration, or enrichment strategy.\n\nEnvironment\n- Check-a-Train historical lookup experience\n- HSP fallback path via darwin.hsp\n- Same-day historical-style search: TON to SEV, 2026-03-12, 16:00, 30-minute window\n- Comparison case: CST to SEV, 2026-03-10, 17:25",
    acceptanceCriteria:
      "- The bug records concrete evidence for one working historical case and one failing same-day historical case\n- Investigation covers timeout configuration, HSP latency, candidate selection, and serviceDetails enrichment behaviour\n- MVP mitigation allows graceful degradation to metrics-only results when appropriate, without closing out root-cause investigation\n- Any follow-on fix preserves the already-working historical HSP path",
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
      title: "Check-a-Train same-day historical HSP lookup timed out after about 5 seconds",
      description:
        "Observed TON to SEV same-day historical lookup routing to darwin.hsp and failing with timeout behaviour, 503 response, and UI degraded-state messaging after about 5 seconds.",
      signal_type: SignalType.test_failure,
      status: SignalStatus.new,
      severity: "medium",
      payload: {
        source: "seed",
        product: "Check-a-Train",
        component: "historical-hsp-lookup",
        scenario: "same-day-timeout-investigation",
        lookupPath: "hsp-fallback",
        journeyTiming: "same-day-past",
        result: "timeout-503-ui-retry-message",
        expectedResult: "historical-result-or-metrics-only-fallback",
      },
      product_id: product.id,
      work_item_id: checkATrainCoverageBug.id,
      reporter_id: systemUser.id,
      routing_note: "Seeded same-day historical HSP timeout investigation beneath the active historical candidate coverage Story.",
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
