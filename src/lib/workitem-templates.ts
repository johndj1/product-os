import { WorkItemType } from "@prisma/client";

export const FEATURE_TEMPLATE_SECTIONS = [
  "Title",
  "Summary",
  "Scope Includes",
  "Out of Scope",
  "Dependencies",
  "Value",
  "Acceptance Criteria",
  "Definition of Done",
] as const;

export const STORY_TEMPLATE_SECTIONS = [
  "Title",
  "Linked Outcome",
  "Description",
  "Context / Background",
  "Problem / Need",
  "Scope of Work",
  "Acceptance Criteria (Gherkin)",
  "Operational Readiness",
  "Deliverables",
  "Definition of Done",
] as const;

const FEATURE_REQUIRED_SECTIONS = [
  "Summary",
  "Scope Includes",
  "Value",
  "Acceptance Criteria",
  "Definition of Done",
] as const;

const STORY_REQUIRED_SECTIONS = [
  "Context / Background",
  "Problem / Need",
  "Scope of Work",
  "Acceptance Criteria (Gherkin)",
  "Definition of Done",
] as const;

export class GeneratedWorkItemValidationError extends Error {
  readonly workItemType: WorkItemType;
  readonly missingSections: string[];

  constructor(workItemType: WorkItemType, missingSections: string[]) {
    super(`Generated ${workItemType} content is missing required sections: ${missingSections.join(", ")}`);
    this.name = "GeneratedWorkItemValidationError";
    this.workItemType = workItemType;
    this.missingSections = missingSections;
  }
}

function hasSection(description: string | null | undefined, section: string): boolean {
  if (!description) {
    return false;
  }

  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|\\n)${escaped}:`, "m").test(description);
}

function listMissingSections(description: string | null | undefined, sections: readonly string[]): string[] {
  return sections.filter((section) => !hasSection(description, section));
}

export function getGeneratedWorkItemQualityGaps(
  workItemType: WorkItemType,
  description: string | null | undefined,
  acceptanceCriteria: string | null | undefined,
): string[] {
  if (workItemType === "feature") {
    const missing = listMissingSections(description, FEATURE_REQUIRED_SECTIONS);

    if (!acceptanceCriteria?.trim()) {
      missing.push("Acceptance Criteria");
    }

    return [...new Set(missing)];
  }

  if (workItemType === "story") {
    const missing = listMissingSections(description, STORY_REQUIRED_SECTIONS);

    if (!acceptanceCriteria?.trim()) {
      missing.push("Acceptance Criteria (Gherkin)");
    } else if (!/\bGiven\b/.test(acceptanceCriteria) || !/\bWhen\b/.test(acceptanceCriteria) || !/\bThen\b/.test(acceptanceCriteria)) {
      missing.push("Acceptance Criteria (Gherkin)");
    }

    return [...new Set(missing)];
  }

  return [];
}

export function assertGeneratedWorkItemQuality(
  workItemType: WorkItemType,
  description: string | null | undefined,
  acceptanceCriteria: string | null | undefined,
): void {
  const gaps = getGeneratedWorkItemQualityGaps(workItemType, description, acceptanceCriteria);

  if (gaps.length > 0) {
    throw new GeneratedWorkItemValidationError(workItemType, gaps);
  }
}
