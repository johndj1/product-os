import { Prisma, PrismaClient, WorkItemStatus, WorkItemType } from "@prisma/client";
import { generateFeatureDecomposition } from "./feature-decomposition";
import { generateWorkItemContent } from "./workitem-criteria";

type WorkItemTransactionClient = Prisma.TransactionClient | PrismaClient;

export class FeatureDecompositionError extends Error {}

export async function createFeatureDecompositionWorkItems(
  prismaClient: WorkItemTransactionClient,
  feature: {
    id: string;
    title: string;
    description: string | null;
    product_id: string;
    type: WorkItemType;
    outcome?: {
      title: string;
      journey_step: {
        title: string;
        journey: {
          title: string;
        };
      };
    } | null;
  },
) {
  if (feature.type !== "feature") {
    throw new FeatureDecompositionError("Only feature WorkItems can be decomposed.");
  }

  const existingStoryChildren = await prismaClient.workItem.count({
    where: {
      parent_id: feature.id,
      type: "story",
    },
  });

  if (existingStoryChildren > 0) {
    throw new FeatureDecompositionError("This Feature already has Story children.");
  }

  const decomposition = generateFeatureDecomposition(feature.title, feature.description);
  const outcomeContext = feature.outcome
    ? [
        `Customer journey step: ${feature.outcome.journey_step.title}`,
        "",
        `Desired user outcome: ${feature.outcome.title}`,
        "",
        "Implementation notes:",
        `- Journey: ${feature.outcome.journey_step.journey.title}`,
        "- This work exists to improve the linked customer outcome for the parent Feature.",
      ].join("\n")
    : null;

  for (const story of decomposition.stories) {
    const storyContent = generateWorkItemContent({
      type: "story",
      title: story.title,
      description: story.description,
      parent: {
        type: feature.type,
        title: feature.title,
        description: feature.description,
        parent: null,
      },
    });
    const storyDescription = [storyContent.description, outcomeContext].filter(Boolean).join("\n\n");

    const createdStory = await prismaClient.workItem.create({
      data: {
        title: story.title,
        description: storyDescription,
        acceptance_criteria: storyContent.acceptanceCriteria,
        type: "story",
        status: WorkItemStatus.new,
        parent_id: feature.id,
        product_id: feature.product_id,
      },
    });

    if (story.tasks.length === 0) {
      continue;
    }

    await prismaClient.workItem.createMany({
      data: story.tasks.map((task) => {
        const taskContent = generateWorkItemContent({
          type: "task",
          title: task.title,
          description: task.description,
          parent: {
            type: "story",
            title: story.title,
            description: storyDescription,
            parent: {
              type: feature.type,
              title: feature.title,
              description: feature.description,
            },
          },
        });

        return {
          title: task.title,
          description: taskContent.description,
          acceptance_criteria: taskContent.acceptanceCriteria,
          type: "task",
          status: WorkItemStatus.new,
          parent_id: createdStory.id,
          product_id: feature.product_id,
        };
      }),
    });
  }

  return decomposition;
}
