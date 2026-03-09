import { prisma } from "./prisma";

export type OutcomeGap = {
  outcome_id: string;
  outcome_title: string;
  journey_step: string;
  journey: string;
  missing_feature: true;
  suggested_feature_title: string;
};

const DOMAIN_SPECIFIC_FEATURE_TITLES: Record<string, string> = {
  "User can quickly identify whether their train is delayed.": "Detect train delay status",
  "User can view accurate delay information for their train.": "Show accurate train delay details",
  "User understands whether their journey qualifies for Delay Repay.": "Calculate Delay Repay eligibility",
  "User can quickly start the correct compensation claim.": "Start operator compensation claim",
};

function normaliseOutcomeTitle(title: string): string {
  return title.trim().replace(/\.$/, "");
}

export function suggestFeatureTitle(outcomeTitle: string): string {
  const domainSpecific = DOMAIN_SPECIFIC_FEATURE_TITLES[outcomeTitle];

  if (domainSpecific) {
    return domainSpecific;
  }

  return `Enable ${normaliseOutcomeTitle(outcomeTitle)}`;
}

export async function detectOutcomeGaps(productId: string): Promise<OutcomeGap[]> {
  const outcomes = await prisma.outcome.findMany({
    where: {
      journey_step: {
        journey: {
          product_id: productId,
        },
      },
    },
    include: {
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
      features: {
        where: {
          type: "feature",
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: [
      {
        journey_step: {
          journey: {
            title: "asc",
          },
        },
      },
      {
        journey_step: {
          step_order: "asc",
        },
      },
      {
        title: "asc",
      },
    ],
  });

  return outcomes
    .filter((outcome) => outcome.features.length === 0)
    .map((outcome) => ({
      outcome_id: outcome.id,
      outcome_title: outcome.title,
      journey_step: outcome.journey_step.title,
      journey: outcome.journey_step.journey.title,
      missing_feature: true as const,
      suggested_feature_title: suggestFeatureTitle(outcome.title),
    }));
}
