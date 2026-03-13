import { PrismaClient, RelationshipType, SignalStatus, SignalType, UserType, WorkItemStatus, WorkItemType } from "@prisma/client";
import { assertAllowedChildType } from "../src/lib/work-item-hierarchy";

const prisma = new PrismaClient();

type CreateWorkItemInput = {
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  type: WorkItemType;
  status?: WorkItemStatus;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  lastUpdatedAt?: Date;
  parentId?: string;
  productId: string;
  createdBy?: string;
};

async function createWorkItem(input: CreateWorkItemInput) {
  if (input.parentId) {
    const parent = await prisma.workItem.findUniqueOrThrow({
      where: { id: input.parentId },
      select: { type: true },
    });
    assertAllowedChildType(parent.type, input.type);
  }

  return prisma.workItem.create({
    data: {
      title: input.title,
      description: input.description,
      acceptance_criteria: input.acceptanceCriteria,
      type: input.type,
      status: input.status ?? WorkItemStatus.new,
      current_value: input.currentValue,
      target_value: input.targetValue,
      unit: input.unit,
      last_updated_at: input.lastUpdatedAt,
      parent_id: input.parentId,
      product_id: input.productId,
      created_by: input.createdBy,
    },
  });
}

async function main() {
  await prisma.comment.deleteMany();
  await prisma.page.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const systemUser = await prisma.user.create({
    data: {
      email: "system@product-os.local",
      name: "Product OS System",
      user_type: UserType.system,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: "Product OS",
      slug: "product-os",
      description: "Dogfooded product for operating outcomes through a canonical product graph.",
      definition_of_done:
        "- Code merged to main\n- Tests passing\n- Documentation updated\n- Deployment path validated",
    },
  });

  const outcome = await createWorkItem({
    title: "Build an AI-native Product OS",
    type: WorkItemType.outcome,
    status: WorkItemStatus.in_progress,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const kpi = await createWorkItem({
    title: "Reduce time from idea to deployed change",
    type: WorkItemType.kpi,
    status: WorkItemStatus.ready,
    currentValue: 14,
    targetValue: 3,
    unit: "days",
    lastUpdatedAt: new Date(),
    parentId: outcome.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const coreGraphCapability = await createWorkItem({
    title: "Core Product Graph",
    type: WorkItemType.capability,
    status: WorkItemStatus.in_progress,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const canonicalDomainFeature = await createWorkItem({
    title: "Canonical domain model",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    parentId: coreGraphCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const defineEntitiesStory = await createWorkItem({
    title: "Define core entities",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    parentId: canonicalDomainFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Implement Product, WorkItem, Page, Comment, User, and Signal schema",
    type: WorkItemType.task,
    status: WorkItemStatus.done,
    parentId: defineEntitiesStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const enforceHierarchyStory = await createWorkItem({
    title: "Enforce golden-thread hierarchy",
    type: WorkItemType.story,
    status: WorkItemStatus.in_progress,
    parentId: canonicalDomainFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Implement hierarchy guardrails for allowed parent-child types",
    type: WorkItemType.task,
    status: WorkItemStatus.in_progress,
    parentId: enforceHierarchyStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const workspaceCapability = await createWorkItem({
    title: "Product workspace",
    type: WorkItemType.capability,
    status: WorkItemStatus.in_progress,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const workspaceShellFeature = await createWorkItem({
    title: "Workspace shell",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    parentId: workspaceCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const createOverviewStory = await createWorkItem({
    title: "Create Product overview page",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    acceptanceCriteria:
      "- Overview route loads Product context\n- KPI summary and recent activity are visible\n- Golden-thread view renders without errors",
    parentId: workspaceShellFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Render golden-thread tree view",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    acceptanceCriteria:
      "- Parent-child hierarchy is rendered in order\n- WorkItem type and status are visible per node\n- Empty state is shown when no WorkItems exist",
    parentId: workspaceShellFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const automationCapability = await createWorkItem({
    title: "Automation foundation",
    type: WorkItemType.capability,
    status: WorkItemStatus.ready,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const workedExampleCapability = await createWorkItem({
    title: "Worked example delivery backlogs",
    type: WorkItemType.capability,
    status: WorkItemStatus.ready,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainHistoricalLookupFeature = await createWorkItem({
    title: "Historical Delay Repay Lookup",
    description:
      "Summary\nAllow Check-a-Train to identify the most likely historical service for a past journey, retrieve actual running data, and present a first-pass Delay Repay eligibility signal.\n\nThis enables users to check whether a past train was delayed or cancelled without manually piecing together operator websites, historical timetables, or rail data sources.\n\nScope Includes\n- Search historical services using HSP serviceMetrics\n- Match services by:\n  - origin station\n  - destination station\n  - approximate departure time\n  - time window\n- Enrich the top matched candidate using HSP serviceDetails\n- Retrieve and normalize:\n  - planned departure/arrival\n  - actual departure/arrival\n  - operator\n  - cancellation status\n- Derive:\n  - first-pass delay status\n  - delay minutes when available\n  - first-pass Delay Repay eligibility signal\n- Present the result in the existing Check-a-Train journey result UI\n\nOut of Scope\n- Full journey planning\n- Multi-leg journey reconstruction\n- Returning all possible route alternatives\n- Operator-specific compensation policy differences\n- Autofilling operator claim forms\n- Background polling or monitoring\n\nDependencies\n- Linked customer outcome: User can view accurate delay information for their train\n- Journey step context: Check delay details\n- Journey context: Claim compensation for a delayed train\n- HSP gateway access and valid API key\n- Existing journey provider orchestration\n- Existing delay derivation and eligibility logic\n- Existing result card UI\n\nValue\nImprove the user's ability to verify whether a past journey was delayed or cancelled by using historical service data rather than live-only board data.\n\nThis gives Check-a-Train a credible historical lookup path and strengthens trust in the product for completed journeys.\n\nDefinition of Done\n- Historical past-date search works end-to-end through the app\n- HSP serviceMetrics and serviceDetails are both integrated\n- Normalized historical service results are returned through /api/journeys\n- Real historical status can be surfaced in the UI\n- The implementation is documented and testable locally\n- Current MVP limitations are documented clearly enough for future refinement",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    acceptanceCriteria:
      "- Historical searches use HSP instead of Darwin live board data\n- HSP serviceMetrics is used to identify plausible candidate services for the searched route and time window\n- The top matched candidate is enriched with HSP serviceDetails using RID\n- The normalized service includes planned and actual timing data where available\n- The system derives a historical status such as On time, Delayed, or Cancelled where supported by the data\n- The result is displayed through the existing journey result flow without requiring a separate UI\n- If HSP enrichment fails, the base historical candidate is still returned safely and eligibility remains unknown rather than being guessed\n- The feature is explicit about current MVP limits, including that only the top matched direct service is returned",
    parentId: workedExampleCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainHistoricalLookupStory = await createWorkItem({
    title: "Use the historical HSP lookup path when live resolution has no match",
    type: WorkItemType.story,
    status: WorkItemStatus.done,
    acceptanceCriteria:
      "- Historical lookup falls back to HSP when the live train lookup path cannot resolve a service\n- Supported historical services now return a usable match via the HSP path\n- Shipped work is recorded separately from follow-on coverage expansion",
    parentId: checkATrainHistoricalLookupFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Wire the historical HSP fallback into service resolution",
    type: WorkItemType.task,
    status: WorkItemStatus.done,
    parentId: checkATrainHistoricalLookupStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainHistoricalInspectionFeature = await createWorkItem({
    title: "Inspect Alternative Historical Services",
    type: WorkItemType.feature,
    status: WorkItemStatus.ready,
    description:
      "Persona\n- Delay Repay claimant verifying a past journey they do not remember precisely\n\nJourney\n- Claim compensation for a delayed train\n\nJourney Step\n- Check delay details\n\nLinked Outcome\n- User can view accurate delay information for their train\n\nSummary\nImprove Check-a-Train after the baseline HSP historical lookup by helping the user inspect a short list of plausible alternative services when the exact train is uncertain.\n\nThis is a product improvement to the verification experience, not a replacement for the existing HSP integration. The original historical lookup Feature remains responsible for finding and enriching the most likely past service. This Feature adds a deliberate inspection layer so the user can compare a few nearby candidates and choose the one that best matches the journey they actually took.\n\nScope Includes\n- Retain a small number of plausible historical candidates from the existing HSP search window\n- Rank candidates by route relevance and departure-time proximity\n- Return the top 3 plausible services when available\n- Keep the best candidate visually primary while exposing alternatives for inspection\n- Show enough summary detail on each candidate for user verification before deeper investigation\n- Reuse the existing historical lookup path and candidate data where possible\n\nOut of Scope\n- Rebuilding the HSP historical lookup integration\n- Full journey planning or route exploration\n- Multi-leg reconstruction\n- Broad search-result browsing beyond a short verification set\n- Operator-specific compensation rules\n\nValue\nUsers who only remember an approximate departure time can verify the correct historical train more confidently instead of being forced to trust a single guessed match.\n\nThis increases trust in Check-a-Train at the moment where the user needs to confirm whether an alternative candidate service is the one that should drive their delay decision.\n\nDefinition of Done\n- Historical searches can expose up to 3 alternative candidates in addition to the leading match\n- Candidate ranking is understandable and stable for nearby historical services\n- The UI supports quick comparison without obscuring the primary recommendation\n- Single-result historical searches continue to work without regression\n- The product distinction between baseline historical lookup and alternative-candidate inspection remains clear in the backlog",
    acceptanceCriteria:
      "Feature: Inspect alternative historical services\n\nScenario: A short list of plausible historical services is retained\nGiven a past-date journey search with several plausible matches in HSP\nWhen the search is executed\nThen the provider returns the leading match plus up to 3 alternative candidates\nAnd the candidates are ranked by route relevance and departure-time proximity\n\nScenario: The UI helps the user verify the right train\nGiven the provider returns several historical candidates\nWhen the results are rendered\nThen the UI keeps the leading match prominent\nAnd each alternative candidate includes enough summary detail for the user to inspect and verify it\n\nScenario: The inspection feature stays deliberately small\nGiven a historical search with many matching services in the time window\nWhen candidates are selected for display\nThen only a short verification set is returned\nAnd the experience does not become a general-purpose historical timetable browser\n\nScenario: Single-match historical journeys still work cleanly\nGiven the search finds only one confident historical match\nWhen the result is rendered\nThen the primary historical result flow behaves as before\nAnd no additional comparison UI is required",
    parentId: workedExampleCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainHistoricalCoverageStory = await createWorkItem({
    title: "Let users inspect alternative historical candidates before choosing the service to verify",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    description:
      "Linked Outcome\n- User can view accurate delay information for their train\n\nPersona\n- Delay Repay claimant who only remembers an approximate departure\n\nJourney\n- Claim compensation for a delayed train\n\nJourney Step\n- Check delay details\n\nDescription\nThe baseline historical HSP lookup identifies and enriches the most likely service for a past journey. That remains useful and should not be reopened as part of this work.\n\nThe gap is user verification. When several nearby services could plausibly be the one the user boarded, returning only a single guessed match can reduce confidence even if the HSP integration itself is working correctly.\n\nThis Story adds a small inspection experience that exposes a short list of alternatives so the user can confirm the correct candidate service.\n\nScope of Work\n- Retain a short list of plausible historical candidates from the existing search window\n- Rank and label alternatives in a way the user can understand\n- Show concise comparison details for each candidate\n- Keep the primary recommendation clear\n- Avoid turning the result into a broad route-search experience\n\nOperational Readiness\n- Candidate count and ranking decisions are visible in logs\n- The result remains safe when fewer than 3 candidates are available\n- The single-match path continues to render without extra UI noise\n\nDefinition of Done\n- The user can inspect a small alternative set when historical certainty is low\n- The primary candidate remains obvious\n- Alternative candidates are useful for verification rather than raw debugging\n- Existing HSP lookup behaviour remains intact for straightforward searches",
    acceptanceCriteria:
      "- Historical candidate inspection is layered on top of the existing HSP lookup path rather than replacing it\n- The user can compare the leading match with up to 3 plausible alternatives\n- Each alternative includes enough detail to support verification of the correct train\n- The UI remains clear when only one result is available",
    parentId: checkATrainHistoricalInspectionFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Define additional historical candidate selection scenarios",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    parentId: checkATrainHistoricalCoverageStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainOnDemandEnrichmentFeature = await createWorkItem({
    title: "On-demand service enrichment for historical candidates",
    type: WorkItemType.feature,
    status: WorkItemStatus.ready,
    description:
      "Summary\nAllow Check-a-Train to return multiple historical candidate services quickly while enriching only the top matched service immediately, then fetch richer HSP serviceDetails for another candidate only when the user opens that candidate's details.\n\nThis is a small product improvement to help users verify an alternative plausible train without slowing the initial search or spending HSP usage on candidates the user never inspects.\n\nScope Includes\n- Render multiple historical candidates quickly from the initial search response\n- Enrich only the top matched historical candidate during the initial search flow\n- Trigger HSP serviceDetails fetch for another candidate when the user opens that candidate's details\n- Update the candidate card or drawer with richer timing, running status, and related historical detail once returned\n- Surface loading and partial-data states clearly so the UX remains responsive while enrichment is in flight\n- Keep the interaction rate-limit aware by avoiding unnecessary secondary candidate enrichments\n\nOut of Scope\n- Reworking historical HSP search or candidate ranking logic\n- Broad HSP provider plumbing changes\n- Global rate-limit handling strategy across all providers\n- Pre-enriching every returned candidate during the initial search\n- Turning candidate inspection into background polling or bulk refresh\n\nDependencies\n- Linked customer outcome: User can view accurate delay information for their train\n- Journey step context: Check delay details\n- Journey context: Claim compensation for a delayed train\n- Existing multiple-candidate historical search response\n- Existing top-candidate HSP serviceDetails enrichment path\n- UI support for opening a candidate card or drawer on demand\n- Safe handling for HSP latency, partial results, and per-candidate loading states\n\nValue\nUsers can inspect another plausible historical train and retrieve fuller running details only when they need them.\n\nThis keeps the first result fast, avoids unnecessary HSP calls, and strengthens trust when the user is verifying which candidate service is the correct train.\n\nDefinition of Done\n- Initial historical search remains fast while showing multiple candidates\n- Only the top matched candidate is enriched during initial load\n- Opening another candidate can fetch HSP serviceDetails on demand\n- The selected candidate updates with richer timing and status data without blocking the rest of the result list\n- The interaction is clearly bounded so it does not depend on broader provider-plumbing or cross-cutting rate-limit work",
    acceptanceCriteria:
      "- Initial historical search renders multiple candidates without waiting for all candidates to be enriched\n- The top matched candidate is enriched immediately during the initial response\n- When the user opens another candidate's details, the system fetches HSP serviceDetails only for that candidate\n- The selected candidate card or drawer updates with richer timing and status data after enrichment completes\n- The UX shows a responsive loading or partial-data state while secondary enrichment is in progress\n- Secondary candidate enrichment avoids unnecessary HSP calls and remains aware of rate-limit pressure without introducing broader provider-level changes",
    parentId: workedExampleCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainOnDemandEnrichmentStory = await createWorkItem({
    title: "Fetch full historical details only when a user opens a secondary candidate",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    description:
      "Linked Outcome\n- User can view accurate delay information for their train\n\nPersona\n- Delay Repay claimant verifying which of several plausible historical trains they actually took\n\nJourney\n- Claim compensation for a delayed train\n\nJourney Step\n- Check delay details\n\nDescription\nCheck-a-Train can already return multiple historical candidates and enrich the top match. The remaining gap is that secondary candidates stay metrics-only, even when the user actively opens one to verify whether it is the correct train.\n\nThis Story adds a small on-demand enrichment step so richer HSP serviceDetails are fetched only for the candidate the user chooses to inspect.\n\nScope of Work\n- Keep initial result rendering fast\n- Enrich only the top candidate on initial load\n- Trigger per-candidate HSP detail fetch on user open\n- Refresh the opened card or drawer with richer historical detail\n- Preserve responsive UX and avoid wasteful enrichment calls\n\nDefinition of Done\n- Secondary candidates can be enriched individually on demand\n- The rest of the result list remains usable while enrichment is loading\n- The interaction remains scoped to candidate inspection rather than broader provider rework",
    acceptanceCriteria:
      "- A user action is required before a secondary historical candidate is enriched\n- On-demand enrichment updates only the selected candidate's detailed view\n- The existing top-candidate initial enrichment path is preserved\n- Failure or slowness for one secondary candidate does not block the rest of the search results",
    parentId: checkATrainOnDemandEnrichmentFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Define the on-demand enrichment interaction for secondary historical candidates",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    parentId: checkATrainOnDemandEnrichmentStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainRateLimitHandlingFeature = await createWorkItem({
    title: "HSP Rate Limit Resilience",
    type: WorkItemType.feature,
    status: WorkItemStatus.ready,
    description:
      "Persona\n- Delay Repay claimant checking whether a recently completed train was delayed or cancelled\n\nJourney\n- Claim compensation for a delayed train\n\nJourney Step\n- Check delay details\n\nLinked Outcome\n- User can view accurate delay information for their train\n\nSummary\nAdd a small Check-a-Train reliability improvement for HSP historical lookups when the provider returns HTTP 429 spike-arrest rate-limit responses.\n\nObserved development behaviour shows that the first HSP request can fail with a 429 error such as \"Allowed rate: 1 request per second\", while a retry after about 1 second often succeeds. This Feature should detect that condition, wait briefly, retry once, and only show a controlled user-facing error if the retry still fails.\n\nScope Includes\n- Detect HSP HTTP 429 responses on historical lookup requests and HSP detail enrichment calls\n- Apply a short retry delay of about 1 second when a 429 response is returned, or respect equivalent HSP retry guidance when present\n- Retry the affected request once and only once\n- Return the normal result path when that single retry succeeds\n- Return a controlled user-facing error when the retry still fails\n- Emit HSP-specific telemetry so rate-limit handling is distinguishable from timeout, no-match, and unrelated provider failures\n- Keep retry behaviour conservative so the app does not create request storms or aggressive retry loops\n\nOut of Scope\n- On-demand service enrichment behaviour for secondary historical candidates\n- Provider-orchestration redesign across Darwin and HSP\n- Global request throttling, queueing, worker, or traffic-management systems\n- Unlimited retries, background replay, or broader recovery frameworks\n- Solving unrelated HSP timeout issues that are not confirmed as rate limiting\n\nDependencies\n- Linked customer outcome: User can view accurate delay information for their train\n- Journey step context: Check delay details\n- Journey context: Claim compensation for a delayed train\n- Existing HSP-backed historical lookup path\n- HSP HTTP 429 response handling and any Retry-After metadata when present\n- Existing result and error messaging surfaces\n- Logging or signals that can capture rate-limit outcomes for later tuning\n\nValue\nUsers see fewer avoidable failures when HSP briefly rate-limits a valid search.\n\nThis keeps Check-a-Train credible at a high-intent moment without adding a broader retry platform or pushing extra load onto HSP.\n\nDefinition of Done\n- HSP 429 responses are handled explicitly in the historical lookup path\n- The app waits briefly, retries once, and returns the normal result when the retry succeeds\n- If the retry still fails, the user sees a controlled error rather than a raw provider failure\n- Retry behaviour remains capped to avoid request storms or aggressive loops\n- Rate-limit handling is observable in logs or signals\n- The change remains a small HSP-specific reliability improvement",
    acceptanceCriteria:
      "- The system detects HSP HTTP 429 responses on historical lookup and HSP detail enrichment calls\n- When HSP returns HTTP 429, the app waits briefly, approximately 1 second, or respects equivalent Retry-After guidance when present\n- The affected request is retried once and only once\n- If the retry succeeds, the result is returned through the normal user flow without a visible error\n- If the retry still fails, the app returns a controlled user-facing error rather than surfacing the raw provider failure\n- Retry behaviour is capped to avoid request storms, aggressive retry loops, and additional unnecessary HSP pressure\n- Logging or signals distinguish HSP rate-limit handling from timeout, no-match, and other provider failures\n- The implementation stays separate from on-demand enrichment, provider-orchestration redesign, and global throttling systems",
    parentId: workedExampleCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainRateLimitHandlingStory = await createWorkItem({
    title: "Keep historical lookup useful when HSP detail enrichment is rate-limited",
    type: WorkItemType.story,
    status: WorkItemStatus.ready,
    description:
      "Linked Outcome\n- User can view accurate delay information for their train\n\nPersona\n- Delay Repay claimant checking a recently completed trip\n\nJourney\n- Claim compensation for a delayed train\n\nJourney Step\n- Check delay details\n\nDescription\nCheck-a-Train already has an HSP historical path that can identify a plausible service before detail enrichment completes. The gap is that an HSP 429 on detail enrichment can still turn that lookup into a generic failure, even though the app already knows enough to present a useful partial result.\n\nThis Story keeps the scope narrow: once a safe historical candidate exists, preserve it, handle the temporary HSP rate limit explicitly, and tell the user why some detail fields are unavailable.\n\nScope of Work\n- Treat confirmed HSP 429 responses as a graceful-degradation path for detail enrichment\n- Preserve the best safe metrics-backed historical candidate when enrichment cannot complete\n- Add partial-result messaging for temporarily rate-limited detail data\n- Capture telemetry for rate-limit outcomes on this lookup path\n\nDefinition of Done\n- A confirmed HSP 429 on detail enrichment no longer forces a blank failure when a safe candidate already exists\n- The user can still inspect a useful historical result with clear partial-data messaging\n- The backlog remains explicit that this Story is a small HSP rate-limit mitigation",
    acceptanceCriteria:
      "- Metrics-backed historical candidates remain visible when HSP detail enrichment returns HSP 429 and safe fallback data exists\n- The user sees a partial-result explanation instead of a generic retry-only failure when detailed running data is temporarily rate-limited\n- Observability distinguishes HSP rate-limit handling from no-result and timeout searches",
    parentId: checkATrainRateLimitHandlingFeature.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await createWorkItem({
    title: "Implement bounded 429 handling and partial-result messaging for HSP detail lookups",
    type: WorkItemType.task,
    status: WorkItemStatus.ready,
    parentId: checkATrainRateLimitHandlingStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const signalIngestionFeature = await createWorkItem({
    title: "Signal ingestion foundation",
    type: WorkItemType.feature,
    status: WorkItemStatus.in_progress,
    acceptanceCriteria:
      "- Signals can be ingested via API and UI flow\n- Deterministic routing note is recorded on signal\n- Follow-up WorkItems are created for matching rules",
    parentId: automationCapability.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const checkATrainCoverageBug = await createWorkItem({
    title: "Investigate repeated HSP 429 responses on historical detail enrichment",
    description:
      "Context / Background\n- Product: Check-a-Train\n- Journey: Claim compensation for a delayed train\n- Journey Step: Check delay details\n- Customer Outcome: User can view accurate delay information for their train\n- Check-a-Train uses HSP for past-date and same-day historical-style lookups after live resolution is no longer appropriate.\n- The historical path uses HSP serviceMetrics candidate search and HSP serviceDetails RID-based enrichment.\n- Under repeated or closely sequenced lookup attempts, HSP detail enrichment can return HTTP 429 spike-arrest responses even when serviceMetrics already identified a plausible service.\n- The current experience treats this as a hard failure too often instead of preserving a useful partial result.\n\nRepro Steps\n1. Search for a historical journey that resolves to the HSP path and returns a plausible metrics candidate.\n2. Repeat the lookup or trigger the follow-on detail enrichment path quickly enough to reproduce HSP rate-limit pressure.\n3. Observe the API and UI behaviour when HSP responds with HTTP 429 on serviceDetails.\n\nExpected Result\n- The app recognizes the HSP 429 as a temporary rate-limit condition.\n- A short bounded retry is attempted only when safe.\n- If detail enrichment remains rate-limited, the app returns the metrics-backed historical result with clear partial-data messaging.\n\nActual Result\n- HSP serviceDetails can return HTTP 429 after candidate discovery.\n- The lookup is at risk of collapsing into a generic failure or retry-only message even though a plausible historical candidate is already known.\n\nEvidence / Observations\n- Historical serviceMetrics can succeed before the detail lookup is rate-limited.\n- Repeated or tightly sequenced historical lookups are more likely to trigger HSP rate-limit behaviour.\n- A metrics-backed fallback would still let the user verify the likely service while detailed running data is temporarily unavailable.\n\nLikely Investigation Areas\n- Which HSP calls are returning HTTP 429 and with what Retry-After guidance\n- Whether the current flow retries too eagerly or surfaces the wrong user-facing error\n- Whether the app can preserve the best safe historical candidate before detail enrichment begins\n- Whether logs clearly separate rate limiting from timeout and no-match cases\n\nImpact\n- Users can see avoidable failures for valid searches when HSP briefly rate-limits detailed running data.\n- Trust drops because the app appears to fail completely instead of degrading gracefully.\n\nEnvironment\n- Check-a-Train historical lookup experience\n- HSP historical path via darwin.hsp\n- Historical candidate discovery via serviceMetrics followed by RID-based serviceDetails enrichment",
    acceptanceCriteria:
      "- The bug captures concrete evidence of HSP HTTP 429 behaviour on historical detail enrichment\n- Investigation identifies where bounded retry is safe and where metrics-backed fallback should take over\n- Follow-on mitigation preserves the existing historical HSP path without broad provider redesign",
    type: WorkItemType.bug,
    status: WorkItemStatus.ready,
    parentId: checkATrainRateLimitHandlingStory.id,
    productId: product.id,
    createdBy: systemUser.id,
  });

  const signalResearch = await createWorkItem({
    title: "Investigate signal routing quality",
    type: WorkItemType.research,
    status: WorkItemStatus.ready,
    productId: product.id,
    createdBy: systemUser.id,
  });

  await prisma.relationship.createMany({
    data: [
      {
        product_id: product.id,
        from_work_item_id: coreGraphCapability.id,
        to_work_item_id: kpi.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: canonicalDomainFeature.id,
        to_work_item_id: kpi.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: createOverviewStory.id,
        to_work_item_id: workspaceShellFeature.id,
        relationship_type: RelationshipType.relates_to,
      },
      {
        product_id: product.id,
        from_work_item_id: signalResearch.id,
        to_work_item_id: signalIngestionFeature.id,
        relationship_type: RelationshipType.informs,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainHistoricalLookupFeature.id,
        to_work_item_id: outcome.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainHistoricalLookupFeature.id,
        to_work_item_id: kpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainHistoricalInspectionFeature.id,
        to_work_item_id: outcome.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainHistoricalInspectionFeature.id,
        to_work_item_id: kpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainOnDemandEnrichmentFeature.id,
        to_work_item_id: outcome.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainOnDemandEnrichmentFeature.id,
        to_work_item_id: kpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainRateLimitHandlingFeature.id,
        to_work_item_id: outcome.id,
        relationship_type: RelationshipType.supports,
      },
      {
        product_id: product.id,
        from_work_item_id: checkATrainRateLimitHandlingFeature.id,
        to_work_item_id: kpi.id,
        relationship_type: RelationshipType.impacts,
      },
      {
        product_id: product.id,
        from_work_item_id: signalIngestionFeature.id,
        to_work_item_id: workspaceShellFeature.id,
        relationship_type: RelationshipType.impacts,
      },
    ],
  });

  await prisma.page.create({
    data: {
      title: "Product OS Overview",
      body: "Initial workspace notes for Product OS.",
      product_id: product.id,
      work_item_id: workspaceShellFeature.id,
      author_id: systemUser.id,
    },
  });

  await prisma.signal.create({
    data: {
      title: "First ingestion heartbeat",
      description: "Seeded baseline signal for workspace validation.",
      signal_type: SignalType.deployment_event,
      status: SignalStatus.triaged,
      severity: "medium",
      payload: {
        source: "seed",
      },
      product_id: product.id,
      work_item_id: signalIngestionFeature.id,
      reporter_id: systemUser.id,
      routing_note: "Seed baseline signal.",
    },
  });

  await prisma.signal.create({
    data: {
      title: "Check-a-Train historical HSP detail enrichment hit HTTP 429",
      description:
        "Observed HSP historical candidate discovery succeeding but follow-on detail enrichment hitting HTTP 429, leaving the lookup without a graceful partial-result path.",
      signal_type: SignalType.test_failure,
      status: SignalStatus.new,
      severity: "medium",
      payload: {
        source: "seed",
        product: "Check-a-Train",
        component: "historical-hsp-lookup",
        scenario: "hsp-rate-limit-investigation",
        lookupPath: "hsp-fallback",
        failureClass: "rate_limit",
        providerStatus: 429,
        result: "detail-enrichment-rate-limited",
        expectedResult: "bounded-retry-or-metrics-backed-partial-result",
      },
      product_id: product.id,
      work_item_id: checkATrainCoverageBug.id,
      reporter_id: systemUser.id,
      routing_note: "Seeded HSP 429 historical lookup investigation beneath the rate-limit handling Story.",
    },
  });

  await prisma.comment.create({
    data: {
      body: "Seeded baseline comment for overview metrics.",
      product_id: product.id,
      author_id: systemUser.id,
    },
  });

  console.log("Seed complete: Product OS workspace initialized.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
