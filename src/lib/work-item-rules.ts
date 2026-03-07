export const WORK_ITEM_TYPE_VALUES = [
  "outcome",
  "kpi",
  "capability",
  "feature",
  "story",
  "task",
  "bug",
  "research",
  "incident",
  "decision",
] as const;

export const WORK_ITEM_STATUS_VALUES = ["new", "ready", "in_progress", "blocked", "done", "cancelled"] as const;

export const ACTIVE_WORK_ITEM_STATUS_VALUES = ["new", "ready", "in_progress", "blocked"] as const;

export type WorkItemTypeValue = (typeof WORK_ITEM_TYPE_VALUES)[number];
export type WorkItemStatusValue = (typeof WORK_ITEM_STATUS_VALUES)[number];

export const ALLOWED_CHILDREN_BY_PARENT: Partial<Record<WorkItemTypeValue, WorkItemTypeValue[]>> = {
  outcome: ["kpi"],
  capability: ["feature"],
  feature: ["story"],
  story: ["task"],
};

export function isAllowedChildTypeValue(parentType: WorkItemTypeValue, childType: WorkItemTypeValue): boolean {
  return ALLOWED_CHILDREN_BY_PARENT[parentType]?.includes(childType) ?? false;
}

export function getAllowedParentTypes(childType: WorkItemTypeValue): WorkItemTypeValue[] {
  return (Object.entries(ALLOWED_CHILDREN_BY_PARENT) as Array<[WorkItemTypeValue, WorkItemTypeValue[]]>)
    .filter(([, children]) => children.includes(childType))
    .map(([parentType]) => parentType);
}
