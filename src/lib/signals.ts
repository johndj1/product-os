import { SignalCategory, SignalFamily, SignalStatus, SignalType } from "@prisma/client";

export const SIGNAL_TYPE_VALUES = [
  "kpi_change",
  "customer_feedback",
  "incident_alert",
  "delivery_risk",
  "test_failure",
  "deployment_event",
  "usage_pattern",
  "anomaly",
  "dependency_change",
  "external_change",
] as const;

export const SIGNAL_STATUS_VALUES = ["new", "triaged", "actioned", "ignored", "resolved"] as const;
export const SIGNAL_FAMILY_VALUES = [
  "provider_failure",
  "user_behaviour",
  "product_event",
  "kpi_movement",
  "system_health",
  "insight",
] as const;
export const SIGNAL_CATEGORY_VALUES = ["operational", "behavioural", "outcome", "reliability", "manual"] as const;

export type SignalTypeValue = (typeof SIGNAL_TYPE_VALUES)[number];
export type SignalStatusValue = (typeof SIGNAL_STATUS_VALUES)[number];
export type SignalFamilyValue = (typeof SIGNAL_FAMILY_VALUES)[number];
export type SignalCategoryValue = (typeof SIGNAL_CATEGORY_VALUES)[number];

export type ExternalSignalName = "delay_detected" | "claim_started" | "darwin_api_error";

export type SignalTaxonomy = {
  family: SignalFamily | null;
  category: SignalCategory | null;
};

type ExternalSignalMapping = SignalTaxonomy & {
  signalType: SignalType;
  defaultSeverity?: string;
  title: string;
};

const EXTERNAL_SIGNAL_MAPPINGS: Record<ExternalSignalName, ExternalSignalMapping> = {
  delay_detected: {
    signalType: "external_change",
    defaultSeverity: "medium",
    title: "Delay detected",
    family: "product_event",
    category: "operational",
  },
  claim_started: {
    signalType: "usage_pattern",
    defaultSeverity: "low",
    title: "Claim started",
    family: "user_behaviour",
    category: "behavioural",
  },
  darwin_api_error: {
    signalType: "anomaly",
    defaultSeverity: "high",
    title: "Darwin API error",
    family: "provider_failure",
    category: "reliability",
  },
};

const SIGNAL_TYPE_TAXONOMY: Record<SignalType, SignalTaxonomy> = {
  kpi_change: {
    family: "kpi_movement",
    category: "outcome",
  },
  customer_feedback: {
    family: "insight",
    category: "manual",
  },
  incident_alert: {
    family: "system_health",
    category: "reliability",
  },
  delivery_risk: {
    family: "insight",
    category: "operational",
  },
  test_failure: {
    family: "system_health",
    category: "reliability",
  },
  deployment_event: {
    family: "product_event",
    category: "operational",
  },
  usage_pattern: {
    family: "user_behaviour",
    category: "behavioural",
  },
  anomaly: {
    family: "system_health",
    category: "reliability",
  },
  dependency_change: {
    family: "provider_failure",
    category: "operational",
  },
  external_change: {
    family: "product_event",
    category: "operational",
  },
};

export function isSignalType(value: string): value is SignalType {
  return SIGNAL_TYPE_VALUES.includes(value as SignalTypeValue);
}

export function isSignalStatus(value: string): value is SignalStatus {
  return SIGNAL_STATUS_VALUES.includes(value as SignalStatusValue);
}

export function isExternalSignalName(value: string): value is ExternalSignalName {
  return value in EXTERNAL_SIGNAL_MAPPINGS;
}

export function getExternalSignalMapping(signalName: ExternalSignalName): ExternalSignalMapping {
  return EXTERNAL_SIGNAL_MAPPINGS[signalName];
}

export function getSignalTaxonomyForSignalType(signalType: SignalType): SignalTaxonomy {
  return SIGNAL_TYPE_TAXONOMY[signalType];
}

export function resolveSignalTaxonomy(signalType: SignalType, signalName?: string | null): SignalTaxonomy {
  if (signalName && isExternalSignalName(signalName)) {
    const { family, category } = getExternalSignalMapping(signalName);
    return { family, category };
  }

  return getSignalTaxonomyForSignalType(signalType);
}

export function deriveSignalTitleFromName(signalName: string): string {
  return signalName
    .trim()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatSignalTaxonomyValue(value: string): string {
  return value.replace(/_/g, " ");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
