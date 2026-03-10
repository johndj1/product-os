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
  pattern:
    | "delay_status"
    | "eligibility_decision"
    | "claim_handoff"
    | "integration"
    | "ui_flow"
    | "reliability"
    | "general";
  stories: GeneratedStory[];
};

type FeatureDecompositionInput = {
  featureTitle: string;
  featureDescription?: string | null;
  deliveryContext?: {
    productName?: string | null;
    persona?: string | null;
    journey?: string | null;
    journeyStep?: string | null;
    outcome?: string | null;
  } | null;
};

type StoryFacet = "integration" | "data" | "ui" | "observability" | "reliability" | "security" | "operations";

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function toContextText(input: FeatureDecompositionInput): string {
  return [
    input.featureTitle,
    input.featureDescription ?? "",
    input.deliveryContext?.productName ?? "",
    input.deliveryContext?.persona ?? "",
    input.deliveryContext?.journey ?? "",
    input.deliveryContext?.journeyStep ?? "",
    input.deliveryContext?.outcome ?? "",
  ]
    .join(" ")
    .trim()
    .toLowerCase();
}

function buildTask(title: string, description: string): GeneratedTask {
  return { title, description };
}

function buildStory(title: string, description: string, tasks: GeneratedTask[]): GeneratedStory {
  return { title, description, tasks };
}

function getIntegrationSubject(input: FeatureDecompositionInput): string {
  const context = `${input.featureTitle} ${input.featureDescription ?? ""}`.trim();
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

function buildFacetStory(facet: StoryFacet, input: FeatureDecompositionInput): GeneratedStory {
  const title = input.featureTitle;
  const subject = getIntegrationSubject(input);

  if (facet === "integration") {
    return buildStory(
      includesAny(toContextText(input), ["delay", "status", "running", "search", "service"])
        ? "Retrieve service running data for the searched journey"
        : `Integrate the upstream contract for ${title}`,
      "Define and implement the dependency path the Feature needs before downstream behaviour can be trusted.",
      [
        buildTask(
          subject === "the provider" ? "Confirm the dependency contract and required inputs" : `Confirm the ${subject} contract and required inputs`,
          "Capture the request trigger, required identifiers, and minimum success payload for the first delivery slice.",
        ),
        buildTask(
          subject === "the provider" ? "Implement the dependency request path" : `Implement the ${subject} request path`,
          "Add the deterministic integration code needed to support the parent Feature.",
        ),
        buildTask(
          "Verify representative success and partial-data cases",
          "Cover the main contract examples the team expects to rely on for delivery handoff.",
        ),
      ],
    );
  }

  if (facet === "data") {
    return buildStory(
      includesAny(toContextText(input), ["delay", "status", "late", "running"])
        ? "Interpret delay status from service data"
        : includesAny(toContextText(input), ["eligibility", "qualif", "repay"])
          ? "Interpret eligibility decisions from the available evidence"
          : `Translate ${title} into deterministic domain rules`,
      "Turn raw inputs into stable decisions, mapped data, or domain behaviour that the Feature can rely on.",
      [
        buildTask("Define the mapping or decision rules", "State the rules that turn incoming data into the behaviour required by the Feature."),
        buildTask("Handle ambiguous, missing, and out-of-bounds data", "Protect the product against false confidence and hidden edge cases."),
        buildTask("Add tests for representative business cases", "Verify the main rule paths and the most important exceptions."),
      ],
    );
  }

  if (facet === "ui") {
    return buildStory(
      includesAny(toContextText(input), ["delay", "status", "search"])
        ? "Present delay status clearly in the UI"
        : includesAny(toContextText(input), ["eligibility", "repay"])
          ? "Present the eligibility decision clearly in the UI"
          : includesAny(toContextText(input), ["claim", "handoff", "redirect", "operator"])
            ? "Guide the user through the operator handoff in the UI"
            : `Present ${title} clearly in the user flow`,
      "Make the Feature visible and understandable in the main journey path, including the core interaction states.",
      [
        buildTask("Implement the main UI state and result presentation", "Expose the primary Feature outcome at the right point in the journey."),
        buildTask("Handle loading, empty, unavailable, and validation states", "Avoid broken or misleading UI transitions during non-happy-path use."),
        buildTask("Verify the Story works across the intended device contexts", "Check the main interaction path on the layouts the product expects to support."),
      ],
    );
  }

  if (facet === "observability") {
    return buildStory(
      `Add observability for ${title}`,
      "Expose the operational evidence needed to understand whether the Feature is working as intended in live use.",
      [
        buildTask("Define the events, logs, or signals to emit", "Keep the instrumentation focused on the Feature outcome and the main failure path."),
        buildTask("Wire the instrumentation into the core behaviour", "Ensure the product emits the agreed operational evidence at the right points."),
        buildTask("Verify operational evidence is actionable", "Confirm recurring issues can be detected and triaged from the generated signal."),
      ],
    );
  }

  if (facet === "reliability") {
    return buildStory(
      includesAny(toContextText(input), ["delay", "status", "provider", "darwin", "service"])
        ? "Handle provider failures and user trust signals"
        : `Handle reliability risks for ${title}`,
      "Make the Feature resilient enough for production-like use by defining fallback, recovery, and user trust behaviour.",
      [
        buildTask("Classify the main failure modes and degraded states", "State which failures matter most and how the product should respond."),
        buildTask("Implement fallback, retry, or recovery behaviour", "Add the minimum resilience behaviour that fits the delivery slice."),
        buildTask("Verify trust-preserving behaviour in failure scenarios", "Ensure the user does not see misleading success states when dependencies fail."),
      ],
    );
  }

  if (facet === "security") {
    return buildStory(
      `Define governance and audit boundaries for ${title}`,
      "Keep the Feature operationally valid by making governance, audit, or access boundaries explicit.",
      [
        buildTask("Identify the audit or governance expectations", "Clarify what must be recorded, protected, or constrained for the Feature."),
        buildTask("Implement the minimum control or validation path", "Add only the controls needed for a safe first slice."),
        buildTask("Verify the evidence needed for review exists", "Ensure later reviewers can understand what happened and why."),
      ],
    );
  }

  return buildStory(
    `Prepare rollout and support readiness for ${title}`,
    "Make the Feature supportable and release-ready without turning this slice into a large programme of work.",
    [
      buildTask("Define the first rollout and support path", "Capture how the team will validate and support the Feature after release."),
      buildTask("Document the key manual checks and recovery steps", "Give delivery and support a practical first-response path."),
      buildTask("Verify the handoff evidence is complete", "Ensure operational notes, checks, and signals are ready for use."),
    ],
  );
}

function buildDelayStatusStories(input: FeatureDecompositionInput): GeneratedStory[] {
  return [
    buildFacetStory("integration", input),
    buildFacetStory("data", input),
    buildFacetStory("ui", input),
    buildFacetStory("reliability", input),
  ];
}

function buildEligibilityStories(input: FeatureDecompositionInput): GeneratedStory[] {
  return [
    buildFacetStory("integration", input),
    buildFacetStory("data", input),
    buildFacetStory("ui", input),
    buildFacetStory("observability", input),
  ];
}

function buildClaimHandoffStories(input: FeatureDecompositionInput): GeneratedStory[] {
  return [
    buildStory(
      "Identify the responsible operator and claim path",
      "Resolve the operator and handoff route the product should use for the current journey.",
      [
        buildTask("Define the operator selection rules", "State how the product decides which claim path applies."),
        buildTask("Implement operator lookup or mapping logic", "Connect the relevant data to the claim-path decision."),
        buildTask("Verify supported and unsupported operator cases", "Cover the main handoff branches before UI wiring."),
      ],
    ),
    buildStory(
      "Assemble claim-ready journey context for handoff",
      "Prepare the minimum data package needed to start the operator claim path without user re-entry where possible.",
      [
        buildTask("Define the journey fields required by the claim handoff", "Capture the minimum payload needed for a valid redirect or handoff."),
        buildTask("Build the claim handoff payload", "Assemble the data in the format required by the destination path."),
        buildTask("Verify missing or partial journey data handling", "Avoid broken claim starts when the product lacks confidence."),
      ],
    ),
    buildFacetStory("ui", input),
    buildFacetStory("reliability", input),
  ];
}

function buildIntegrationStories(input: FeatureDecompositionInput): GeneratedStory[] {
  return [
    buildFacetStory("integration", input),
    buildFacetStory("data", input),
    buildFacetStory("observability", input),
    buildFacetStory("reliability", input),
  ];
}

function buildUiFlowStories(input: FeatureDecompositionInput): GeneratedStory[] {
  return [
    buildStory(
      `Define the journey entry and decision points for ${input.featureTitle}`,
      "Turn the parent Feature into a specific user-path contract before implementation expands.",
      [
        buildTask("Break the journey into user decisions and result states", "State the screens, transitions, and outcomes the Feature needs."),
        buildTask("Confirm the minimum information and copy required", "Define the inputs and explanations the user needs to succeed."),
        buildTask("Agree the first release slice", "Keep the initial flow narrow enough to ship and validate."),
      ],
    ),
    buildFacetStory("ui", input),
    buildFacetStory("reliability", input),
    buildFacetStory("observability", input),
  ];
}

function buildReliabilityStories(input: FeatureDecompositionInput): GeneratedStory[] {
  return [
    buildFacetStory("reliability", input),
    buildFacetStory("observability", input),
    buildFacetStory("operations", input),
    buildFacetStory("security", input),
  ];
}

function uniqueFacets(facets: StoryFacet[]): StoryFacet[] {
  return [...new Set(facets)];
}

function buildGeneralStories(input: FeatureDecompositionInput): GeneratedStory[] {
  const text = toContextText(input);
  const facets = uniqueFacets([
    includesAny(text, ["api", "provider", "integration", "darwin", "service"]) ? "integration" : "ui",
    includesAny(text, ["eligibility", "decision", "data", "normalis", "normalize", "interpret", "status"]) ? "data" : "ui",
    includesAny(text, ["monitor", "signal", "alert", "metric"]) ? "observability" : "reliability",
    includesAny(text, ["security", "audit", "govern", "permission"]) ? "security" : "operations",
  ]);

  return facets.map((facet) => buildFacetStory(facet, input));
}

export function generateFeatureDecomposition(input: FeatureDecompositionInput): FeatureDecomposition {
  const context = toContextText(input);

  if (includesAny(context, ["delay", "running", "service status", "delayed train", "train delay"])) {
    return { pattern: "delay_status", stories: buildDelayStatusStories(input) };
  }

  if (includesAny(context, ["eligibility", "qualifies", "qualify", "delay repay"])) {
    return { pattern: "eligibility_decision", stories: buildEligibilityStories(input) };
  }

  if (includesAny(context, ["claim", "handoff", "redirect", "operator compensation", "operator claim"])) {
    return { pattern: "claim_handoff", stories: buildClaimHandoffStories(input) };
  }

  if (includesAny(context, ["integration", "api", "provider", "webhook", "sync", "ingest"])) {
    return { pattern: "integration", stories: buildIntegrationStories(input) };
  }

  if (includesAny(context, ["ui", "ux", "screen", "page", "form", "flow", "journey", "onboarding", "checkout", "search"])) {
    return { pattern: "ui_flow", stories: buildUiFlowStories(input) };
  }

  if (includesAny(context, ["reliability", "resilience", "retry", "failure", "outage", "monitor", "alert", "fallback", "incident"])) {
    return { pattern: "reliability", stories: buildReliabilityStories(input) };
  }

  return { pattern: "general", stories: buildGeneralStories(input) };
}
