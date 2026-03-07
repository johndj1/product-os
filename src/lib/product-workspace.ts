import { WorkItem, WorkItemType } from "@prisma/client";

export type WorkItemTreeNode = WorkItem & { children: WorkItemTreeNode[] };

export function buildWorkItemTree(workItems: WorkItem[]): WorkItemTreeNode[] {
  const byParent = new Map<string | null, WorkItem[]>();

  for (const item of workItems) {
    const key = item.parent_id ?? null;
    const existing = byParent.get(key) ?? [];
    existing.push(item);
    byParent.set(key, existing);
  }

  const sortItems = (items: WorkItem[]) =>
    [...items].sort((a, b) => {
      if (a.type === b.type) {
        return a.title.localeCompare(b.title);
      }
      return a.type.localeCompare(b.type);
    });

  const build = (parentId: string | null): WorkItemTreeNode[] => {
    const direct = sortItems(byParent.get(parentId) ?? []);
    return direct.map((item) => ({
      ...item,
      children: build(item.id),
    }));
  };

  return build(null);
}

export function groupByType(workItems: WorkItem[]): Array<{ type: WorkItemType; count: number }> {
  const counts = new Map<WorkItemType, number>();

  for (const item of workItems) {
    counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => a.type.localeCompare(b.type));
}
