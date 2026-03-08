import { Prisma, PrismaClient, SignalStatus, SignalType, WorkItemStatus, WorkItemType } from "@prisma/client";
import { resolveSignalTaxonomy } from "@/lib/signals";

const ACTIVE_WORK_ITEM_STATUSES: WorkItemStatus[] = [
  WorkItemStatus.new,
  WorkItemStatus.ready,
  WorkItemStatus.in_progress,
  WorkItemStatus.blocked,
];

type IngestSignalInput = {
  productId: string;
  title: string;
  description?: string | null;
  signalType: SignalType;
  severity?: string | null;
  status?: SignalStatus;
  occurredAt?: Date | null;
  linkedWorkItemId?: string | null;
  payload?: Prisma.InputJsonValue;
};

type IngestSignalResult = {
  signalId: string;
  createdFollowUp: boolean;
  followUpWorkItemId: string | null;
  routingNote: string;
};

type KpiChangePayload = {
  kpiTitle: string;
  newValue: number;
};

type RoutedWorkItemMatch = {
  workItemId: string;
  created: boolean;
  routingNote: string;
};

function isHighSeverity(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return ["high", "critical", "sev1", "sev2", "p0", "p1"].includes(normalized);
}

function workItemDescription(signal: IngestSignalInput): string {
  const lines = [`Signal type: ${signal.signalType}`];

  if (signal.severity) {
    lines.push(`Severity: ${signal.severity}`);
  }

  if (signal.description) {
    lines.push("", signal.description);
  }

  return lines.join("\n");
}

function asObject(value: Prisma.InputJsonValue | Prisma.JsonObject | null | undefined): Prisma.JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Prisma.JsonObject;
}

function extractKpiChangePayload(payload: Prisma.InputJsonValue | undefined): KpiChangePayload | null {
  const top = asObject(payload);
  const raw = asObject(top?.raw as Prisma.InputJsonValue | undefined);
  const candidate = raw ?? top;

  if (!candidate) {
    return null;
  }

  const kpiTitleValue = candidate.kpiTitle;
  const newValueValue = candidate.newValue;

  if (typeof kpiTitleValue !== "string" || kpiTitleValue.trim().length === 0) {
    return null;
  }

  const parsedValue =
    typeof newValueValue === "number"
      ? newValueValue
      : typeof newValueValue === "string"
        ? Number(newValueValue)
        : Number.NaN;

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return {
    kpiTitle: kpiTitleValue.trim(),
    newValue: parsedValue,
  };
}

function isExternalSignalPayload(payload: Prisma.InputJsonValue | undefined): boolean {
  const top = asObject(payload);
  const externalSignal = asObject(top?.externalSignal as Prisma.InputJsonValue | undefined);
  return externalSignal !== null;
}

function extractExternalSignalName(payload: Prisma.InputJsonValue | undefined): string | null {
  const top = asObject(payload);
  const externalSignal = asObject(top?.externalSignal as Prisma.InputJsonValue | undefined);
  const signalName = externalSignal?.signalName;
  return typeof signalName === "string" && signalName.trim().length > 0 ? signalName.trim() : null;
}

async function findActiveMatchingWorkItem(
  prisma: PrismaClient,
  productId: string,
  type: WorkItemType,
  title: string,
) {
  return prisma.workItem.findFirst({
    where: {
      product_id: productId,
      type,
      title,
      status: { in: ACTIVE_WORK_ITEM_STATUSES },
    },
    orderBy: { updated_at: "desc" },
    select: { id: true },
  });
}

async function createWorkItemFromSignal(
  prisma: PrismaClient,
  input: IngestSignalInput,
  type: WorkItemType,
  title: string,
) {
  return prisma.workItem.create({
    data: {
      product_id: input.productId,
      type,
      status: WorkItemStatus.new,
      title,
      description: workItemDescription(input),
    },
    select: { id: true },
  });
}

async function findOrCreateRoutedWorkItem(
  prisma: PrismaClient,
  input: IngestSignalInput,
  type: WorkItemType,
  title: string,
  reuseNote: string,
  createNote: string,
): Promise<RoutedWorkItemMatch> {
  const existingWorkItem = await findActiveMatchingWorkItem(prisma, input.productId, type, title);

  if (existingWorkItem) {
    return {
      workItemId: existingWorkItem.id,
      created: false,
      routingNote: reuseNote,
    };
  }

  const createdWorkItem = await createWorkItemFromSignal(prisma, input, type, title);

  return {
    workItemId: createdWorkItem.id,
    created: true,
    routingNote: createNote,
  };
}

export async function ingestSignal(prisma: PrismaClient, input: IngestSignalInput): Promise<IngestSignalResult> {
  let linkedWorkItemId = input.linkedWorkItemId ?? null;
  let createdFollowUp = false;
  let routingNote = "No routing rule matched.";
  const routingNotes: string[] = [];
  const isExternalSignal = isExternalSignalPayload(input.payload);
  const externalSignalName = extractExternalSignalName(input.payload);
  const taxonomy = resolveSignalTaxonomy(input.signalType, externalSignalName);

  if (input.signalType === "test_failure") {
    const bugTitle = `Investigate test failure: ${input.title}`;
    const bugMatch = await findOrCreateRoutedWorkItem(
      prisma,
      input,
      WorkItemType.bug,
      bugTitle,
      "Linked to existing active bug WorkItem.",
      "Created new bug WorkItem from test failure signal.",
    );

    linkedWorkItemId = bugMatch.workItemId;
    createdFollowUp = bugMatch.created;
    routingNote = bugMatch.routingNote;
  }

  if (input.signalType === "incident_alert") {
    const incidentMatch = await findOrCreateRoutedWorkItem(
      prisma,
      input,
      WorkItemType.incident,
      `Incident alert: ${input.title}`,
      "Linked to existing active incident WorkItem.",
      isExternalSignal ? "Created new incident WorkItem from external signal." : "Created new incident WorkItem from incident alert signal.",
    );

    linkedWorkItemId = incidentMatch.workItemId;
    createdFollowUp = incidentMatch.created;
    routingNote = incidentMatch.routingNote;
  }

  if (input.signalType === "anomaly" && isHighSeverity(input.severity)) {
    const anomalyMatch = await findOrCreateRoutedWorkItem(
      prisma,
      input,
      WorkItemType.incident,
      `Investigate anomaly: ${input.title}`,
      "Linked to existing active investigation WorkItem.",
      isExternalSignal ? "Created new investigation WorkItem from external signal." : "Created new investigation WorkItem from anomaly signal.",
    );

    linkedWorkItemId = anomalyMatch.workItemId;
    createdFollowUp = anomalyMatch.created;
    routingNotes.push(anomalyMatch.routingNote);
  }

  if (input.signalType === "kpi_change" && isHighSeverity(input.severity)) {
    const researchMatch = await findOrCreateRoutedWorkItem(
      prisma,
      input,
      WorkItemType.research,
      `Investigate KPI change: ${input.title}`,
      "Linked to existing active KPI investigation WorkItem.",
      "Created new KPI investigation WorkItem from high-severity KPI change signal.",
    );

    linkedWorkItemId = researchMatch.workItemId;
    createdFollowUp = researchMatch.created;
    routingNotes.push(researchMatch.routingNote);
  }

  if (input.signalType === "kpi_change") {
    const kpiPayload = extractKpiChangePayload(input.payload);

    if (kpiPayload) {
      const kpiWorkItem = await prisma.workItem.findFirst({
        where: {
          product_id: input.productId,
          type: WorkItemType.kpi,
          title: kpiPayload.kpiTitle,
        },
        select: { id: true },
      });

      if (kpiWorkItem) {
        await prisma.workItem.update({
          where: { id: kpiWorkItem.id },
          data: {
            current_value: kpiPayload.newValue,
            last_updated_at: new Date(),
          },
        });

        if (!createdFollowUp) {
          linkedWorkItemId = kpiWorkItem.id;
        }
        routingNotes.push(`Updated KPI "${kpiPayload.kpiTitle}" current value to ${kpiPayload.newValue}.`);
      } else {
        routingNotes.push(`No matching KPI WorkItem found for "${kpiPayload.kpiTitle}".`);
      }
    } else {
      routingNotes.push("KPI change payload missing required kpiTitle/newValue fields.");
    }
  }

  if (input.signalType === "delivery_risk") {
    const storyMatch = await findOrCreateRoutedWorkItem(
      prisma,
      input,
      WorkItemType.story,
      `Address delivery risk: ${input.title}`,
      "Linked to existing active delivery risk WorkItem.",
      "Created new delivery risk WorkItem from signal.",
    );

    linkedWorkItemId = storyMatch.workItemId;
    createdFollowUp = storyMatch.created;
    routingNotes.push(storyMatch.routingNote);
  }

  if (input.signalType === "usage_pattern" && isHighSeverity(input.severity)) {
    const researchMatch = await findOrCreateRoutedWorkItem(
      prisma,
      input,
      WorkItemType.research,
      `Investigate usage pattern: ${input.title}`,
      "Linked to existing active usage investigation WorkItem.",
      isExternalSignal ? "Created new investigation WorkItem from external signal." : "Created new usage investigation WorkItem from signal.",
    );

    linkedWorkItemId = researchMatch.workItemId;
    createdFollowUp = researchMatch.created;
    routingNotes.push(researchMatch.routingNote);
  }

  if (routingNotes.length > 0) {
    routingNote = routingNotes.join(" ");
  }

  const status = input.status ?? (createdFollowUp ? SignalStatus.actioned : SignalStatus.new);

  const signal = await prisma.signal.create({
    data: {
      product_id: input.productId,
      title: input.title,
      description: input.description ?? null,
      signal_type: input.signalType,
      signal_family: taxonomy.family,
      signal_category: taxonomy.category,
      status,
      severity: input.severity ?? null,
      payload: input.payload,
      work_item_id: linkedWorkItemId,
      created_follow_up: createdFollowUp,
      routing_note: routingNote,
      created_at: input.occurredAt ?? undefined,
    },
    select: { id: true },
  });

  return {
    signalId: signal.id,
    createdFollowUp,
    followUpWorkItemId: linkedWorkItemId,
    routingNote,
  };
}
