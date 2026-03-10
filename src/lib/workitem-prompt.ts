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
  deliveryContext?: {
    persona?: string;
    journey?: string;
    journeyStep?: string;
    outcome?: string;
    feature?: string;
    story?: string;
  } | null;
};

type ParsedDescription = {
  summary?: string;
  linkedOutcome?: string;
  persona?: string;
  journey?: string;
  journeyStep?: string;
  desiredOutcome?: string;
  userOutcome?: string;
  contextBackground?: string;
  problemNeed?: string;
  scopeOfWork?: string[];
  operationalReadiness?: string[];
  definitionOfDone?: string[];
  dependencies?: string[];
  value?: string;
  implementationNotes?: string[];
  objective?: string;
  deliverable?: string;
  deliverables?: string[];
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

    if (firstLine.startsWith("Summary:")) {
      parsed.summary = content || firstLine.replace("Summary:", "").trim();
      continue;
    }

    if (firstLine.startsWith("Linked Outcome:")) {
      parsed.linkedOutcome = content || firstLine.replace("Linked Outcome:", "").trim();
      continue;
    }

    if (firstLine.startsWith("Persona:")) {
      parsed.persona = firstLine.replace("Persona:", "").trim();
      continue;
    }

    if (firstLine.startsWith("Journey:")) {
      parsed.journey = firstLine.replace("Journey:", "").trim();
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

    if (firstLine.startsWith("Value:")) {
      parsed.value = content || firstLine.replace("Value:", "").trim();
      continue;
    }

    if (firstLine.startsWith("User outcome:")) {
      parsed.userOutcome = firstLine.replace("User outcome:", "").trim();
      continue;
    }

    if (firstLine.startsWith("Context / Background:")) {
      parsed.contextBackground = content;
      continue;
    }

    if (firstLine.startsWith("Problem / Need:")) {
      parsed.problemNeed = content;
      continue;
    }

    if (firstLine === "Scope of Work:") {
      parsed.scopeOfWork = parseBullets(content);
      continue;
    }

    if (firstLine === "Operational Readiness:") {
      parsed.operationalReadiness = parseBullets(content);
      continue;
    }

    if (firstLine === "Definition of Done:") {
      parsed.definitionOfDone = parseBullets(content);
      continue;
    }

    if (firstLine === "Dependencies:") {
      parsed.dependencies = parseBullets(content);
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

    if (firstLine === "Deliverables:") {
      parsed.deliverables = parseBullets(content);
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

function buildDomainKeywords(input: GenerateWorkItemPromptInput, parsed: ParsedDescription[]): string[] {
  const source = [
    input.productName,
    input.workItem.title,
    input.workItem.description ?? "",
    input.parent?.title ?? "",
    input.parent?.description ?? "",
    input.grandparent?.title ?? "",
    input.deliveryContext?.persona ?? "",
    input.deliveryContext?.journey ?? "",
    input.deliveryContext?.journeyStep ?? "",
    input.deliveryContext?.outcome ?? "",
    ...parsed.flatMap((item) => [
      item.summary ?? "",
      item.problemNeed ?? "",
      item.contextBackground ?? "",
      item.value ?? "",
      ...(item.scopeOfWork ?? []),
      ...(item.dependencies ?? []),
      ...(item.deliverables ?? []),
    ]),
  ]
    .join(" ")
    .toLowerCase();

  const keywordMap: Array<[string, string[]]> = [
    ["darwin", ["darwin"]],
    ["delay repay", ["delay repay"]],
    ["delay status", ["delay status", "delay", "running data"]],
    ["operator claim", ["operator", "claim", "handoff", "redirect"]],
    ["eligibility", ["eligibility", "qualif"]],
    ["provider integration", ["provider", "api", "integration"]],
    ["service data", ["service", "journey data", "payload"]],
    ["observability", ["signal", "alert", "metric", "observability", "logging"]],
    ["reliability", ["retry", "fallback", "failure", "degraded"]],
  ];

  const detected = keywordMap.filter(([, patterns]) => patterns.some((pattern) => source.includes(pattern))).map(([label]) => label);

  if (detected.length > 0) {
    return detected;
  }

  const stopwords = new Set(["product", "feature", "story", "task", "user", "journey", "outcome", "system", "work", "item", "productos", "product", "codebase"]);
  return [...new Set(source.match(/[a-z][a-z0-9-]{3,}/g) ?? [])].filter((token) => !stopwords.has(token)).slice(0, 6);
}

function buildRequirements(input: GenerateWorkItemPromptInput): string {
  const criteria =
    input.workItem.acceptanceCriteria && normalizeWhitespace(input.workItem.acceptanceCriteria)
      ? normalizeWhitespace(input.workItem.acceptanceCriteria)
      : normalizeWhitespace(
          generateAcceptanceCriteria({
            type: input.workItem.type,
            title: input.workItem.title,
            description: input.workItem.description,
            deliveryContext: input.deliveryContext
              ? {
                  persona: input.deliveryContext.persona,
                  journey: input.deliveryContext.journey,
                  journeyStep: input.deliveryContext.journeyStep,
                  outcome: input.deliveryContext.outcome,
                }
              : null,
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

  if (!criteria) {
    return "- Define the observable requirements before implementation.";
  }

  return /\bGiven\b/.test(criteria) && /\bWhen\b/.test(criteria) && /\bThen\b/.test(criteria) ? criteria : toBullets(parseBullets(criteria));
}

export function generateCodexPrompt(input: GenerateWorkItemPromptInput): string {
  const workItemDetails = parseStructuredDescription(input.workItem.description);
  const parentDetails = parseStructuredDescription(input.parent?.description);
  const grandparentDetails = parseStructuredDescription(input.grandparent?.description);
  const domainKeywords = buildDomainKeywords(input, [workItemDetails, parentDetails, grandparentDetails]);
  const featureTitle =
    input.deliveryContext?.feature ??
    (input.workItem.type === "story"
      ? input.parent?.title
      : input.workItem.type === "task"
        ? input.grandparent?.title
        : undefined);
  const storyTitle =
    input.deliveryContext?.story ?? (input.workItem.type === "task" ? input.parent?.title : input.workItem.type === "story" ? input.workItem.title : undefined);
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
  const persona = input.deliveryContext?.persona ?? workItemDetails.persona ?? parentDetails.persona ?? grandparentDetails.persona;
  const journeyStep = workItemDetails.journeyStep ?? parentDetails.journeyStep ?? grandparentDetails.journeyStep ?? input.deliveryContext?.journeyStep;
  const journey = workItemDetails.journey ?? parentDetails.journey ?? grandparentDetails.journey ?? input.deliveryContext?.journey;
  const userOutcome =
    workItemDetails.desiredOutcome ??
    workItemDetails.linkedOutcome ??
    workItemDetails.userOutcome ??
    parentDetails.desiredOutcome ??
    parentDetails.linkedOutcome ??
    parentDetails.userOutcome ??
    input.deliveryContext?.outcome;
  const technicalNotes = [
    ...(workItemDetails.scopeOfWork ?? []),
    ...(workItemDetails.operationalReadiness ?? []),
    ...(workItemDetails.definitionOfDone ?? []),
    ...(workItemDetails.dependencies ?? []),
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
    "Working mode:",
    "- Behave as a combined Lead Product Owner, Lead Engineer, and Agile Delivery Lead.",
    "- Preserve customer outcome alignment, implementation realism, and delivery traceability.",
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

  if (journey) {
    promptSections.push("", "Journey:", journey);
  }

  if (userOutcome) {
    promptSections.push("", "Desired user outcome:", userOutcome);
  }

  if (domainKeywords.length > 0) {
    promptSections.push("", "Domain keywords:", toBullets(domainKeywords));
  }

  if (workItemDetails.problemNeed) {
    promptSections.push("", "Problem / need:", workItemDetails.problemNeed);
  }

  if (workItemDetails.contextBackground) {
    promptSections.push("", "Context / background:", workItemDetails.contextBackground);
  }

  const deliverables = [
    ...(workItemDetails.deliverables ?? []),
    ...(workItemDetails.deliverable ? [workItemDetails.deliverable] : []),
  ];
  if (deliverables.length > 0) {
    promptSections.push("", "Deliverables:", toBullets(deliverables));
  }

  promptSections.push("", "Acceptance criteria:", buildRequirements(input));

  if (technicalNotes.length > 0) {
    promptSections.push("", "Technical notes:", toBullets(technicalNotes));
  }

  promptSections.push("", "Constraints:", "- Keep the implementation deterministic and lightweight.", "- Do not introduce AI inside Product OS.");

  return promptSections.join("\n");
}
