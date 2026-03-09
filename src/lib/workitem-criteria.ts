import { WorkItemType } from "@prisma/client";

type WorkItemContext = {
  type: WorkItemType;
  title: string;
  description?: string | null;
  parent?: {
    type: WorkItemType;
    title: string;
    description?: string | null;
    parent?: {
      type: WorkItemType;
      title: string;
    } | null;
  } | null;
};

export type GeneratedWorkItemContent = {
  description: string | null;
  acceptanceCriteria: string | null;
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function bulletize(lines: string[]): string {
  return lines.map((line) => `- ${line.replace(/^[-*]\s*/, "").trim()}`).join("\n");
}

function compactLines(...values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => (value ? normalizeWhitespace(value) : ""))
    .filter(Boolean);
}

function toContextText(context: WorkItemContext): string {
  return compactLines(
    context.title,
    context.description,
    context.parent?.title,
    context.parent?.description,
    context.parent?.parent?.title,
  )
    .join(" ")
    .toLowerCase();
}

function stripLeadingVerb(title: string): string {
  return title
    .replace(/^(define|implement|add|create|handle|review|build|design|map|connect|normalise|normalize|support|deliver)\s+/i, "")
    .trim();
}

function toSentenceCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildStoryDescription(context: WorkItemContext): string {
  const subject = stripLeadingVerb(context.title);
  const parentLabel = context.parent ? `${context.parent.type} "${context.parent.title}"` : "the parent scope";
  const summary = context.description ? normalizeWhitespace(context.description) : `Define the builder-visible behaviour and delivery shape for ${subject}.`;
  const userOutcome = `Allow the builder or end user to complete ${subject} with a clear path and an observable result.`;
  const notes = [
    `Align the story with ${parentLabel}.`,
    "Keep the workflow deterministic and easy to hand off into implementation.",
  ];

  return [`Description: ${summary}`, "", `User outcome: ${userOutcome}`, "", "Implementation notes:", bulletize(notes)].join("\n");
}

function buildTaskDescription(context: WorkItemContext): string {
  const subject = stripLeadingVerb(context.title);
  const objective = `Implement ${subject} in the current Product OS codebase.`;
  const deliverable = `A concrete code change for ${subject} that can be reviewed and verified locally.`;
  const notes = [
    context.parent ? `Parent ${context.parent.type}: ${context.parent.title}` : "Parent story: not linked.",
    "Use the existing Next.js App Router, Prisma, and PostgreSQL patterns in this repository.",
  ];

  return [`Objective: ${objective}`, "", `Deliverable: ${deliverable}`, "", "Technical notes:", bulletize(notes)].join("\n");
}

function buildOperatorClaimCriteria(): string {
  return bulletize([
    "User can identify the correct train operator for the delayed service.",
    "User can start the Delay Repay claim path in one action.",
    "Claim redirect includes the journey metadata needed by the operator flow.",
    "Unsupported operators display a clear message instead of a broken handoff.",
  ]);
}

function buildFlowCriteria(context: WorkItemContext): string {
  const subject = stripLeadingVerb(context.title);
  return bulletize([
    `User can complete the primary flow for ${subject}.`,
    `The key states, transitions, and decisions for ${subject} are visible in the product.`,
    `Validation, empty, and error states for ${subject} are handled clearly.`,
    `The end result for ${subject} is observable and ready for implementation handoff.`,
  ]);
}

function buildTaskUiCriteria(context: WorkItemContext): string {
  const subject = stripLeadingVerb(context.title);
  return bulletize([
    `${toSentenceCase(subject)} is implemented in the intended UI or interaction point.`,
    "The deliverable is connected to the parent Story flow and uses the required product context.",
    "Loading, unavailable, and failure states are handled clearly for the user.",
    "The change can be verified through local checks, tests, or an explicit manual path.",
  ]);
}

function buildGeneralStoryCriteria(context: WorkItemContext): string {
  const subject = stripLeadingVerb(context.title);
  return bulletize([
    `The story outcome for ${subject} is implemented and reviewable end to end.`,
    `The happy path for ${subject} works without relying on undefined behaviour.`,
    `Important edge cases for ${subject} are handled with clear user or builder feedback.`,
    `The story is specific enough to hand off into concrete implementation Tasks.`,
  ]);
}

function buildGeneralTaskCriteria(context: WorkItemContext): string {
  const subject = stripLeadingVerb(context.title);
  return bulletize([
    `${toSentenceCase(subject)} is implemented in code and linked back to the parent Story.`,
    "The concrete deliverable can be inspected directly in the repository.",
    "Relevant technical constraints and affected paths are handled consistently with adjacent code.",
    "The task has a clear verification path through tests, fixtures, or a manual check.",
  ]);
}

export function generateAcceptanceCriteria(context: WorkItemContext): string | null {
  const text = toContextText(context);

  if (context.type === "story") {
    if (text.includes("operator") && (text.includes("claim") || text.includes("delay repay"))) {
      return buildOperatorClaimCriteria();
    }

    if (text.includes("flow") || text.includes("journey") || text.includes("handoff") || text.includes("redirect")) {
      return buildFlowCriteria(context);
    }

    return buildGeneralStoryCriteria(context);
  }

  if (context.type === "task") {
    if (text.includes("button") || text.includes("redirect") || text.includes("handoff") || text.includes("servicecard")) {
      return buildTaskUiCriteria(context);
    }

    return buildGeneralTaskCriteria(context);
  }

  return null;
}

export function generateWorkItemContent(context: WorkItemContext): GeneratedWorkItemContent {
  if (context.type === "story") {
    return {
      description: buildStoryDescription(context),
      acceptanceCriteria: generateAcceptanceCriteria(context),
    };
  }

  if (context.type === "task") {
    return {
      description: buildTaskDescription(context),
      acceptanceCriteria: generateAcceptanceCriteria(context),
    };
  }

  return {
    description: context.description ? normalizeWhitespace(context.description) : null,
    acceptanceCriteria: generateAcceptanceCriteria(context),
  };
}
