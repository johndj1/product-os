import { EntityLinkType, EntityType, PrismaClient, RelationshipType, SignalStatus, SignalType, UserType, WorkItemStatus, WorkItemType } from "@prisma/client";
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

  const ingestionHeartbeatSignal = await prisma.signal.create({
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

  const fetchDarwinLiveRunningData = await createWorkItem({
    title: "Fetch Darwin live running data",
    type: WorkItemType.story,
    status: WorkItemStatus.in_progress,
    parentId: automaticDelayEligibilityDetection.id,
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

  const calculateDelayEligibility = await createWorkItem({
    title: "Calculate delay eligibility from live running data",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    parentId: fetchDarwinLiveRunningData.id,
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

  const kpiMovementSignal = await prisma.signal.create({
    data: {
      title: "Claim start latency remains above the MVP threshold",
      description: "Recent pilot checks show users still taking roughly two minutes from delay detection to opening an operator claim start flow.",
      signal_type: SignalType.kpi_change,
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
