import { WorkItemType } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAcceptanceCriteria } from "@/lib/workitem-criteria";

type RouteContext = {
  params: Promise<{ productId: string; workItemId: string }>;
};

const GENERATABLE_CHILD_TYPES: WorkItemType[] = [WorkItemType.story, WorkItemType.task];

export async function POST(request: Request, context: RouteContext) {
  const { productId, workItemId } = await context.params;

  const workItem = await prisma.workItem.findFirst({
    where: { id: workItemId, product_id: productId },
    select: {
      id: true,
      title: true,
      type: true,
      description: true,
      parent: {
        select: {
          id: true,
          title: true,
          type: true,
          description: true,
        },
      },
      children: {
        where: {
          type: { in: GENERATABLE_CHILD_TYPES },
        },
        select: {
          id: true,
          title: true,
          type: true,
          description: true,
          acceptance_criteria: true,
        },
      },
    },
  });

  if (!workItem) {
    return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?error=workitem_not_found`, request.url));
  }

  const childrenToUpdate = workItem.children
    .filter((child) => !child.acceptance_criteria)
    .map((child) => ({
      id: child.id,
      acceptanceCriteria: generateAcceptanceCriteria({
        type: child.type,
        title: child.title,
        description: child.description,
        parent: {
          type: workItem.type,
          title: workItem.title,
          description: workItem.description,
          parent: workItem.parent
            ? {
                type: workItem.parent.type,
                title: workItem.parent.title,
              }
            : null,
        },
      }),
    }))
    .filter((child) => child.acceptanceCriteria);

  if (childrenToUpdate.length > 0) {
    await prisma.$transaction(
      childrenToUpdate.map((child) =>
        prisma.workItem.update({
          where: { id: child.id },
          data: { acceptance_criteria: child.acceptanceCriteria },
        }),
      ),
    );
  }

  const url = new URL(`/products/${productId}/work/${workItemId}`, request.url);
  url.searchParams.set("success", "child_acceptance_criteria_generated");
  url.searchParams.set("count", String(childrenToUpdate.length));

  return NextResponse.redirect(url);
}
