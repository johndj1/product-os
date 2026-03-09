import { WorkItemType } from "@prisma/client";
import { generateAcceptanceCriteria } from "./workitem-criteria";

type PromptWorkItem = {
  type: WorkItemType;
  title: string;
  description?: string | null;
  acceptanceCriteria?: string | null;
};

type GenerateWorkItemPromptInput = {
  productName: string;
  workItem: PromptWorkItem;
  parent?: PromptWorkItem | null;
  grandparent?: PromptWorkItem | null;
  children?: PromptWorkItem[];
};

type ParsedDescription = {
  summary?: string;
  persona?: string;
  journeyStep?: string;
  desiredOutcome?: string;
  userOutcome?: string;
  implementationNotes?: string[];
  objective?: string;
  deliverable?: string;
  technicalNotes?: string[];
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function parseBullets(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s*/, ""));
}

function parseStructuredDescription(description?: string | null): ParsedDescription {
  if (!description) {
    return {};
  }

  const sections = normalizeWhitespace(description).split(/\n\s*\n/);
  const parsed: ParsedDescription = {};

  for (const section of sections) {
    const [firstLine, ...rest] = section.split("\n");
    const content = rest.join("\n").trim();

    if (firstLine.startsWith("Description:")) {
      parsed.summary = firstLine.replace("Description:", "").trim();
      continue;
    }

    if (firstLine.startsWith("Persona:")) {
      parsed.persona = firstLine.replace("Persona:", "").trim();
      continue;
    }

    if (firstLine.startsWith("Customer journey step:")) {
      parsed.journeyStep = firstLine.replace("Customer journey step:", "").trim();
      continue;
    }

    if (firstLine.startsWith("Journey step:")) {
      parsed.journeyStep = firstLine.replace("Journey step:", "").trim();
      continue;
    }

    if (firstLine.startsWith("Desired user outcome:")) {
      parsed.desiredOutcome = firstLine.replace("Desired user outcome:", "").trim();
      continue;
    }

    if (firstLine.startsWith("User outcome:")) {
      parsed.userOutcome = firstLine.replace("User outcome:", "").trim();
      continue;
    }

    if (firstLine === "Implementation notes:") {
      parsed.implementationNotes = parseBullets(content);
      continue;
    }

    if (firstLine.startsWith("Objective:")) {
      parsed.objective = firstLine.replace("Objective:", "").trim();
      continue;
    }

    if (firstLine.startsWith("Deliverable:")) {
      parsed.deliverable = firstLine.replace("Deliverable:", "").trim();
      continue;
    }

    if (firstLine === "Technical notes:") {
      parsed.technicalNotes = parseBullets(content);
    }
  }

  return parsed;
}

function toBullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join("\n");
}

function buildRequirements(input: GenerateWorkItemPromptInput): string {
  const criteria =
    input.workItem.acceptanceCriteria && normalizeWhitespace(input.workItem.acceptanceCriteria)
      ? parseBullets(normalizeWhitespace(input.workItem.acceptanceCriteria))
      : parseBullets(
          generateAcceptanceCriteria({
            type: input.workItem.type,
            title: input.workItem.title,
            description: input.workItem.description,
            parent: input.parent
              ? {
                  type: input.parent.type,
                  title: input.parent.title,
                  description: input.parent.description,
                  parent: input.grandparent ? { type: input.grandparent.type, title: input.grandparent.title } : null,
                }
              : null,
          }) ?? "",
        );

  return criteria.length === 0 ? "- Define the observable requirements before implementation." : toBullets(criteria);
}

export function generateCodexPrompt(input: GenerateWorkItemPromptInput): string {
  const workItemDetails = parseStructuredDescription(input.workItem.description);
  const parentDetails = parseStructuredDescription(input.parent?.description);
  const grandparentDetails = parseStructuredDescription(input.grandparent?.description);
  const featureTitle =
    input.workItem.type === "story"
      ? input.parent?.title
      : input.workItem.type === "task"
        ? input.grandparent?.title
        : undefined;
  const storyTitle = input.workItem.type === "task" ? input.parent?.title : input.workItem.type === "story" ? input.workItem.title : undefined;
  const featureContext = [
    featureTitle ? `Feature: ${featureTitle}` : null,
    grandparentDetails.summary ? `Feature summary: ${grandparentDetails.summary}` : null,
  ].filter(Boolean) as string[];
  const storyContext = [
    storyTitle ? `Story: ${storyTitle}` : null,
    input.workItem.type === "story" ? workItemDetails.summary : parentDetails.summary,
  ].filter(Boolean) as string[];
  const taskObjective =
    workItemDetails.objective ??
    (input.workItem.type === "task"
      ? `Implement ${input.workItem.title} in the current Product OS codebase.`
      : `Implement the story outcome for ${input.workItem.title} without drifting from the intended customer outcome.`);
  const persona = workItemDetails.persona ?? parentDetails.persona ?? grandparentDetails.persona;
  const journeyStep = workItemDetails.journeyStep ?? parentDetails.journeyStep ?? grandparentDetails.journeyStep;
  const userOutcome = workItemDetails.desiredOutcome ?? workItemDetails.userOutcome ?? parentDetails.desiredOutcome ?? parentDetails.userOutcome;
  const technicalNotes = [
    ...(workItemDetails.implementationNotes ?? []),
    ...(workItemDetails.technicalNotes ?? []),
  ];

  if (input.parent) {
    technicalNotes.push(`Parent ${input.parent.type}: ${input.parent.title}`);
  }

  if (input.children && input.children.length > 0) {
    technicalNotes.push(
      `${input.workItem.type === "story" ? "Tasks" : "Child work items"} in scope: ${input.children.map((child) => child.title).join("; ")}`,
    );
  }

  const promptSections = [
    `Implement ${input.workItem.title}.`,
    "",
    "Context:",
    `Product: ${input.productName}`,
  ];

  if (featureContext.length > 0) {
    promptSections.push("", "Feature context:", ...featureContext);
  }

  if (storyContext.length > 0) {
    promptSections.push("", "Story context:", ...storyContext);
  }

  promptSections.push("", "Task objective:", taskObjective);

  const summary = workItemDetails.summary ?? workItemDetails.objective ?? normalizeWhitespace(input.workItem.description ?? "");
  if (summary) {
    promptSections.push("", `Description: ${summary}`);
  }

  if (persona) {
    promptSections.push("", "Persona reference:", persona);
  }

  if (journeyStep) {
    promptSections.push("", "Customer journey step:", journeyStep);
  }

  if (userOutcome) {
    promptSections.push("", "Desired user outcome:", userOutcome);
  }

  const deliverable = workItemDetails.deliverable;
  if (deliverable) {
    promptSections.push("", "Deliverable:", deliverable);
  }

  promptSections.push("", "Acceptance criteria:", buildRequirements(input));

  if (technicalNotes.length > 0) {
    promptSections.push("", "Technical notes:", toBullets(technicalNotes));
  }

  promptSections.push("", "Constraints:", "- Keep the implementation deterministic and lightweight.", "- Do not introduce AI inside Product OS.");

  return promptSections.join("\n");
}
