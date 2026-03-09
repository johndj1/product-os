import { Prisma, PrismaClient, WorkItemType } from "@prisma/client";
import { extractExternalSignalNameFromPayload } from "@/lib/signals";

export const PROVIDER_FAILURE_INVESTIGATION_TITLE = "Investigate Darwin provider failure";

const PROVIDER_FAILURE_PATTERN = {
  key: "provider_failure_spike",
  threshold: 5,
  windowMinutes: 15,
  title: PROVIDER_FAILURE_INVESTIGATION_TITLE,
};

const DELAY_TO_CLAIM_PATTERN = {
  key: "delay_to_claim_drop_off",
  minDelaySignals: 8,
  minGap: 5,
  minClaimStartRatio: 0.35,
  windowMinutes: 60,
  title: "Investigate drop-off between delay detection and claim start",
};

type UsagePatternCandidate = {
  key: string;
  title: string;
  workItemType: WorkItemType;
  createNote: string;
  reuseNote: string;
  summaryNote: string;
  workItemDescription: string;
  context: Prisma.InputJsonValue;
};

type EvaluateUsagePatternsInput = {
  productId: string;
  signalType: string;
  occurredAt?: Date | null;
  payload?: Prisma.InputJsonValue;
};

type SignalSnapshot = {
  created_at: Date;
  signal_type: string;
  payload: Prisma.JsonValue | null;
};

function buildWindowStart(referenceTime: Date, windowMinutes: number): Date {
  return new Date(referenceTime.getTime() - windowMinutes * 60_000);
}

function countSignalsByName(signals: SignalSnapshot[], signalName: string): number {
  return signals.filter((signal) => extractExternalSignalNameFromPayload(signal.payload) === signalName).length;
}

function maybeAppendCurrentSignal(input: EvaluateUsagePatternsInput, signals: SignalSnapshot[], referenceTime: Date, windowStart: Date): SignalSnapshot[] {
  if (!input.payload) {
    return signals;
  }

  const occurredAt = input.occurredAt ?? referenceTime;

  if (occurredAt < windowStart || occurredAt > referenceTime) {
    return signals;
  }

  return [
    ...signals,
    {
      created_at: occurredAt,
      signal_type: input.signalType,
      payload: input.payload as Prisma.JsonValue,
    },
  ];
}

async function loadSignalsInWindow(prisma: PrismaClient, productId: string, windowStart: Date, referenceTime: Date): Promise<SignalSnapshot[]> {
  return prisma.signal.findMany({
    where: {
      product_id: productId,
      created_at: {
        gte: windowStart,
        lte: referenceTime,
      },
    },
    select: {
      created_at: true,
      signal_type: true,
      payload: true,
    },
  });
}

async function detectProviderFailureSpike(
  prisma: PrismaClient,
  input: EvaluateUsagePatternsInput,
  referenceTime: Date,
): Promise<UsagePatternCandidate | null> {
  const externalSignalName = extractExternalSignalNameFromPayload(input.payload);

  if (externalSignalName !== "darwin_api_error") {
    return null;
  }

  const windowStart = buildWindowStart(referenceTime, PROVIDER_FAILURE_PATTERN.windowMinutes);
  const storedSignals = await loadSignalsInWindow(prisma, input.productId, windowStart, referenceTime);
  const windowSignals = maybeAppendCurrentSignal(input, storedSignals, referenceTime, windowStart);
  const failureCount = countSignalsByName(windowSignals, "darwin_api_error");

  if (failureCount < PROVIDER_FAILURE_PATTERN.threshold) {
    return null;
  }

  const detail = `${failureCount} darwin_api_error signals in the last ${PROVIDER_FAILURE_PATTERN.windowMinutes} minutes (threshold ${PROVIDER_FAILURE_PATTERN.threshold}).`;

  return {
    key: PROVIDER_FAILURE_PATTERN.key,
    title: PROVIDER_FAILURE_PATTERN.title,
    workItemType: WorkItemType.research,
    createNote: `Linked to provider-failure investigation WorkItem created for Darwin provider instability. ${detail}`,
    reuseNote: `Linked to existing active provider-failure investigation WorkItem after provider failure spike match. ${detail}`,
    summaryNote: `Usage pattern matched: provider failure spike. ${detail}`,
    workItemDescription: `Created from usage pattern: provider failure spike.\nWindow: ${PROVIDER_FAILURE_PATTERN.windowMinutes} minutes.\nCount: ${failureCount} darwin_api_error signals.\nThreshold: ${PROVIDER_FAILURE_PATTERN.threshold}.`,
    context: {
      usagePattern: {
        key: PROVIDER_FAILURE_PATTERN.key,
        windowMinutes: PROVIDER_FAILURE_PATTERN.windowMinutes,
        threshold: PROVIDER_FAILURE_PATTERN.threshold,
        counts: {
          darwin_api_error: failureCount,
        },
      },
    },
  };
}

async function detectDelayToClaimDropOff(
  prisma: PrismaClient,
  input: EvaluateUsagePatternsInput,
  referenceTime: Date,
): Promise<UsagePatternCandidate | null> {
  const externalSignalName = extractExternalSignalNameFromPayload(input.payload);

  if (externalSignalName !== "delay_detected" && externalSignalName !== "claim_started") {
    return null;
  }

  const windowStart = buildWindowStart(referenceTime, DELAY_TO_CLAIM_PATTERN.windowMinutes);
  const storedSignals = await loadSignalsInWindow(prisma, input.productId, windowStart, referenceTime);
  const windowSignals = maybeAppendCurrentSignal(input, storedSignals, referenceTime, windowStart);
  const delayDetectedCount = countSignalsByName(windowSignals, "delay_detected");
  const claimStartedCount = countSignalsByName(windowSignals, "claim_started");
  const claimStartRatio = delayDetectedCount === 0 ? 0 : claimStartedCount / delayDetectedCount;
  const dropOffGap = delayDetectedCount - claimStartedCount;

  if (
    delayDetectedCount < DELAY_TO_CLAIM_PATTERN.minDelaySignals ||
    dropOffGap < DELAY_TO_CLAIM_PATTERN.minGap ||
    claimStartRatio >= DELAY_TO_CLAIM_PATTERN.minClaimStartRatio
  ) {
    return null;
  }

  const roundedRatio = claimStartRatio.toFixed(2);
  const detail = `${delayDetectedCount} delay_detected vs ${claimStartedCount} claim_started signals in the last ${DELAY_TO_CLAIM_PATTERN.windowMinutes} minutes (ratio ${roundedRatio}, threshold below ${DELAY_TO_CLAIM_PATTERN.minClaimStartRatio}).`;

  return {
    key: DELAY_TO_CLAIM_PATTERN.key,
    title: DELAY_TO_CLAIM_PATTERN.title,
    workItemType: WorkItemType.research,
    createNote: `Created usage-pattern WorkItem for delay-to-claim drop-off. ${detail}`,
    reuseNote: `Reused active usage-pattern WorkItem for delay-to-claim drop-off. ${detail}`,
    summaryNote: `Usage pattern matched: delay detection to claim-start drop-off. ${detail}`,
    workItemDescription:
      `Created from usage pattern: delay detection to claim-start drop-off.\nWindow: ${DELAY_TO_CLAIM_PATTERN.windowMinutes} minutes.\n` +
      `Counts: ${delayDetectedCount} delay_detected, ${claimStartedCount} claim_started.\n` +
      `Claim-start ratio: ${roundedRatio}.\nThreshold: below ${DELAY_TO_CLAIM_PATTERN.minClaimStartRatio} with gap of at least ${DELAY_TO_CLAIM_PATTERN.minGap}.`,
    context: {
      usagePattern: {
        key: DELAY_TO_CLAIM_PATTERN.key,
        windowMinutes: DELAY_TO_CLAIM_PATTERN.windowMinutes,
        minDelaySignals: DELAY_TO_CLAIM_PATTERN.minDelaySignals,
        minGap: DELAY_TO_CLAIM_PATTERN.minGap,
        ratioThreshold: DELAY_TO_CLAIM_PATTERN.minClaimStartRatio,
        counts: {
          delay_detected: delayDetectedCount,
          claim_started: claimStartedCount,
        },
        claimStartRatio,
      },
    },
  };
}

export async function evaluateUsagePattern(
  prisma: PrismaClient,
  input: EvaluateUsagePatternsInput,
): Promise<UsagePatternCandidate | null> {
  const referenceTime = input.occurredAt ?? new Date();

  const providerFailureSpike = await detectProviderFailureSpike(prisma, input, referenceTime);
  if (providerFailureSpike) {
    return providerFailureSpike;
  }

  return detectDelayToClaimDropOff(prisma, input, referenceTime);
}
