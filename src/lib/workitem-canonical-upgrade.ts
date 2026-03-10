import { WorkItemType } from "@prisma/client";
import { generateWorkItemContent } from "./workitem-criteria";
import { getGeneratedWorkItemQualityGaps } from "./workitem-templates";

type DeliveryOutcomeContext = {
  title: string;
  journey_step: {
    title: string;
    journey: {
      title: string;
    };
  };
};

type CanonicalUpgradeParent = {
  type: WorkItemType;
  title: string;
  description: string | null;
  outcome?: DeliveryOutcomeContext | null;
  parent?: {
    type: WorkItemType;
    title: string;
    description: string | null;
  } | null;
} | null;

export type CanonicalUpgradeableWorkItem = {
  type: WorkItemType;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  outcome?: DeliveryOutcomeContext | null;
  parent?: CanonicalUpgradeParent;
};

export type CanonicalUpgradePlan = {
  currentGaps: string[];
  needsUpgrade: boolean;
  description: string | null;
  acceptanceCriteria: string | null;
};

export function planCanonicalWorkItemUpgrade(workItem: CanonicalUpgradeableWorkItem): CanonicalUpgradePlan {
  const currentGaps = getGeneratedWorkItemQualityGaps(workItem.type, workItem.description, workItem.acceptance_criteria);

  if (workItem.type !== "feature" && workItem.type !== "story") {
    return {
      currentGaps,
      needsUpgrade: false,
      description: workItem.description,
      acceptanceCriteria: workItem.acceptance_criteria,
    };
  }

  const deliveryOutcome =
    workItem.type === "feature"
      ? workItem.outcome ?? null
      : workItem.parent?.type === "feature"
        ? workItem.parent.outcome ?? null
        : null;

  const generated = generateWorkItemContent({
    type: workItem.type,
    title: workItem.title,
    description: workItem.description,
    deliveryContext: deliveryOutcome
      ? {
          journey: deliveryOutcome.journey_step.journey.title,
          journeyStep: deliveryOutcome.journey_step.title,
          outcome: deliveryOutcome.title,
        }
      : null,
    parent: workItem.parent
      ? {
          type: workItem.parent.type,
          title: workItem.parent.title,
          description: workItem.parent.description,
          parent: workItem.parent.parent ?? null,
        }
      : null,
  });

  const shouldReplaceDescription = currentGaps.length > 0 || !workItem.description;
  const shouldReplaceCriteria = currentGaps.length > 0 || !workItem.acceptance_criteria;
  const description = shouldReplaceDescription ? generated.description : workItem.description;
  const acceptanceCriteria = shouldReplaceCriteria ? generated.acceptanceCriteria : workItem.acceptance_criteria;

  return {
    currentGaps,
    needsUpgrade: currentGaps.length > 0 && (description !== workItem.description || acceptanceCriteria !== workItem.acceptance_criteria),
    description,
    acceptanceCriteria,
  };
}
