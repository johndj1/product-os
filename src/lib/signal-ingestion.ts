import { Prisma, PrismaClient, SignalStatus, SignalType, WorkItemStatus, WorkItemType } from "@prisma/client";

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

export async function ingestSignal(prisma: PrismaClient, input: IngestSignalInput): Promise<IngestSignalResult> {
  let linkedWorkItemId = input.linkedWorkItemId ?? null;
  let createdFollowUp = false;
  let routingNote = "No routing rule matched.";
  const routingNotes: string[] = [];

  if (input.signalType === "test_failure") {
    const bugTitle = `Investigate test failure: ${input.title}`;

    const existingBug = await prisma.workItem.findFirst({
      where: {
        product_id: input.productId,
        type: WorkItemType.bug,
        title: bugTitle,
        status: { in: ACTIVE_WORK_ITEM_STATUSES },
      },
      select: { id: true },
    });

    if (existingBug) {
      linkedWorkItemId = existingBug.id;
      routingNote = "Matched existing active bug WorkItem.";
    } else {
      const bug = await prisma.workItem.create({
        data: {
          product_id: input.productId,
          type: WorkItemType.bug,
          status: WorkItemStatus.new,
          title: bugTitle,
          description: workItemDescription(input),
        },
        select: { id: true },
      });

      linkedWorkItemId = bug.id;
      createdFollowUp = true;
      routingNote = "Created bug WorkItem from test failure signal.";
    }
  }

  if (input.signalType === "incident_alert") {
    const incident = await prisma.workItem.create({
      data: {
        product_id: input.productId,
        type: WorkItemType.incident,
        status: WorkItemStatus.new,
        title: `Incident alert: ${input.title}`,
        description: workItemDescription(input),
      },
      select: { id: true },
    });

    linkedWorkItemId = incident.id;
    createdFollowUp = true;
    routingNote = "Created incident WorkItem from incident alert signal.";
  }

  if (input.signalType === "kpi_change" && isHighSeverity(input.severity)) {
    const research = await prisma.workItem.create({
      data: {
        product_id: input.productId,
        type: WorkItemType.research,
        status: WorkItemStatus.new,
        title: `Investigate KPI change: ${input.title}`,
        description: workItemDescription(input),
      },
      select: { id: true },
    });

    linkedWorkItemId = research.id;
    createdFollowUp = true;
    routingNotes.push("Created research WorkItem from high-severity KPI change signal.");
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
    const story = await prisma.workItem.create({
      data: {
        product_id: input.productId,
        type: WorkItemType.story,
        status: WorkItemStatus.new,
        title: `Address delivery risk: ${input.title}`,
        description: workItemDescription(input),
      },
      select: { id: true },
    });

    linkedWorkItemId = story.id;
    createdFollowUp = true;
    routingNotes.push("Created story WorkItem from delivery risk signal.");
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
      status,
      severity: input.severity ?? null,
      payload: input.payload,
      work_item_id: linkedWorkItemId,
      created_follow_up: createdFollowUp,
      routing_note: routingNote,
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
