import { Prisma, PrismaClient, SignalStatus, SignalType, WorkItemStatus, WorkItemType } from "@prisma/client";
import { asObject, extractExternalSignalNameFromPayload, resolveSignalTaxonomy } from "@/lib/signals";
import { evaluateUsagePattern, PROVIDER_FAILURE_INVESTIGATION_TITLE } from "@/lib/usage-patterns";

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

type RoutedWorkItemCandidate = {
  type: WorkItemType;
  title: string;
  reuseNote: string;
  createNote: string;
  description?: string;
  summaryNote?: string;
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

function extractKpiChangePayload(payload: Prisma.InputJsonValue | undefined): KpiChangePayload | null {
  const top = asObject(payload);
  const raw = asObject(top?.raw);
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
  const externalSignal = asObject(top?.externalSignal);
  return externalSignal !== null;
}

function extractExternalSignalName(payload: Prisma.InputJsonValue | undefined): string | null {
  return extractExternalSignalNameFromPayload(payload);
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
  description?: string,
) {
  return prisma.workItem.create({
    data: {
      product_id: input.productId,
      type,
      status: WorkItemStatus.new,
      title,
      description: description ?? workItemDescription(input),
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
  description?: string,
): Promise<RoutedWorkItemMatch> {
  const existingWorkItem = await findActiveMatchingWorkItem(prisma, input.productId, type, title);

  if (existingWorkItem) {
    return {
      workItemId: existingWorkItem.id,
      created: false,
      routingNote: reuseNote,
    };
  }

  const createdWorkItem = await createWorkItemFromSignal(prisma, input, type, title, description);

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
  let routedWorkItemCandidate: RoutedWorkItemCandidate | null = null;

  if (input.signalType === "test_failure") {
    routedWorkItemCandidate = {
      type: WorkItemType.bug,
      title: `Investigate test failure: ${input.title}`,
      reuseNote: "Linked to existing active bug WorkItem via single-signal routing.",
      createNote: "Single-signal routing created a new bug WorkItem from the test failure signal.",
    };
  }

  if (input.signalType === "incident_alert") {
    routedWorkItemCandidate = {
      type: WorkItemType.incident,
      title: `Incident alert: ${input.title}`,
      reuseNote: "Linked to existing active incident WorkItem via single-signal routing.",
      createNote: isExternalSignal
        ? "Single-signal routing created a new incident WorkItem from the external signal."
        : "Single-signal routing created a new incident WorkItem from the incident alert signal.",
    };
  }

  if (input.signalType === "anomaly" && isHighSeverity(input.severity)) {
    routedWorkItemCandidate =
      externalSignalName === "darwin_api_error"
        ? {
            type: WorkItemType.research,
            title: PROVIDER_FAILURE_INVESTIGATION_TITLE,
            reuseNote: "Linked to existing active provider-failure investigation WorkItem via single-signal routing.",
            createNote: "Single-signal routing created a new provider-failure investigation WorkItem for Darwin API errors.",
            description:
              "Created from single-signal provider-failure routing for darwin_api_error.\nSignal family: provider_failure.\nUse this WorkItem for the active Darwin provider investigation until resolved.",
          }
        : {
            type: WorkItemType.incident,
            title: `Investigate anomaly: ${input.title}`,
            reuseNote: "Linked to existing active investigation WorkItem via single-signal routing.",
            createNote: isExternalSignal
              ? "Single-signal routing created a new investigation WorkItem from the external signal."
              : "Single-signal routing created a new investigation WorkItem from the anomaly signal.",
          };
  }

  if (input.signalType === "kpi_change" && isHighSeverity(input.severity)) {
    const researchMatch = await findOrCreateRoutedWorkItem(
      prisma,
      input,
      WorkItemType.research,
      `Investigate KPI change: ${input.title}`,
      "Linked to existing active KPI investigation WorkItem via single-signal routing.",
      "Single-signal routing created a new KPI investigation WorkItem from the high-severity KPI change signal.",
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
    routedWorkItemCandidate = {
      type: WorkItemType.story,
      title: `Address delivery risk: ${input.title}`,
      reuseNote: "Linked to existing active delivery risk WorkItem via single-signal routing.",
      createNote: "Single-signal routing created a new delivery risk WorkItem from the signal.",
    };
  }

  if (input.signalType === "usage_pattern" && isHighSeverity(input.severity)) {
    routedWorkItemCandidate = {
      type: WorkItemType.research,
      title: `Investigate usage pattern: ${input.title}`,
      reuseNote: "Linked to existing active usage investigation WorkItem via single-signal routing.",
      createNote: isExternalSignal
        ? "Single-signal routing created a new investigation WorkItem from the external signal."
        : "Single-signal routing created a new usage investigation WorkItem from the signal.",
    };
  }

  if (routedWorkItemCandidate) {
    routingNotes.push(`Single-signal routing matched: ${routedWorkItemCandidate.title}.`);
  }

  const usagePatternCandidate = await evaluateUsagePattern(prisma, {
    productId: input.productId,
    signalType: input.signalType,
    occurredAt: input.occurredAt,
    payload: input.payload,
  });

  const selectedWorkItemCandidate = usagePatternCandidate
    ? {
        type: usagePatternCandidate.workItemType,
        title: usagePatternCandidate.title,
        reuseNote: usagePatternCandidate.reuseNote,
        createNote: usagePatternCandidate.createNote,
        description: usagePatternCandidate.workItemDescription,
        summaryNote: usagePatternCandidate.summaryNote,
      }
    : routedWorkItemCandidate;

  if (usagePatternCandidate) {
    routingNotes.push(usagePatternCandidate.summaryNote);
    const payloadObject = (asObject(input.payload) ?? {}) as Prisma.InputJsonObject;
    input.payload = {
      ...payloadObject,
      ...(usagePatternCandidate.context as Prisma.InputJsonObject),
    };
  }

  if (selectedWorkItemCandidate) {
    const routedMatch = await findOrCreateRoutedWorkItem(
      prisma,
      input,
      selectedWorkItemCandidate.type,
      selectedWorkItemCandidate.title,
      selectedWorkItemCandidate.reuseNote,
      selectedWorkItemCandidate.createNote,
      selectedWorkItemCandidate.description,
    );

    linkedWorkItemId = routedMatch.workItemId;
    createdFollowUp = routedMatch.created;
    routingNotes.push(routedMatch.routingNote);
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
