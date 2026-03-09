import { Prisma, PrismaClient, WorkItemStatus, WorkItemType } from "@prisma/client";
import { generateFeatureDecomposition } from "./feature-decomposition";

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
    const createdStory = await prismaClient.workItem.create({
      data: {
        title: story.title,
        description: story.description ?? null,
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
      data: story.tasks.map((task) => ({
        title: task.title,
        description: task.description ?? null,
        type: "task",
        status: WorkItemStatus.new,
        parent_id: createdStory.id,
        product_id: feature.product_id,
      })),
    });
  }

  return decomposition;
}
