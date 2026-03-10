import { WorkItemType } from "@prisma/client";
import { FEATURE_TEMPLATE_SECTIONS, STORY_TEMPLATE_SECTIONS } from "./workitem-templates";

export type WorkItemContentSectionKind = "text" | "bullets" | "gherkin";

export type WorkItemContentSection = {
  title: string;
  content: string;
  kind: WorkItemContentSectionKind;
};

type ParsedWorkItemContent = {
  sections: WorkItemContentSection[];
  acceptanceCriteriaSection: WorkItemContentSection | null;
  isStructured: boolean;
};

const SECTION_TITLES_BY_TYPE: Partial<Record<WorkItemType, readonly string[]>> = {
  feature: FEATURE_TEMPLATE_SECTIONS,
  story: STORY_TEMPLATE_SECTIONS,
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function getSectionKind(content: string): WorkItemContentSectionKind {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 0 && lines.every((line) => /^[-*]\s+/.test(line))) {
    return "bullets";
  }

  if (
    /\bGiven\b/.test(content) &&
    /\bWhen\b/.test(content) &&
    /\bThen\b/.test(content)
  ) {
    return "gherkin";
  }

  return "text";
}

function parseStructuredSections(workItemType: WorkItemType, value?: string | null): WorkItemContentSection[] {
  if (!value) {
    return [];
  }

  const sectionTitles = SECTION_TITLES_BY_TYPE[workItemType];

  if (!sectionTitles) {
    return [];
  }

  const allowedTitles = new Set(sectionTitles);
  const sections: WorkItemContentSection[] = [];
  const lines = normalizeWhitespace(value).split("\n");
  let currentTitle: string | null = null;
  let currentLines: string[] = [];

  const pushSection = () => {
    if (!currentTitle) {
      return;
    }

    const content = currentLines.join("\n").trim();
    sections.push({
      title: currentTitle,
      content,
      kind: getSectionKind(content),
    });
  };

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    const maybeTitle = match?.[1]?.trim();

    if (maybeTitle && allowedTitles.has(maybeTitle)) {
      pushSection();
      currentTitle = maybeTitle;
      currentLines = match?.[2] ? [match[2]] : [];
      continue;
    }

    if (!currentTitle) {
      continue;
    }

    currentLines.push(line);
  }

  pushSection();
  return sections.filter((section) => section.content.length > 0);
}

export function getParsedWorkItemContent(
  workItemType: WorkItemType,
  description?: string | null,
  acceptanceCriteria?: string | null,
): ParsedWorkItemContent {
  const parsedSections = parseStructuredSections(workItemType, description);
  const acceptanceCriteriaSectionFromDescription =
    parsedSections.find(
      (section) =>
        section.title === "Acceptance Criteria" ||
        section.title === "Acceptance Criteria (Gherkin)",
    ) ?? null;
  const sections = parsedSections.filter(
    (section) =>
      section.title !== "Title" &&
      section.title !== "Acceptance Criteria" &&
      section.title !== "Acceptance Criteria (Gherkin)",
  );
  const structuredSectionCount = sections.length;

  return {
    sections,
    acceptanceCriteriaSection: acceptanceCriteria?.trim()
      ? {
          title:
            workItemType === "story"
              ? "Acceptance Criteria (Gherkin)"
              : "Acceptance Criteria",
          content: normalizeWhitespace(acceptanceCriteria),
          kind: getSectionKind(acceptanceCriteria),
        }
      : acceptanceCriteriaSectionFromDescription,
    isStructured: structuredSectionCount >= 2,
  };
}
