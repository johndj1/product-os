import { WorkItem, WorkItemType } from "@prisma/client";

export type WorkItemTreeNode = WorkItem & { children: WorkItemTreeNode[] };
export type DeliveryOutcomeNode = {
  id: string;
  title: string;
  journeyTitle: string;
  journeyStepTitle: string;
  features: WorkItemTreeNode[];
};
export type DeliveryHierarchy = {
  outcomes: DeliveryOutcomeNode[];
  unlinkedFeatures: WorkItemTreeNode[];
  orphanStories: WorkItemTreeNode[];
  orphanTasks: WorkItemTreeNode[];
};

function sortItems<T extends { type: string; title: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.type === b.type) {
      return a.title.localeCompare(b.title);
    }
    return a.type.localeCompare(b.type);
  });
}

export function buildWorkItemTree(workItems: WorkItem[]): WorkItemTreeNode[] {
  const byParent = new Map<string | null, WorkItem[]>();

  for (const item of workItems) {
    const key = item.parent_id ?? null;
    const existing = byParent.get(key) ?? [];
    existing.push(item);
    byParent.set(key, existing);
  }

  const build = (parentId: string | null): WorkItemTreeNode[] => {
    const direct = sortItems(byParent.get(parentId) ?? []);
    return direct.map((item) => ({
      ...item,
      children: build(item.id),
    }));
  };

  return build(null);
}

export function buildDeliveryHierarchy(
  outcomes: Array<
    {
      id: string;
      title: string;
      journey_step: {
        title: string;
        journey: {
          title: string;
        };
      };
    }
  >,
  workItems: WorkItem[],
): DeliveryHierarchy {
  const byParent = new Map<string, WorkItem[]>();
  const byId = new Map(workItems.map((item) => [item.id, item]));

  for (const item of workItems) {
    if (!item.parent_id) {
      continue;
    }

    const existing = byParent.get(item.parent_id) ?? [];
    existing.push(item);
    byParent.set(item.parent_id, existing);
  }

  const buildChildren = (parentId: string): WorkItemTreeNode[] => {
    const directChildren = sortItems(byParent.get(parentId) ?? []);
    return directChildren.map((child) => ({
      ...child,
      children: buildChildren(child.id),
    }));
  };

  const features = workItems.filter((item) => item.type === "feature");
  const outcomesWithFeatures = [...outcomes]
    .sort((a, b) => {
      const journeyCompare = a.journey_step.journey.title.localeCompare(b.journey_step.journey.title);
      if (journeyCompare !== 0) {
        return journeyCompare;
      }

      const stepCompare = a.journey_step.title.localeCompare(b.journey_step.title);
      if (stepCompare !== 0) {
        return stepCompare;
      }

      return a.title.localeCompare(b.title);
    })
    .map((outcome) => ({
      ...outcome,
      journeyTitle: outcome.journey_step.journey.title,
      journeyStepTitle: outcome.journey_step.title,
      features: sortItems(features.filter((item) => item.outcome_id === outcome.id)).map((feature) => ({
        ...feature,
        children: buildChildren(feature.id),
      })),
    }));

  const unlinkedFeatures = sortItems(features.filter((item) => !item.outcome_id)).map((feature) => ({
    ...feature,
    children: buildChildren(feature.id),
  }));

  const orphanStories = sortItems(
    workItems.filter((item) => item.type === "story" && (!item.parent_id || byId.get(item.parent_id)?.type !== "feature")),
  ).map((story) => ({
    ...story,
    children: buildChildren(story.id),
  }));

  const orphanTasks = sortItems(
    workItems.filter((item) => item.type === "task" && (!item.parent_id || byId.get(item.parent_id)?.type !== "story")),
  ).map((task) => ({
    ...task,
    children: buildChildren(task.id),
  }));

  return {
    outcomes: outcomesWithFeatures,
    unlinkedFeatures,
    orphanStories,
    orphanTasks,
  };
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
