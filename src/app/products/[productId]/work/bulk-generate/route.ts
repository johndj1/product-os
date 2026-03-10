import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { planCanonicalWorkItemUpgrade } from "@/lib/workitem-canonical-upgrade";
import { GeneratedWorkItemValidationError } from "@/lib/workitem-templates";

type RouteContext = {
  params: Promise<{ productId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { productId } = await context.params;

  try {
    const workItems = await prisma.workItem.findMany({
      where: {
        product_id: productId,
        type: {
          in: ["feature", "story"],
        },
      },
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
      orderBy: [{ created_at: "asc" }],
    });

    let upgradedFeatures = 0;
    let upgradedStories = 0;
    let skippedCompliant = 0;

    const updates = workItems
      .map((workItem) => {
        const plannedUpgrade = planCanonicalWorkItemUpgrade(workItem);

        if (!plannedUpgrade.needsUpgrade) {
          skippedCompliant += 1;
          return null;
        }

        if (workItem.type === "feature") {
          upgradedFeatures += 1;
        } else if (workItem.type === "story") {
          upgradedStories += 1;
        }

        return {
          id: workItem.id,
          description: plannedUpgrade.description,
          acceptance_criteria: plannedUpgrade.acceptanceCriteria,
        };
      })
      .filter((update): update is { id: string; description: string | null; acceptance_criteria: string | null } => update !== null);

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map((update) =>
          prisma.workItem.update({
            where: { id: update.id },
            data: {
              description: update.description,
              acceptance_criteria: update.acceptance_criteria,
            },
          }),
        ),
      );
    }

    const url = new URL(`/products/${productId}/work`, request.url);
    url.searchParams.set("success", "workitem_bulk_content_generated");
    url.searchParams.set("upgraded_features", String(upgradedFeatures));
    url.searchParams.set("upgraded_stories", String(upgradedStories));
    url.searchParams.set("skipped_compliant", String(skippedCompliant));
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof GeneratedWorkItemValidationError) {
      return NextResponse.redirect(new URL(`/products/${productId}/work?error=workitem_generation_invalid`, request.url));
    }

    throw error;
  }
}
