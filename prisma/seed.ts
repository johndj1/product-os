import {
  EntityLinkType,
  EntityType,
  PrismaClient,
  RelationshipType,
  SignalCategory,
  SignalFamily,
  SignalStatus,
  SignalType,
  UserType,
  WorkItemStatus,
  WorkItemType,
} from "@prisma/client";
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

async function seedProductOS(systemUserId: string) {
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
    createdBy: systemUserId,
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
    createdBy: systemUserId,
  });

  const coreGraphCapability = await createWorkItem({
    title: "Core Product Graph",
    type: WorkItemType.capability,
    status: WorkItemStatus.in_progress,
    productId: product.id,
    createdBy: systemUserId,
  });

  const canonicalDomainFeature = await createWorkItem({
    title: "Canonical domain model",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    parentId: coreGraphCapability.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const defineEntitiesStory = await createWorkItem({
    title: "Define core entities",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    parentId: canonicalDomainFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  await createWorkItem({
    title: "Implement Product, WorkItem, Page, Comment, User, and Signal schema",
    type: WorkItemType.task,
    status: WorkItemStatus.done,
    parentId: defineEntitiesStory.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const enforceHierarchyStory = await createWorkItem({
    title: "Enforce golden-thread hierarchy",
    type: WorkItemType.story,
    status: WorkItemStatus.in_progress,
    parentId: canonicalDomainFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  await createWorkItem({
    title: "Implement hierarchy guardrails for allowed parent-child types",
    type: WorkItemType.task,
    status: WorkItemStatus.in_progress,
    parentId: enforceHierarchyStory.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const workspaceCapability = await createWorkItem({
    title: "Product workspace",
    type: WorkItemType.capability,
    status: WorkItemStatus.in_progress,
    productId: product.id,
    createdBy: systemUserId,
  });

  const workspaceShellFeature = await createWorkItem({
    title: "Workspace shell",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    parentId: workspaceCapability.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const documentationFeature = await createWorkItem({
    title: "Documentation and enablement",
    type: WorkItemType.feature,
    status: WorkItemStatus.ready,
    description: "Keep Product OS usable as the working system for seeded products by maintaining practical how-to, glossary, and operating documentation.",
    parentId: workspaceCapability.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const productHowToGuides = await createWorkItem({
    title: "Create product how-to guides",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    parentId: documentationFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const productGlossary = await createWorkItem({
    title: "Define glossary of product and domain terms",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    parentId: documentationFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const architectureAndOperatingNotes = await createWorkItem({
    title: "Create architecture and operating notes",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    parentId: documentationFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const addProductOsHowToContent = await createWorkItem({
    title: "Add how-to content for using Product OS",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description: "Document the minimum workflow for reviewing a Product, checking KPIs, and updating WorkItems in the seeded workspace.",
    parentId: productHowToGuides.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const addProductOsGlossaryEntries = await createWorkItem({
    title: "Add glossary entries for Product OS concepts",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description: "Capture the canonical meaning of Product, WorkItem, Relationship, Signal, KPI, Decision, and EntityLink for day-to-day usage.",
    parentId: productGlossary.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const addProductOsOperatingNotes = await createWorkItem({
    title: "Add Product OS operating notes for seeded products",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description: "Explain how Product OS should be used to manage live seeded products without importing a large historical backlog.",
    parentId: architectureAndOperatingNotes.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const createOverviewStory = await createWorkItem({
    title: "Create Product overview page",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    acceptanceCriteria:
      "- Overview route loads Product context\n- KPI summary and recent activity are visible\n- Golden-thread view renders without errors",
    parentId: workspaceShellFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  await createWorkItem({
    title: "Render golden-thread tree view",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    acceptanceCriteria:
      "- Parent-child hierarchy is rendered in order\n- WorkItem type and status are visible per node\n- Empty state is shown when no WorkItems exist",
    parentId: workspaceShellFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const automationCapability = await createWorkItem({
    title: "Automation foundation",
    type: WorkItemType.capability,
    status: WorkItemStatus.ready,
    productId: product.id,
    createdBy: systemUserId,
  });

  const signalIngestionFeature = await createWorkItem({
    title: "Signal ingestion foundation",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    acceptanceCriteria:
      "- Signals can be ingested via API and UI flow\n- Deterministic routing note is recorded on signal\n- Follow-up WorkItems are created for matching rules",
    parentId: automationCapability.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const signalResearch = await createWorkItem({
    title: "Investigate signal routing quality",
    type: WorkItemType.research,
    status: WorkItemStatus.ready,
    productId: product.id,
    createdBy: systemUserId,
  });

  const routingDecision = await createWorkItem({
    title: "Adopt generic cross-entity links",
    type: WorkItemType.decision,
    status: WorkItemStatus.ready,
    description: "Introduce a simple, additive link model for Product, WorkItem, Signal, and Page connections.",
    acceptanceCriteria:
      "- EntityLink schema exists\n- Same-Product validation is enforced\n- Relevant Product and WorkItem views show cross-entity context",
    productId: product.id,
    createdBy: systemUserId,
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
        from_work_item_id: documentationFeature.id,
        to_work_item_id: workspaceShellFeature.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: addProductOsOperatingNotes.id,
        to_work_item_id: signalIngestionFeature.id,
        relationship_type: RelationshipType.informs,
      },
      {
        product_id: product.id,
        from_work_item_id: signalResearch.id,
        to_work_item_id: signalIngestionFeature.id,
        relationship_type: RelationshipType.informs,
      },
      {
        product_id: product.id,
        from_work_item_id: signalIngestionFeature.id,
        to_work_item_id: workspaceShellFeature.id,
        relationship_type: RelationshipType.impacts,
      },
    ],
  });

  const overviewPage = await prisma.page.create({
    data: {
      title: "Product OS Overview",
      body: "Initial workspace notes for Product OS.",
      product_id: product.id,
      work_item_id: workspaceShellFeature.id,
      author_id: systemUserId,
    },
  });

  const operatorGuidePage = await prisma.page.create({
    data: {
      title: "Product OS operator guide",
      body: "How to use Product OS to review a Product, inspect WorkItems, trace Relationships, and maintain the graph as current operating context.",
      product_id: product.id,
      work_item_id: addProductOsHowToContent.id,
      author_id: systemUserId,
    },
  });

  const conceptGlossaryPage = await prisma.page.create({
    data: {
      title: "Product OS concept glossary",
      body: "Working definitions for Product, WorkItem, Relationship, Signal, KPI, Decision, and EntityLink used throughout the seeded workspace.",
      product_id: product.id,
      work_item_id: addProductOsGlossaryEntries.id,
      author_id: systemUserId,
    },
  });

  const operatingNotesPage = await prisma.page.create({
    data: {
      title: "Product OS operating notes",
      body: "Practical notes for running Product OS with seeded pilot products, including what stays in the graph versus what stays outside the MVP.",
      product_id: product.id,
      work_item_id: addProductOsOperatingNotes.id,
      author_id: systemUserId,
    },
  });

  const ingestionHeartbeatSignal = await prisma.signal.create({
    data: {
      title: "First ingestion heartbeat",
      description: "Seeded baseline signal for workspace validation.",
      signal_type: SignalType.deployment_event,
      signal_family: SignalFamily.product_event,
      signal_category: SignalCategory.operational,
      status: SignalStatus.triaged,
      severity: "medium",
      payload: {
        source: "seed",
      },
      product_id: product.id,
      work_item_id: signalIngestionFeature.id,
      reporter_id: systemUserId,
      routing_note: "Seed baseline signal.",
    },
  });

  await prisma.entityLink.createMany({
    data: [
      {
        product_id: product.id,
        from_entity_type: EntityType.product,
        from_entity_id: product.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: kpi.id,
        relationship_type: EntityLinkType.measures,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.signal,
        from_entity_id: ingestionHeartbeatSignal.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: kpi.id,
        relationship_type: EntityLinkType.impacts,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.signal,
        from_entity_id: ingestionHeartbeatSignal.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: signalIngestionFeature.id,
        relationship_type: EntityLinkType.triggered_by,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: overviewPage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: workspaceShellFeature.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: operatorGuidePage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: addProductOsHowToContent.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: conceptGlossaryPage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: addProductOsGlossaryEntries.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: operatingNotesPage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: addProductOsOperatingNotes.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: routingDecision.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: canonicalDomainFeature.id,
        relationship_type: EntityLinkType.informs,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: routingDecision.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: kpi.id,
        relationship_type: EntityLinkType.informs,
      },
    ],
  });

  await prisma.comment.create({
    data: {
      body: "Seeded baseline comment for overview metrics.",
      product_id: product.id,
      author_id: systemUserId,
    },
  });
}

async function seedCheckATrain(systemUserId: string) {
  const product = await prisma.product.create({
    data: {
      name: "Check-a-Train",
      slug: "check-a-train",
      description: "Delay Repay assistant that helps users identify eligible delayed rail journeys and start the right claim flow quickly.",
      definition_of_done:
        "- Delay eligibility logic is traceable to live running data assumptions\n- KPI impact is clear for shipped MVP changes\n- Claim-start flow changes are documented",
    },
  });

  const outcome = await createWorkItem({
    title: "Make Delay Repay assistance fast enough that users start claims immediately after disruption",
    type: WorkItemType.outcome,
    status: WorkItemStatus.in_progress,
    productId: product.id,
    createdBy: systemUserId,
  });

  const claimConversionRateKpi = await createWorkItem({
    title: "Claim conversion rate",
    type: WorkItemType.kpi,
    status: WorkItemStatus.ready,
    currentValue: 18,
    targetValue: 40,
    unit: "%",
    lastUpdatedAt: new Date(),
    parentId: outcome.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const delayDetectionAccuracyKpi = await createWorkItem({
    title: "Delay detection accuracy",
    type: WorkItemType.kpi,
    status: WorkItemStatus.ready,
    currentValue: 82,
    targetValue: 95,
    unit: "%",
    lastUpdatedAt: new Date(),
    parentId: outcome.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const timeToClaimStartKpi = await createWorkItem({
    title: "Time from delay to claim start",
    type: WorkItemType.kpi,
    status: WorkItemStatus.ready,
    currentValue: 120,
    targetValue: 30,
    unit: "seconds",
    lastUpdatedAt: new Date(),
    parentId: outcome.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const automaticDelayEligibilityDetection = await createWorkItem({
    title: "Automatic delay eligibility detection",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    description: "Surface likely Delay Repay eligibility from live train running data before the user has to interpret station boards manually.",
    productId: product.id,
    createdBy: systemUserId,
  });

  const operatorClaimHandoff = await createWorkItem({
    title: "Operator claim handoff",
    type: WorkItemType.feature,
    status: WorkItemStatus.ready,
    description: "Guide the user from detected delay into the correct operator claim path with the minimum next-step friction.",
    productId: product.id,
    createdBy: systemUserId,
  });

  const darwinIntegrationAndProcessing = await createWorkItem({
    title: "Darwin API integration and service processing",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    description: "Turn Darwin running data into reliable service state that Check-a-Train can use for delay eligibility and service explanation.",
    acceptanceCriteria:
      "- Darwin calls required for live service lookup are defined\n- Service status and timing data are normalised into stable domain shapes\n- Failure and partial data paths are handled explicitly",
    productId: product.id,
    createdBy: systemUserId,
  });

  const retrieveLiveRunningData = await createWorkItem({
    title: "Retrieve live running data from Darwin",
    type: WorkItemType.story,
    status: WorkItemStatus.in_progress,
    parentId: darwinIntegrationAndProcessing.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const normaliseDarwinServiceData = await createWorkItem({
    title: "Normalise Darwin service data into Product OS-friendly domain shapes",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    parentId: darwinIntegrationAndProcessing.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const fetchDarwinLiveRunningData = await createWorkItem({
    title: "Fetch Darwin live running data",
    type: WorkItemType.story,
    status: WorkItemStatus.in_progress,
    parentId: automaticDelayEligibilityDetection.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const defineDarwinRequestResponseHandling = await createWorkItem({
    title: "Define Darwin request and response handling",
    type: WorkItemType.task,
    status: WorkItemStatus.in_progress,
    description: "Specify the lookup inputs, expected service payloads, and the minimum metadata Check-a-Train needs from Darwin responses.",
    parentId: retrieveLiveRunningData.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const handleDarwinApiFailureCases = await createWorkItem({
    title: "Handle API failure and partial data cases",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description: "Cover upstream failures, missing calling points, and degraded timing fields without presenting false confidence to the user.",
    parentId: retrieveLiveRunningData.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const darwinHspIntegration = await createWorkItem({
    title: "Implement Darwin / HSP integration",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    parentId: fetchDarwinLiveRunningData.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const parseDarwinServiceTiming = await createWorkItem({
    title: "Parse service status, calling points, and timing fields",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description: "Map Darwin service status, station calling points, scheduled times, and expected times into stable internal fields.",
    parentId: normaliseDarwinServiceData.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const calculateDelayEligibility = await createWorkItem({
    title: "Calculate delay eligibility from live running data",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    parentId: fetchDarwinLiveRunningData.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const providerFailureHandlingAndServiceResilience = await createWorkItem({
    title: "Provider failure handling and service resilience",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    description:
      "Handle Darwin provider failures in a way that preserves user trust, keeps failure signals observable, and only escalates into investigation work when failures become repeated enough to matter.",
    acceptanceCriteria:
      "- A single provider failure is observable without creating immediate backlog noise\n- Live-data lookup failures show a graceful retry path to the user\n- Structured provider failure signals can be traced in Product OS\n- Repeated provider failures can be escalated into investigation work using a defined threshold",
    productId: product.id,
    createdBy: systemUserId,
  });

  const detectAndClassifyProviderCallFailures = await createWorkItem({
    title: "Detect and classify provider call failures",
    type: WorkItemType.story,
    status: WorkItemStatus.in_progress,
    parentId: providerFailureHandlingAndServiceResilience.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const presentGracefulRetryMessaging = await createWorkItem({
    title: "Present graceful retry messaging to users",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    parentId: providerFailureHandlingAndServiceResilience.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const emitProviderFailureSignals = await createWorkItem({
    title: "Emit provider failure signals to Product OS",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    parentId: providerFailureHandlingAndServiceResilience.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const escalateRepeatedProviderFailures = await createWorkItem({
    title: "Escalate repeated provider failures into investigation work",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    parentId: providerFailureHandlingAndServiceResilience.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const classifyDarwinFailureTypesAndSeverity = await createWorkItem({
    title: "Classify Darwin failure types and severity",
    type: WorkItemType.task,
    status: WorkItemStatus.in_progress,
    description:
      "Differentiate retryable upstream timeouts, unavailable services, malformed payloads, and partial-data responses so Check-a-Train can react proportionately.",
    parentId: detectAndClassifyProviderCallFailures.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const addUserFacingRetryErrorState = await createWorkItem({
    title: "Add user-facing retry/error state for live data failures",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description:
      "Show a clear retry path when live running data cannot be fetched, while avoiding misleading eligibility claims when provider confidence is low.",
    parentId: presentGracefulRetryMessaging.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const emitDarwinApiErrorSignal = await createWorkItem({
    title: "Emit darwin_api_error with structured metadata",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description:
      "Capture provider, failure class, retryability, endpoint context, and rolling counts so repeated Darwin failures can be reviewed in Product OS.",
    parentId: emitProviderFailureSignals.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const defineRepeatedProviderFailureThreshold = await createWorkItem({
    title: "Define threshold for repeated provider failure escalation",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description:
      "Set a practical threshold for investigation work so isolated provider failures remain visible as Signals, while repeated failures create actionable operating work.",
    parentId: escalateRepeatedProviderFailures.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const createInvestigationWorkItemOnThresholdExceeded = await createWorkItem({
    title: "Create or link investigation WorkItem when failure threshold is exceeded",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description:
      "When repeated provider failures cross the agreed threshold, route the issue into a single investigation WorkItem rather than generating new backlog for each failing call.",
    parentId: escalateRepeatedProviderFailures.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const investigateRepeatedDarwinFailures = await createWorkItem({
    title: "Investigate repeated Darwin provider failures",
    type: WorkItemType.research,
    status: WorkItemStatus.ready,
    description:
      "Review repeated darwin_api_error patterns, confirm whether the issue is upstream or in request handling, and decide whether resilience or messaging changes should be prioritised.",
    productId: product.id,
    createdBy: systemUserId,
  });

  const documentationFeature = await createWorkItem({
    title: "Product documentation and enablement",
    type: WorkItemType.feature,
    status: WorkItemStatus.ready,
    description: "Document how Check-a-Train is meant to be operated, explained, and maintained inside Product OS without creating a large speculative backlog.",
    acceptanceCriteria:
      "- Practical how-to and glossary content exists for Check-a-Train and Product OS usage\n- Product-level pages are linked to the relevant WorkItems\n- Architecture and operating notes cover current MVP assumptions",
    productId: product.id,
    createdBy: systemUserId,
  });

  const createCheckATrainHowToGuides = await createWorkItem({
    title: "Create product how-to guides",
    type: WorkItemType.story,
    status: WorkItemStatus.in_progress,
    parentId: documentationFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const defineCheckATrainGlossary = await createWorkItem({
    title: "Define glossary of product and domain terms",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    parentId: documentationFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const createCheckATrainOperatingNotes = await createWorkItem({
    title: "Create architecture and operating notes",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    parentId: documentationFeature.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const addCheckATrainHowToContent = await createWorkItem({
    title: "Add how-to content for using Check-a-Train",
    type: WorkItemType.task,
    status: WorkItemStatus.in_progress,
    description: "Capture the user-facing flow for checking a delayed service, understanding likely eligibility, and starting the right operator claim path.",
    parentId: createCheckATrainHowToGuides.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const addRailGlossaryEntries = await createWorkItem({
    title: "Add glossary entries for rail delay and claim concepts",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description: "Define terms such as Delay Repay, planned versus actual time, calling points, and likely eligibility so the product language stays consistent.",
    parentId: defineCheckATrainGlossary.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const addCheckATrainOperatingNotes = await createWorkItem({
    title: "Add architecture notes for Darwin-backed delay detection",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    description: "Record the current service-processing assumptions, data confidence boundaries, and how claim-handoff logic depends on Darwin-derived fields.",
    parentId: createCheckATrainOperatingNotes.id,
    productId: product.id,
    createdBy: systemUserId,
  });

  const buildServiceCardExpansion = await createWorkItem({
    title: "Build service card expansion for more detail",
    type: WorkItemType.task,
    status: WorkItemStatus.new,
    description: "Show the train service breakdown that explains why a journey looks Delay Repay eligible before the user leaves for a claim flow.",
    productId: product.id,
    createdBy: systemUserId,
  });

  const delayRepayFocusDecision = await createWorkItem({
    title: "MVP focuses on Delay Repay assistance, not journey planning",
    type: WorkItemType.decision,
    status: WorkItemStatus.done,
    description: "Keep the first serious pilot tightly scoped around identifying eligible disrupted journeys and routing users to the right claim start.",
    productId: product.id,
    createdBy: systemUserId,
  });

  const liveRunningDataDecision = await createWorkItem({
    title: "Delay eligibility is derived from live running data before any claim handoff",
    type: WorkItemType.decision,
    status: WorkItemStatus.done,
    description: "Eligibility confidence should come from running data first so the claim handoff reflects what actually happened to the service.",
    productId: product.id,
    createdBy: systemUserId,
  });

  await prisma.relationship.createMany({
    data: [
      {
        product_id: product.id,
        from_work_item_id: automaticDelayEligibilityDetection.id,
        to_work_item_id: delayDetectionAccuracyKpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: darwinIntegrationAndProcessing.id,
        to_work_item_id: delayDetectionAccuracyKpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: providerFailureHandlingAndServiceResilience.id,
        to_work_item_id: delayDetectionAccuracyKpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: providerFailureHandlingAndServiceResilience.id,
        to_work_item_id: timeToClaimStartKpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: operatorClaimHandoff.id,
        to_work_item_id: claimConversionRateKpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: operatorClaimHandoff.id,
        to_work_item_id: timeToClaimStartKpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: darwinIntegrationAndProcessing.id,
        to_work_item_id: automaticDelayEligibilityDetection.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: providerFailureHandlingAndServiceResilience.id,
        to_work_item_id: darwinIntegrationAndProcessing.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: defineDarwinRequestResponseHandling.id,
        to_work_item_id: darwinHspIntegration.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: parseDarwinServiceTiming.id,
        to_work_item_id: calculateDelayEligibility.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: handleDarwinApiFailureCases.id,
        to_work_item_id: operatorClaimHandoff.id,
        relationship_type: RelationshipType.informs,
      },
      {
        product_id: product.id,
        from_work_item_id: classifyDarwinFailureTypesAndSeverity.id,
        to_work_item_id: handleDarwinApiFailureCases.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: addUserFacingRetryErrorState.id,
        to_work_item_id: operatorClaimHandoff.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: emitDarwinApiErrorSignal.id,
        to_work_item_id: investigateRepeatedDarwinFailures.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: defineRepeatedProviderFailureThreshold.id,
        to_work_item_id: investigateRepeatedDarwinFailures.id,
        relationship_type: RelationshipType.informs,
      },
      {
        product_id: product.id,
        from_work_item_id: investigateRepeatedDarwinFailures.id,
        to_work_item_id: providerFailureHandlingAndServiceResilience.id,
        relationship_type: RelationshipType.informs,
      },
      {
        product_id: product.id,
        from_work_item_id: darwinHspIntegration.id,
        to_work_item_id: calculateDelayEligibility.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: buildServiceCardExpansion.id,
        to_work_item_id: operatorClaimHandoff.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: liveRunningDataDecision.id,
        to_work_item_id: automaticDelayEligibilityDetection.id,
        relationship_type: RelationshipType.informs,
      },
      {
        product_id: product.id,
        from_work_item_id: documentationFeature.id,
        to_work_item_id: operatorClaimHandoff.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: addCheckATrainOperatingNotes.id,
        to_work_item_id: darwinIntegrationAndProcessing.id,
        relationship_type: RelationshipType.informs,
      },
    ],
  });

  const productDefinitionPage = await prisma.page.create({
    data: {
      title: "Check-a-Train Product definition",
      body: "Check-a-Train helps users quickly spot likely Delay Repay eligibility and move into the correct operator claim start without pretending to replace journey planning.",
      product_id: product.id,
      author_id: systemUserId,
    },
  });

  const mvpScopePage = await prisma.page.create({
    data: {
      title: "Check-a-Train MVP scope",
      body: "Initial scope covers live delay detection, clear explanation of likely eligibility, and operator claim handoff. It does not attempt broad journey planning or ticket retail.",
      product_id: product.id,
      work_item_id: operatorClaimHandoff.id,
      author_id: systemUserId,
    },
  });

  const architectureNotesPage = await prisma.page.create({
    data: {
      title: "Check-a-Train architecture notes",
      body: "Architecture assumes live running data informs eligibility logic, with service detail exposed in-app before routing the user onward to an operator claim flow.",
      product_id: product.id,
      work_item_id: automaticDelayEligibilityDetection.id,
      author_id: systemUserId,
    },
  });

  const userHowToPage = await prisma.page.create({
    data: {
      title: "Check-a-Train how to check a delayed journey",
      body: "How to enter a disrupted journey, review the returned service detail, understand likely Delay Repay eligibility, and move into the correct claim start.",
      product_id: product.id,
      work_item_id: addCheckATrainHowToContent.id,
      author_id: systemUserId,
    },
  });

  const railGlossaryPage = await prisma.page.create({
    data: {
      title: "Check-a-Train rail delay and claim glossary",
      body: "Shared definitions for delay, calling points, expected time, actual time, likely eligibility, and operator claim concepts used in the MVP.",
      product_id: product.id,
      work_item_id: addRailGlossaryEntries.id,
      author_id: systemUserId,
    },
  });

  const operatingNotesPage = await prisma.page.create({
    data: {
      title: "Check-a-Train Darwin service processing notes",
      body: "Working notes on how Darwin service data is requested, parsed, and used to explain likely delay eligibility without overstating certainty.",
      product_id: product.id,
      work_item_id: addCheckATrainOperatingNotes.id,
      author_id: systemUserId,
    },
  });

  const providerResilienceNotesPage = await prisma.page.create({
    data: {
      title: "Check-a-Train provider resilience notes",
      body: "Provider failures should be observable in Product OS, handled gracefully in the user journey, and escalated into investigation only when repeated enough to indicate a meaningful operating problem.",
      product_id: product.id,
      work_item_id: providerFailureHandlingAndServiceResilience.id,
      author_id: systemUserId,
    },
  });

  const failureHandlingGuidancePage = await prisma.page.create({
    data: {
      title: "Check-a-Train failure handling and retry guidance",
      body: "When live running data is unavailable, Check-a-Train should explain that live data could not be confirmed, offer an immediate retry, and avoid overstating eligibility until provider confidence returns.",
      product_id: product.id,
      work_item_id: addUserFacingRetryErrorState.id,
      author_id: systemUserId,
    },
  });

  const kpiMovementSignal = await prisma.signal.create({
    data: {
      title: "Claim start latency remains above the MVP threshold",
      description: "Recent pilot checks show users still taking roughly two minutes from delay detection to opening an operator claim start flow.",
      signal_type: SignalType.kpi_change,
      signal_family: SignalFamily.kpi_movement,
      signal_category: SignalCategory.outcome,
      status: SignalStatus.triaged,
      severity: "medium",
      payload: {
        observed_seconds: 120,
        target_seconds: 30,
      },
      product_id: product.id,
      work_item_id: operatorClaimHandoff.id,
      reporter_id: systemUserId,
      routing_note: "Review handoff clarity and service detail before expanding scope.",
    },
  });

  const darwinApiErrorSignal = await prisma.signal.create({
    data: {
      title: "darwin_api_error threshold exceeded for live running lookups",
      description:
        "Repeated Darwin lookup failures crossed the agreed threshold in the current operating window, so the issue should be investigated as a single resilience problem rather than as isolated failures.",
      signal_type: SignalType.anomaly,
      signal_family: SignalFamily.provider_failure,
      signal_category: SignalCategory.reliability,
      status: SignalStatus.triaged,
      severity: "high",
      payload: {
        event_name: "darwin_api_error",
        provider: "Darwin",
        failure_class: "upstream_timeout",
        retryable: true,
        endpoint: "service_details_lookup",
        failures_in_window: 7,
        threshold: 5,
        rolling_window_minutes: 15,
      },
      product_id: product.id,
      work_item_id: investigateRepeatedDarwinFailures.id,
      reporter_id: systemUserId,
      routing_note:
        "Single failures remain observable as Signals; repeated failures above threshold should link to one investigation WorkItem.",
    },
  });

  await prisma.entityLink.createMany({
    data: [
      {
        product_id: product.id,
        from_entity_type: EntityType.product,
        from_entity_id: product.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: claimConversionRateKpi.id,
        relationship_type: EntityLinkType.measures,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.product,
        from_entity_id: product.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: delayDetectionAccuracyKpi.id,
        relationship_type: EntityLinkType.measures,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.product,
        from_entity_id: product.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: timeToClaimStartKpi.id,
        relationship_type: EntityLinkType.measures,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: automaticDelayEligibilityDetection.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: delayDetectionAccuracyKpi.id,
        relationship_type: EntityLinkType.impacts,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: darwinIntegrationAndProcessing.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: delayDetectionAccuracyKpi.id,
        relationship_type: EntityLinkType.impacts,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: providerFailureHandlingAndServiceResilience.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: delayDetectionAccuracyKpi.id,
        relationship_type: EntityLinkType.impacts,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: providerFailureHandlingAndServiceResilience.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: timeToClaimStartKpi.id,
        relationship_type: EntityLinkType.impacts,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: operatorClaimHandoff.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: claimConversionRateKpi.id,
        relationship_type: EntityLinkType.impacts,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: delayRepayFocusDecision.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: operatorClaimHandoff.id,
        relationship_type: EntityLinkType.informs,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: liveRunningDataDecision.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: automaticDelayEligibilityDetection.id,
        relationship_type: EntityLinkType.informs,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: productDefinitionPage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: delayRepayFocusDecision.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: mvpScopePage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: operatorClaimHandoff.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: architectureNotesPage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: automaticDelayEligibilityDetection.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: userHowToPage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: addCheckATrainHowToContent.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: railGlossaryPage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: addRailGlossaryEntries.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: operatingNotesPage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: addCheckATrainOperatingNotes.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: providerResilienceNotesPage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: providerFailureHandlingAndServiceResilience.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.page,
        from_entity_id: failureHandlingGuidancePage.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: addUserFacingRetryErrorState.id,
        relationship_type: EntityLinkType.documents,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.signal,
        from_entity_id: kpiMovementSignal.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: timeToClaimStartKpi.id,
        relationship_type: EntityLinkType.impacts,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.signal,
        from_entity_id: kpiMovementSignal.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: operatorClaimHandoff.id,
        relationship_type: EntityLinkType.triggered_by,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.signal,
        from_entity_id: darwinApiErrorSignal.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: investigateRepeatedDarwinFailures.id,
        relationship_type: EntityLinkType.triggered_by,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.signal,
        from_entity_id: darwinApiErrorSignal.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: delayDetectionAccuracyKpi.id,
        relationship_type: EntityLinkType.impacts,
      },
      {
        product_id: product.id,
        from_entity_type: EntityType.work_item,
        from_entity_id: createInvestigationWorkItemOnThresholdExceeded.id,
        to_entity_type: EntityType.work_item,
        to_entity_id: investigateRepeatedDarwinFailures.id,
        relationship_type: EntityLinkType.creates,
      },
    ],
  });

  await prisma.comment.create({
    data: {
      body: "Seeded pilot product to exercise Product OS against a real product graph without importing a full historical backlog.",
      product_id: product.id,
      author_id: systemUserId,
    },
  });
}

async function main() {
  await prisma.comment.deleteMany();
  await prisma.page.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.entityLink.deleteMany();
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

  await seedProductOS(systemUser.id);
  await seedCheckATrain(systemUser.id);

  console.log("Seed complete: Product OS and Check-a-Train workspaces initialized.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
