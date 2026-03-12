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

  const checkATrainDelayStatusFeature = await createWorkItem({
    title: "Check-a-Train delay status",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    acceptanceCriteria:
      "- Delay status rules are represented in the Product OS work graph\n- Feature delivery work can include both implementation Tasks and defect Bugs\n- Delay calculation issues can be traced from signal to fix",
    parentId: workedExampleCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainDelayStatusStory = await createWorkItem({
    title: "Show accurate delay status for small timetable slips",
    type: WorkItemType.story,
    status: WorkItemStatus.in_progress,
    acceptanceCriteria:
      "- Delay shown to users matches the minute difference between scheduled and expected departure\n- Small delays are rounded or calculated correctly\n- Delivery work under this Story can separate implementation from defect correction",
    parentId: checkATrainDelayStatusFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Review deriveDelayAndStatus rounding for minute-boundary departures",
    type: WorkItemType.task,
    status: WorkItemStatus.in_progress,
    parentId: checkATrainDelayStatusStory.id,
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

  const checkATrainBug = await createWorkItem({
    title: "Delay calculation incorrect for small delays",
    description:
      "Context / Background\n- Check-a-Train shows an incorrect delay value for small slips between scheduled and expected departure.\n- This is defect correction against expected behaviour, not net-new delivery work.\n- Likely source is deriveDelayAndStatus or related delay derivation logic.\n\nRepro Steps\n1. Open a service with scheduled departure 22:02.\n2. Apply live expected departure 22:03.\n3. View the rendered delay status.\n\nExpected Result\n- Displayed delay is 1m.\n\nActual Result\n- Displayed delay is 2m.\n\nSeverity\n- Medium\n\nEnvironment\n- Check-a-Train departures experience\n- Example service state: scheduled 22:02, expected 22:03",
    acceptanceCriteria:
      "- A scheduled departure of 22:02 and expected departure of 22:03 displays 1m delay\n- Delay derivation is correct for other small one-minute slips near minute boundaries\n- Regression coverage exists for deriveDelayAndStatus or the equivalent delay derivation path",
    type: WorkItemType.bug,
    status: WorkItemStatus.ready,
    parentId: checkATrainDelayStatusStory.id,
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
      title: "Check-a-Train delay status shows 2m for a 1m slip",
      description: "Observed service rendered a 2m delay for scheduled 22:02 and expected 22:03. Seeded as the first real Check-a-Train bug.",
      signal_type: SignalType.test_failure,
      status: SignalStatus.new,
      severity: "medium",
      payload: {
        source: "seed",
        product: "Check-a-Train",
        component: "deriveDelayAndStatus",
        scenario: "small-delay-calculation",
        scheduledDeparture: "22:02",
        expectedDeparture: "22:03",
        displayedDelay: "2m",
        expectedDelay: "1m",
      },
      product_id: product.id,
      work_item_id: checkATrainBug.id,
      reporter_id: systemUser.id,
      routing_note: "Seeded first real Check-a-Train bug.",
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
