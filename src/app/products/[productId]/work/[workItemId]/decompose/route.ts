import { NextResponse } from "next/server";
import { createFeatureDecompositionWorkItems, FeatureDecompositionError } from "@/lib/feature-decomposition-work-items";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ productId: string; workItemId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId, workItemId } = await context.params;

  const feature = await prisma.workItem.findFirst({
    where: {
      id: workItemId,
      product_id: productId,
    },
    select: {
      id: true,
      title: true,
      description: true,
      product_id: true,
      type: true,
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
    },
  });

  if (!feature) {
    return NextResponse.redirect(new URL(`/products/${productId}/work?error=workitem_not_found`, request.url));
  }

  try {
    await prisma.$transaction(async (tx) => {
      await createFeatureDecompositionWorkItems(tx, feature);
    });
  } catch (error) {
    if (error instanceof FeatureDecompositionError) {
      return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?error=feature_decomposition_invalid`, request.url));
    }

    throw error;
  }

  return NextResponse.redirect(new URL(`/products/${productId}/work/${workItemId}?success=feature_decomposition_created`, request.url));
}
