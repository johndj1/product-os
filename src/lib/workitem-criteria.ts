import { WorkItemType } from "@prisma/client";
import { assertGeneratedWorkItemQuality } from "./workitem-templates";

type DeliveryContext = {
  productName?: string | null;
  persona?: string | null;
  journey?: string | null;
  journeyStep?: string | null;
  outcome?: string | null;
};

type WorkItemContext = {
  type: WorkItemType;
  title: string;
  description?: string | null;
  deliveryContext?: DeliveryContext | null;
  parent?: {
    type: WorkItemType;
    title: string;
    description?: string | null;
    parent?: {
      type: WorkItemType;
      title: string;
      description?: string | null;
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
    context.parent?.parent?.description,
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

function renderSection(label: string, value: string): string {
  return `${label}:\n${normalizeWhitespace(value)}`;
}

function renderBulletSection(label: string, bullets: string[]): string {
  return `${label}:\n${bulletize(bullets)}`;
}

function compactBullets(values: Array<string | null | undefined>): string[] {
  return values.map((value) => value?.trim()).filter(Boolean) as string[];
}

function buildFeatureScopeIncludes(context: WorkItemContext, subject: string): string[] {
  const text = toContextText(context);

  return compactBullets([
    `Deliver the main user or system capability for ${subject}.`,
    text.includes("api") || text.includes("provider") || text.includes("integration") || text.includes("darwin")
      ? "Define and implement the required external or internal integration contract."
      : "Define the core domain rules and implementation boundaries for the Feature.",
    text.includes("ui") || text.includes("journey") || text.includes("screen") || text.includes("search")
      ? "Cover the primary user interaction path that exposes the Feature value."
      : "Cover the primary product surface that makes the Feature outcome observable.",
    "Make operational visibility and failure handling explicit for the first delivery slice.",
  ]);
}

function buildFeatureOutOfScope(context: WorkItemContext): string[] {
  const text = toContextText(context);

  return compactBullets([
    "Speculative follow-on enhancements that are not required for the first outcome-linked slice.",
    text.includes("integration") || text.includes("provider") ? "Building broad provider-management tooling beyond the current Feature boundary." : null,
    text.includes("ui") || text.includes("flow") ? "A full redesign of adjacent journeys that do not directly improve the linked Outcome." : null,
    "Background automation or platform complexity that is not needed to deliver the current Feature safely.",
  ]);
}

function buildDependencies(context: WorkItemContext, subject: string): string[] {
  const text = toContextText(context);

  return compactBullets([
    context.deliveryContext?.outcome ? `Linked customer outcome: ${context.deliveryContext.outcome}.` : null,
    context.deliveryContext?.journeyStep ? `Journey step context: ${context.deliveryContext.journeyStep}.` : null,
    context.deliveryContext?.journey ? `Journey context: ${context.deliveryContext.journey}.` : null,
    context.deliveryContext?.persona ? `Primary persona: ${context.deliveryContext.persona}.` : null,
    text.includes("darwin") ? "Darwin credentials, request contract, and service response handling." : null,
    text.includes("provider") || text.includes("api") ? `Reliable upstream data or service access for ${subject}.` : null,
    "Existing Product OS domain rules, route flows, and verification paths.",
  ]);
}

function buildFeatureValue(context: WorkItemContext, subject: string): string {
  const outcome = context.deliveryContext?.outcome ?? `the intended customer outcome behind ${subject}`;
  const journeyStep = context.deliveryContext?.journeyStep ? ` at the journey step "${context.deliveryContext.journeyStep}"` : "";
  return `Improve ${outcome}${journeyStep} by making ${subject} clear enough to plan, build, verify, and operate without losing customer traceability.`;
}

function buildFeatureDefinitionOfDone(context: WorkItemContext, subject: string): string[] {
  const text = toContextText(context);

  return compactBullets([
    `${toSentenceCase(subject)} is described in an outcome-linked, execution-ready format.`,
    "Acceptance criteria, dependencies, and boundaries are explicit enough for delivery handoff.",
    text.includes("provider") || text.includes("api") || text.includes("darwin")
      ? "Integration assumptions, failure handling, and observability expectations are documented."
      : "Main implementation, UX, or domain constraints are documented.",
    "The Feature can be decomposed into reviewable Stories without hidden scope.",
  ]);
}

function buildFeatureDescription(context: WorkItemContext): string {
  const subject = stripLeadingVerb(context.title);
  const summary =
    context.description
      ? normalizeWhitespace(context.description)
      : `Create the thinnest viable feature slice for ${subject} that improves the linked customer outcome.`;
  const acceptanceCriteria = buildFeatureCriteria(context);
  const sections = [
    renderSection("Title", context.title),
    "",
    renderSection("Summary", summary),
    "",
    renderBulletSection("Scope Includes", buildFeatureScopeIncludes(context, subject)),
    "",
    renderBulletSection("Out of Scope", buildFeatureOutOfScope(context)),
    "",
    renderBulletSection("Dependencies", buildDependencies(context, subject)),
    "",
    renderSection("Value", buildFeatureValue(context, subject)),
    "",
    renderSection("Acceptance Criteria", acceptanceCriteria),
    "",
    renderBulletSection("Definition of Done", buildFeatureDefinitionOfDone(context, subject)),
  ];

  return sections.join("\n");
}

function getStoryCategory(context: WorkItemContext): "integration" | "data" | "ui" | "observability" | "reliability" | "security" | "operations" | "general" {
  const text = toContextText(context);

  if (text.includes("monitor") || text.includes("observ") || text.includes("signal") || text.includes("metric") || text.includes("alert")) {
    return "observability";
  }

  if (text.includes("failure") || text.includes("retry") || text.includes("fallback") || text.includes("resilien") || text.includes("error")) {
    return "reliability";
  }

  if (text.includes("security") || text.includes("govern") || text.includes("permission") || text.includes("audit") || text.includes("compliance")) {
    return "security";
  }

  if (text.includes("rollout") || text.includes("support") || text.includes("runbook") || text.includes("operations")) {
    return "operations";
  }

  if (text.includes("ui") || text.includes("screen") || text.includes("search") || text.includes("form") || text.includes("present") || text.includes("display")) {
    return "ui";
  }

  if (text.includes("data") || text.includes("normalis") || text.includes("normalize") || text.includes("interpret") || text.includes("eligibility")) {
    return "data";
  }

  if (text.includes("api") || text.includes("provider") || text.includes("integration") || text.includes("darwin") || text.includes("retrieve")) {
    return "integration";
  }

  return "general";
}

function buildStoryContextBackground(context: WorkItemContext, category: ReturnType<typeof getStoryCategory>): string {
  const subject = stripLeadingVerb(context.title);
  const parentLabel = context.parent ? `${context.parent.type} "${context.parent.title}"` : "the parent delivery scope";
  const facet =
    category === "integration"
      ? "integration contract and upstream dependency"
      : category === "data"
        ? "domain interpretation and data handling"
        : category === "ui"
          ? "user-visible interaction flow"
          : category === "observability"
            ? "observability and operational evidence"
            : category === "reliability"
              ? "failure handling and recovery behaviour"
              : category === "security"
                ? "governance, auditability, and access boundaries"
                : category === "operations"
                  ? "rollout, support, and operating readiness"
                  : "core delivery slice";

  return `${toSentenceCase(subject)} is one reviewable Story within ${parentLabel}. It carries the ${facet} needed to improve the linked outcome without expanding into unrelated backlog.`;
}

function buildStoryProblemNeed(context: WorkItemContext, category: ReturnType<typeof getStoryCategory>): string {
  const subject = stripLeadingVerb(context.title);
  const outcome = context.deliveryContext?.outcome ?? "the linked customer outcome";

  if (category === "integration") {
    return `Without a reliable contract for ${subject}, the product cannot turn external or internal service data into trustworthy behaviour for ${outcome}.`;
  }

  if (category === "data") {
    return `Without clear interpretation rules for ${subject}, the system risks inconsistent decisions, weak traceability, and low confidence in ${outcome}.`;
  }

  if (category === "ui") {
    return `Without a clear user-facing implementation of ${subject}, the product cannot make ${outcome} visible or actionable in the journey.`;
  }

  if (category === "observability") {
    return `Without operational evidence for ${subject}, the team cannot confirm whether the Story is healthy enough to support ${outcome} in live use.`;
  }

  if (category === "reliability") {
    return `Without explicit failure handling for ${subject}, the product risks user distrust and fragile delivery around ${outcome}.`;
  }

  if (category === "security") {
    return `Without explicit governance and audit handling for ${subject}, the Story may be operationally unsafe even if the happy path works.`;
  }

  if (category === "operations") {
    return `Without rollout and support readiness for ${subject}, the team may ship work that is difficult to operate or hand over responsibly.`;
  }

  return `The product needs ${subject} to be implemented as a bounded, verifiable Story so delivery work remains traceable to ${outcome}.`;
}

function buildStoryScopeOfWork(context: WorkItemContext, category: ReturnType<typeof getStoryCategory>, subject: string): string[] {
  if (category === "integration") {
    return [
      `Define the request, response, and dependency boundaries for ${subject}.`,
      "Implement the main integration path and the minimum contract validation needed for confidence.",
      "Make non-happy-path handling explicit where provider or service conditions affect user trust.",
    ];
  }

  if (category === "data") {
    return [
      `Translate incoming data or business rules into deterministic behaviour for ${subject}.`,
      "Handle the core interpretation, mapping, or decisioning rules used by the parent Feature.",
      "Cover the main edge conditions that would otherwise produce ambiguous output.",
    ];
  }

  if (category === "ui") {
    return [
      `Implement the primary user interaction and result presentation for ${subject}.`,
      "Connect the UI to the underlying domain or integration behaviour needed by the Story.",
      "Handle the key loading, empty, unavailable, or error states that affect trust.",
    ];
  }

  if (category === "observability") {
    return [
      `Add the logs, signals, metrics, or alerts needed to observe ${subject}.`,
      "Ensure recurring failures or regressions can be detected and triaged quickly.",
      "Keep the instrumentation scoped to the parent Feature outcome rather than generic noise.",
    ];
  }

  if (category === "reliability") {
    return [
      `Implement failure handling, retries, fallback, or degraded behaviour for ${subject}.`,
      "Protect the user journey from misleading success states when dependencies fail.",
      "Verify the main recovery path the team expects to rely on in production-like use.",
    ];
  }

  if (category === "security") {
    return [
      `Define the audit, access, and governance boundaries for ${subject}.`,
      "Implement the minimum controls needed for a safe first delivery slice.",
      "Document or expose the evidence needed for later review and support.",
    ];
  }

  if (category === "operations") {
    return [
      `Prepare the rollout, support, or operating model needed for ${subject}.`,
      "Define the manual checks, support signals, or handoff materials needed by delivery and operations.",
      "Keep the operational plan proportional to the current feature slice.",
    ];
  }

  return [
    `Implement the reviewable delivery slice for ${subject}.`,
    "Keep the interfaces, dependencies, and user or system behaviour explicit.",
    "Leave the Story small enough to hand off into concrete implementation tasks.",
  ];
}

function buildStoryOperationalReadiness(context: WorkItemContext, category: ReturnType<typeof getStoryCategory>): string[] {
  const common = [
    "Verification path is clear through tests, fixtures, or an explicit manual check.",
    "Failure or degraded states are visible to the team and understandable to the user where relevant.",
  ];

  if (category === "observability") {
    return [...common, "Instrumentation is specific enough to detect recurring issues without creating generic alert noise."];
  }

  if (category === "operations") {
    return [...common, "Support or rollout guidance exists for the first live use of this Story."];
  }

  if (category === "integration" || category === "reliability") {
    return [...common, "Dependency failure handling is explicit enough for production-like operation."];
  }

  return common;
}

function buildStoryDeliverables(context: WorkItemContext, category: ReturnType<typeof getStoryCategory>, subject: string): string[] {
  const deliverables = [`Code or configuration changes required for ${subject}.`, "Verification assets such as tests, fixtures, or manual validation notes."];

  if (category === "observability" || category === "reliability" || category === "operations") {
    deliverables.push("Operational evidence such as logs, signals, metrics, alerts, or support notes.");
  }

  if (category === "ui") {
    deliverables.push("UI behaviour, copy, or state handling needed for the primary user path.");
  }

  return deliverables;
}

function buildStoryDefinitionOfDone(context: WorkItemContext, subject: string): string[] {
  return [
    `${toSentenceCase(subject)} is implemented as one bounded, reviewable Story slice.`,
    "Acceptance criteria pass and the linked customer outcome is still clear in the handoff.",
    "Dependencies, operational concerns, and verification evidence are documented well enough for the next delivery step.",
  ];
}

function buildStoryDescription(context: WorkItemContext): string {
  const subject = stripLeadingVerb(context.title);
  const summary =
    context.description ? normalizeWhitespace(context.description) : `Deliver the smallest reviewable Story slice for ${subject} within the parent Feature.`;
  const category = getStoryCategory(context);
  const acceptanceCriteria = buildStoryCriteria(context, category);

  return [
    renderSection("Title", context.title),
    "",
    renderSection("Linked Outcome", context.deliveryContext?.outcome ?? "Outcome linkage should be confirmed from the parent Feature."),
    "",
    renderSection("Description", summary),
    "",
    renderSection("Context / Background", buildStoryContextBackground(context, category)),
    "",
    renderSection("Problem / Need", buildStoryProblemNeed(context, category)),
    "",
    renderBulletSection("Scope of Work", buildStoryScopeOfWork(context, category, subject)),
    "",
    renderSection("Acceptance Criteria (Gherkin)", acceptanceCriteria),
    "",
    renderBulletSection("Operational Readiness", buildStoryOperationalReadiness(context, category)),
    "",
    renderBulletSection("Deliverables", buildStoryDeliverables(context, category, subject)),
    "",
    renderBulletSection("Definition of Done", buildStoryDefinitionOfDone(context, subject)),
  ].join("\n");
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

function buildFeatureCriteria(context: WorkItemContext): string {
  const subject = stripLeadingVerb(context.title);

  return bulletize([
    context.deliveryContext?.outcome
      ? `The Feature is explicitly scoped to improving the linked customer outcome: ${context.deliveryContext.outcome}.`
      : `The Feature states the customer outcome it exists to improve for ${subject}.`,
    `The user-visible or system-observable behaviour for ${subject} is clear and bounded.`,
    `Business rules, dependencies, and failure states for ${subject} are defined well enough for delivery handoff.`,
    `The Feature is decomposable into auditable Stories with clear verification paths.`,
  ]);
}

function buildStoryCriteria(context: WorkItemContext, category: ReturnType<typeof getStoryCategory>): string {
  const subject = stripLeadingVerb(context.title);
  const outcome = context.deliveryContext?.outcome ?? "the linked customer outcome";
  const actor =
    category === "observability" || category === "operations" ? "the delivery or operating team" : context.deliveryContext?.persona ?? "the user";

  const scenarioLines =
    category === "integration"
      ? [
          `Given the parent Feature requires ${subject}`,
          "When the required dependency call is made with valid inputs",
          `Then the product receives the contract data needed to support ${outcome}`,
          "",
          `Given the dependency for ${subject} is unavailable or returns partial data`,
          "When the Story path is exercised",
          "Then the system handles the failure explicitly without creating false confidence",
        ]
      : category === "data"
        ? [
            `Given the system has the data needed for ${subject}`,
            "When the interpretation or decision logic runs",
            `Then the resulting behaviour is deterministic and traceable to ${outcome}`,
            "",
            "Given the input data is incomplete, ambiguous, or out of bounds",
            "When the Story logic runs",
            "Then the product handles the condition explicitly instead of silently guessing",
          ]
        : category === "ui"
          ? [
              `Given ${actor} is in the relevant journey step`,
              `When ${actor} uses ${subject}`,
              `Then the primary path clearly supports ${outcome}`,
              "",
              `Given ${actor} encounters a loading, unavailable, or validation issue`,
              "When the Story is exercised",
              "Then the UI presents a clear next state without breaking trust",
            ]
          : category === "observability"
            ? [
                `Given ${subject} runs in the product`,
                "When the key success or failure path occurs",
                "Then the team can observe the event through the expected logs, signals, metrics, or alerts",
                "",
                "Given a recurring problem affects this Story",
                "When the evidence is reviewed",
                "Then the signal is actionable enough to support triage and follow-up work",
              ]
            : category === "reliability"
              ? [
                  `Given ${subject} depends on unstable or failure-prone conditions`,
                  "When the main failure mode occurs",
                  "Then the product uses the intended fallback, retry, or degraded path",
                  "",
                  "Given the dependency recovers",
                  "When the Story path is retried or resumed",
                  "Then the product returns to the expected supported behaviour",
                ]
              : category === "security"
                ? [
                    `Given ${subject} is used within its expected operating boundary`,
                    "When the Story is executed",
                    "Then audit, access, or governance expectations are preserved",
                    "",
                    "Given an invalid or unsupported access path is attempted",
                    "When the Story is exercised",
                    "Then the product blocks or records the action in the intended way",
                  ]
                : category === "operations"
                  ? [
                      `Given ${subject} is ready for first rollout or support use`,
                      "When the team follows the operational path for the Story",
                      "Then the rollout or support evidence is available and understandable",
                      "",
                      "Given the Story needs investigation after release",
                      "When the team reviews the operational notes and signals",
                      "Then the next debugging or support step is clear",
                    ]
                  : [
                      `Given ${subject} is in scope for the parent Feature`,
                      "When the Story is implemented and exercised",
                      `Then it delivers a bounded slice that supports ${outcome}`,
                      "",
                      "Given a relevant edge condition occurs",
                      "When the Story path is exercised",
                      "Then the system handles it explicitly and remains reviewable",
                    ];

  return scenarioLines.join("\n");
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

  if (context.type === "feature") {
    return buildFeatureCriteria(context);
  }

  if (context.type === "story") {
    if (text.includes("operator") && (text.includes("claim") || text.includes("delay repay"))) {
      return [
        "Given a delayed service is linked to a supported operator",
        "When the user starts the claim handoff",
        "Then the product directs the user to the correct operator path with the required journey context",
        "",
        "Given the operator is unsupported or the handoff cannot be completed",
        "When the user attempts the claim path",
        "Then the product presents a clear fallback message instead of a broken redirect",
      ].join("\n");
    }

    return buildStoryCriteria(context, getStoryCategory(context));
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
  if (context.type === "feature") {
    const content = {
      description: buildFeatureDescription(context),
      acceptanceCriteria: generateAcceptanceCriteria(context),
    };

    assertGeneratedWorkItemQuality(context.type, content.description, content.acceptanceCriteria);
    return content;
  }

  if (context.type === "story") {
    const content = {
      description: buildStoryDescription(context),
      acceptanceCriteria: generateAcceptanceCriteria(context),
    };

    assertGeneratedWorkItemQuality(context.type, content.description, content.acceptanceCriteria);
    return content;
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
