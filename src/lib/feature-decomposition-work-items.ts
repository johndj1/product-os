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

    const createdStory = await prismaClient.workItem.create({
      data: {
        title: story.title,
        description: storyContent.description,
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
            description: storyContent.description,
            parent: {
              type: feature.type,
              title: feature.title,
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
