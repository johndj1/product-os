import { SignalStatus, WorkItemStatus, WorkItemType } from "@prisma/client";
import { RelationshipEdge } from "./relationships";

const ACTIVE_WORK_ITEM_STATUSES: WorkItemStatus[] = [WorkItemStatus.new, WorkItemStatus.ready, WorkItemStatus.in_progress, WorkItemStatus.blocked];
const ACTIVE_SIGNAL_STATUSES: SignalStatus[] = [SignalStatus.new, SignalStatus.triaged, SignalStatus.actioned];

const TYPE_BASE_SCORE: Record<WorkItemType, number> = {
  outcome: 18,
  kpi: 28,
  capability: 14,
  feature: 24,
  story: 22,
  task: 18,
  bug: 32,
  research: 20,
  incident: 40,
  decision: 12,
};

const STATUS_SCORE: Record<WorkItemStatus, number> = {
  new: 4,
  ready: 8,
  in_progress: 10,
  blocked: 6,
  done: -40,
  cancelled: -50,
};

type ScorableWorkItem = {
  id: string;
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  parent_id: string | null;
};

type ScorableSignal = {
  work_item_id: string | null;
  status: SignalStatus;
  severity: string | null;
};

export type WorkItemPriority = {
  workItemId: string;
  score: number;
  reason: string;
};

function isActiveWorkItemStatus(status: WorkItemStatus): boolean {
  return ACTIVE_WORK_ITEM_STATUSES.includes(status);
}

function isActiveSignalStatus(status: SignalStatus): boolean {
  return ACTIVE_SIGNAL_STATUSES.includes(status);
}

function severityBonus(severity: string | null): number {
  if (!severity) return 0;
  const normalized = severity.trim().toLowerCase();
  if (normalized === "critical" || normalized === "sev1" || normalized === "p0") return 20;
  if (normalized === "high" || normalized === "sev2" || normalized === "p1") return 14;
  if (normalized === "medium") return 8;
  if (normalized === "low") return 4;
  return 6;
}

function hasOutcomeAncestor(item: ScorableWorkItem, byId: Map<string, ScorableWorkItem>): boolean {
  let currentParentId = item.parent_id;

  while (currentParentId) {
    const parent = byId.get(currentParentId);
    if (!parent) return false;
    if (parent.type === WorkItemType.outcome) return true;
    currentParentId = parent.parent_id;
  }

  return false;
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Deterministic v1 model. Factors are additive and translated to a short reason string:
// base by WorkItem type, status modifier, KPI/outcome relevance, active signal pressure,
// dependency/blocking pressure, and a small penalty for disconnected active work.
export function calculatePriorityForWorkItem(
  workItem: ScorableWorkItem,
  workItems: ScorableWorkItem[],
  relationships: RelationshipEdge[],
  signals: ScorableSignal[],
): WorkItemPriority {
  const byId = new Map(workItems.map((item) => [item.id, item]));
  const outgoing = relationships.filter((relationship) => relationship.fromWorkItem.id === workItem.id);
  const incoming = relationships.filter((relationship) => relationship.toWorkItem.id === workItem.id);

  let score = TYPE_BASE_SCORE[workItem.type] + STATUS_SCORE[workItem.status];
  const reasons: string[] = [`Base ${TYPE_BASE_SCORE[workItem.type]} (${workItem.type})`];

  if (STATUS_SCORE[workItem.status] !== 0) {
    reasons.push(`Status ${STATUS_SCORE[workItem.status] > 0 ? "+" : ""}${STATUS_SCORE[workItem.status]} (${workItem.status})`);
  }

  let hasStrategicContext = false;
  if (workItem.type === WorkItemType.kpi) {
    score += 18;
    hasStrategicContext = true;
    reasons.push("+18 direct KPI relevance");
  } else if (workItem.type === WorkItemType.outcome) {
    score += 16;
    hasStrategicContext = true;
    reasons.push("+16 direct Outcome relevance");
  } else if (hasOutcomeAncestor(workItem, byId)) {
    score += 12;
    hasStrategicContext = true;
    reasons.push("+12 linked to Outcome hierarchy");
  }

  const relatedStrategicCount = [...outgoing, ...incoming].filter((relationship) => {
    const otherId = relationship.fromWorkItem.id === workItem.id ? relationship.toWorkItem.id : relationship.fromWorkItem.id;
    const other = byId.get(otherId);
    return other?.type === WorkItemType.kpi || other?.type === WorkItemType.outcome;
  }).length;

  if (relatedStrategicCount > 0) {
    const bonus = Math.min(16, relatedStrategicCount * 8);
    score += bonus;
    hasStrategicContext = true;
    reasons.push(`+${bonus} related to KPI/Outcome via relationships`);
  }

  const activeSignals = signals.filter((signal) => signal.work_item_id === workItem.id && isActiveSignalStatus(signal.status));
  if (activeSignals.length > 0) {
    const signalPressure = Math.min(18, activeSignals.length * 6);
    const maxSeverityBonus = activeSignals.reduce((max, signal) => Math.max(max, severityBonus(signal.severity)), 0);
    score += signalPressure + maxSeverityBonus;
    reasons.push(`+${signalPressure} active linked signals (${activeSignals.length})`);
    if (maxSeverityBonus > 0) {
      reasons.push(`+${maxSeverityBonus} signal severity pressure`);
    }
  }

  const blockedActiveWorkCount = outgoing.filter((relationship) => {
    if (relationship.relationshipType !== "blocks") return false;
    return isActiveWorkItemStatus(relationship.toWorkItem.status as WorkItemStatus);
  }).length;
  const activeWorkDependingOnThisCount = incoming.filter((relationship) => {
    if (relationship.relationshipType !== "depends_on") return false;
    return isActiveWorkItemStatus(relationship.fromWorkItem.status as WorkItemStatus);
  }).length;

  const blockingPressure = Math.min(24, blockedActiveWorkCount * 12) + Math.min(16, activeWorkDependingOnThisCount * 8);
  if (blockingPressure > 0) {
    score += blockingPressure;
    reasons.push(`+${blockingPressure} blocking/dependency pressure`);
  }

  const hasAnyRelationships = outgoing.length > 0 || incoming.length > 0;
  const hasActiveContext = hasStrategicContext || activeSignals.length > 0 || blockingPressure > 0 || hasAnyRelationships;

  if (!hasActiveContext && isActiveWorkItemStatus(workItem.status)) {
    score -= 6;
    reasons.push("-6 low connected context");
  }

  return {
    workItemId: workItem.id,
    score: clampScore(score),
    reason: reasons.join(" | "),
  };
}

export function calculatePriorityForProduct(
  workItems: ScorableWorkItem[],
  relationships: RelationshipEdge[],
  signals: ScorableSignal[],
): WorkItemPriority[] {
  return workItems
    .map((workItem) => calculatePriorityForWorkItem(workItem, workItems, relationships, signals))
    .sort((a, b) => b.score - a.score);
}
