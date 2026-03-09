import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWorkItemContent } from "@/lib/workitem-criteria";

type RouteContext = {
  params: Promise<{ productId: string; workItemId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId, workItemId } = await context.params;

  const workItem = await prisma.workItem.findFirst({
    where: { id: workItemId, product_id: productId },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      acceptance_criteria: true,
      parent: {
        select: {
          type: true,
          title: true,
          description: true,
          parent: {
            select: {
              type: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!workItem) {
    return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?error=workitem_not_found`, request.url));
  }

  const generated = generateWorkItemContent({
    type: workItem.type,
    title: workItem.title,
    description: workItem.description,
    parent: workItem.parent
      ? {
          type: workItem.parent.type,
          title: workItem.parent.title,
          description: workItem.parent.description,
          parent: workItem.parent.parent,
        }
      : null,
  });

  await prisma.workItem.update({
    where: { id: workItem.id },
    data: {
      description: workItem.description || generated.description,
      acceptance_criteria: workItem.acceptance_criteria || generated.acceptanceCriteria,
    },
  });

  return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?success=workitem_content_generated`, request.url));
}
