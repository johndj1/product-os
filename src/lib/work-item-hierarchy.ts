import { WorkItemType } from "@prisma/client";
import {
  ALLOWED_CHILDREN_BY_PARENT,
  isAllowedChildTypeValue,
  WorkItemTypeValue,
} from "./work-item-rules";

const allowedChildrenByParent: Partial<Record<WorkItemType, WorkItemType[]>> =
  ALLOWED_CHILDREN_BY_PARENT as Partial<Record<WorkItemType, WorkItemType[]>>;

export function isAllowedChildType(parentType: WorkItemType, childType: WorkItemType): boolean {
  return isAllowedChildTypeValue(parentType as WorkItemTypeValue, childType as WorkItemTypeValue);
}

export function assertAllowedChildType(parentType: WorkItemType, childType: WorkItemType): void {
  if (!isAllowedChildType(parentType, childType)) {
    throw new Error(`Invalid WorkItem hierarchy: ${parentType} cannot have child ${childType}`);
  }
}

export const hierarchyRules = allowedChildrenByParent;
