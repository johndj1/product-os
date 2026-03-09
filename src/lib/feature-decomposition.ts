type GeneratedTask = {
  title: string;
  description?: string;
};

type GeneratedStory = {
  title: string;
  description?: string;
  tasks: GeneratedTask[];
};

export type FeatureDecomposition = {
  pattern: "integration" | "ui_flow" | "reliability" | "general";
  stories: GeneratedStory[];
};

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function toContextText(title: string, description?: string | null): string {
  return `${title} ${description ?? ""}`.trim().toLowerCase();
}

function getIntegrationSubject(title: string, description?: string | null): string {
  const context = `${title} ${description ?? ""}`.trim();
  const lower = context.toLowerCase();

  if (lower.includes("darwin")) {
    return "Darwin";
  }

  const integrationMatch = context.match(/([A-Z][A-Za-z0-9-]+(?:\s+[A-Z][A-Za-z0-9-]+)*)\s+(API|integration|provider|service)/);
  if (integrationMatch) {
    return integrationMatch[1];
  }

  const apiMatch = context.match(/([A-Z][A-Za-z0-9-]+)\s+API/);
  if (apiMatch) {
    return apiMatch[1];
  }

  return "the provider";
}

function buildDarwinIntegrationStories(): GeneratedStory[] {
  return [
    {
      title: "Retrieve live running data from Darwin",
      description: "Establish the integration path needed to fetch live rail service information.",
      tasks: [
        { title: "Define Darwin credentials, endpoints, and request configuration" },
        { title: "Implement a Darwin client for live running data retrieval" },
        { title: "Add fixture coverage for successful Darwin responses" },
      ],
    },
    {
      title: "Normalise Darwin service data",
      description: "Translate provider-specific responses into the Product OS and Check-a-Train domain shape.",
      tasks: [
        { title: "Map Darwin response fields to the internal service model" },
        { title: "Handle incomplete or delayed service attributes safely" },
        { title: "Add transformation tests for representative Darwin payloads" },
      ],
    },
    {
      title: "Handle provider failures gracefully",
      description: "Ensure the product degrades safely when Darwin is unavailable or unstable.",
      tasks: [
        { title: "Classify Darwin failure modes and define retry boundaries" },
        { title: "Add fallback behaviour and user-safe error handling" },
        { title: "Emit operational logging for Darwin failures and retries" },
      ],
    },
  ];
}

function buildGenericIntegrationStories(subject: string): GeneratedStory[] {
  const providerLabel = subject === "the provider" ? subject : `${subject} provider`;
  const subjectLabel = subject === "the provider" ? "provider data" : `${subject} data`;

  return [
    {
      title: `Connect to ${subject} and retrieve source data`,
      description: `Create the base integration path for ${subject}.`,
      tasks: [
        { title: `Define configuration and access requirements for ${subject}` },
        { title: `Implement the ${subject} client and request flow` },
        { title: `Add fixture coverage for successful ${subject} responses` },
      ],
    },
    {
      title: `Normalise ${subjectLabel}`,
      description: "Convert external responses into the internal domain model.",
      tasks: [
        { title: `Map ${subject} payload fields to internal entities` },
        { title: `Handle missing or unexpected ${subject} values safely` },
        { title: `Add transformation tests for representative ${subject} payloads` },
      ],
    },
    {
      title: `Handle ${providerLabel} failures gracefully`,
      description: "Protect the product against provider instability.",
      tasks: [
        { title: `Classify ${subject} error modes and retry boundaries` },
        { title: `Add fallback handling for ${subject} outages or timeouts` },
        { title: `Emit logging and alerts for ${subject} integration failures` },
      ],
    },
  ];
}

function buildUiFlowStories(title: string): GeneratedStory[] {
  return [
    {
      title: `Define the primary user flow for ${title}`,
      description: "Clarify the key path, inputs, and expected outcomes before implementation.",
      tasks: [
        { title: "Break the flow into screens, states, and decision points" },
        { title: "Define required inputs, outputs, and supporting copy" },
        { title: "Capture acceptance criteria for the happy path" },
      ],
    },
    {
      title: `Implement the interactive UI for ${title}`,
      description: "Build the visible flow and connect it to the underlying product behaviour.",
      tasks: [
        { title: "Implement the core UI states and transitions" },
        { title: "Connect form actions or page events to backend behaviour" },
        { title: "Review mobile and desktop usability for the flow" },
      ],
    },
    {
      title: `Handle edge cases and trust signals for ${title}`,
      description: "Make the flow resilient, understandable, and safe to ship.",
      tasks: [
        { title: "Add validation, empty, loading, and error states" },
        { title: "Cover important edge cases with tests" },
        { title: "Add analytics or instrumentation for flow completion and drop-off" },
      ],
    },
  ];
}

function buildReliabilityStories(title: string): GeneratedStory[] {
  return [
    {
      title: `Identify failure modes for ${title}`,
      description: "Make the reliability work concrete before implementation starts.",
      tasks: [
        { title: "List the main failure modes and user impact" },
        { title: "Define detection signals and severity thresholds" },
        { title: "Agree the minimum acceptable degraded behaviour" },
      ],
    },
    {
      title: `Add safeguards and recovery paths for ${title}`,
      description: "Reduce the chance of failure and improve product recovery.",
      tasks: [
        { title: "Implement retries, timeouts, or circuit breakers where appropriate" },
        { title: "Add fallback behaviour for degraded operation" },
        { title: "Test recovery behaviour for the main failure scenarios" },
      ],
    },
    {
      title: `Instrument and operationalise ${title}`,
      description: "Make the work observable and actionable during live operations.",
      tasks: [
        { title: "Add structured logs, metrics, or alerts" },
        { title: "Document investigation steps for recurring failures" },
        { title: "Validate that monitoring catches simulated failures" },
      ],
    },
  ];
}

function buildGeneralStories(title: string): GeneratedStory[] {
  return [
    {
      title: `Define the domain changes for ${title}`,
      description: "Translate the feature into a clear implementation shape.",
      tasks: [
        { title: "Identify impacted entities, services, and interfaces" },
        { title: "Define the minimum acceptance criteria for the feature" },
        { title: "Confirm any assumptions or constraints in the implementation approach" },
      ],
    },
    {
      title: `Implement the core behaviour for ${title}`,
      description: "Deliver the main product capability behind the feature.",
      tasks: [
        { title: "Implement the primary code path for the feature" },
        { title: "Add the supporting integration or UI wiring" },
        { title: "Verify the happy path works end to end" },
      ],
    },
    {
      title: `Harden and verify ${title}`,
      description: "Raise confidence before the work is handed off or shipped.",
      tasks: [
        { title: "Add regression coverage for the main scenarios" },
        { title: "Handle failure states and operational visibility" },
        { title: "Review readiness against the feature acceptance criteria" },
      ],
    },
  ];
}

export function generateFeatureDecomposition(featureTitle: string, featureDescription?: string | null): FeatureDecomposition {
  const context = toContextText(featureTitle, featureDescription);

  if (includesAny(context, ["integration", "api", "provider", "webhook", "sync", "ingest"])) {
    const stories = context.includes("darwin") ? buildDarwinIntegrationStories() : buildGenericIntegrationStories(getIntegrationSubject(featureTitle, featureDescription));
    return { pattern: "integration", stories };
  }

  if (includesAny(context, ["ui", "ux", "screen", "page", "form", "flow", "journey", "onboarding", "checkout"])) {
    return { pattern: "ui_flow", stories: buildUiFlowStories(featureTitle) };
  }

  if (includesAny(context, ["reliability", "resilience", "retry", "failure", "outage", "monitor", "alert", "fallback", "incident"])) {
    return { pattern: "reliability", stories: buildReliabilityStories(featureTitle) };
  }

  return { pattern: "general", stories: buildGeneralStories(featureTitle) };
}
