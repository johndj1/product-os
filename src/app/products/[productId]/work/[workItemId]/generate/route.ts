import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWorkItemContent } from "@/lib/workitem-criteria";
import { planCanonicalWorkItemUpgrade } from "@/lib/workitem-canonical-upgrade";
import { GeneratedWorkItemValidationError } from "@/lib/workitem-templates";

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
      outcome: {
        select: {
          title: true,
          journey_step: {
            select: {
              title: true,
              journey: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      },
      parent: {
        select: {
          type: true,
          title: true,
          description: true,
          outcome: {
            select: {
              title: true,
              journey_step: {
                select: {
                  title: true,
                  journey: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
          parent: {
            select: {
              type: true,
              title: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!workItem) {
    return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?error=workitem_not_found`, request.url));
  }

  try {
    const plannedUpgrade =
      workItem.type === "feature" || workItem.type === "story"
        ? planCanonicalWorkItemUpgrade({
            type: workItem.type,
            title: workItem.title,
            description: workItem.description,
            acceptance_criteria: workItem.acceptance_criteria,
            outcome: workItem.outcome,
            parent: workItem.parent,
          })
        : generateWorkItemContent({
            type: workItem.type,
            title: workItem.title,
            description: workItem.description,
            deliveryContext: null,
            parent: workItem.parent
              ? {
                  type: workItem.parent.type,
                  title: workItem.parent.title,
                  description: workItem.parent.description,
                  parent: workItem.parent.parent ?? null,
                }
              : null,
          });

    await prisma.workItem.update({
      where: { id: workItem.id },
      data: {
        description: plannedUpgrade.description,
        acceptance_criteria: plannedUpgrade.acceptanceCriteria,
      },
    });
  } catch (error) {
    if (error instanceof GeneratedWorkItemValidationError) {
      return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?error=workitem_generation_invalid`, request.url));
    }

    throw error;
  }

  return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?success=workitem_content_generated`, request.url));
}
