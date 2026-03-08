import { SignalStatus, SignalType } from "@prisma/client";

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

export type SignalTypeValue = (typeof SIGNAL_TYPE_VALUES)[number];
export type SignalStatusValue = (typeof SIGNAL_STATUS_VALUES)[number];

export type ExternalSignalName = "delay_detected" | "claim_started" | "darwin_api_error";

type ExternalSignalMapping = {
  signalType: SignalType;
  defaultSeverity?: string;
  title: string;
};

const EXTERNAL_SIGNAL_MAPPINGS: Record<ExternalSignalName, ExternalSignalMapping> = {
  delay_detected: {
    signalType: "external_change",
    defaultSeverity: "medium",
    title: "Delay detected",
  },
  claim_started: {
    signalType: "usage_pattern",
    defaultSeverity: "low",
    title: "Claim started",
  },
  darwin_api_error: {
    signalType: "anomaly",
    defaultSeverity: "high",
    title: "Darwin API error",
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

export function deriveSignalTitleFromName(signalName: string): string {
  return signalName
    .trim()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
