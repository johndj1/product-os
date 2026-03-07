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

export function isSignalType(value: string): value is SignalType {
  return SIGNAL_TYPE_VALUES.includes(value as SignalTypeValue);
}

export function isSignalStatus(value: string): value is SignalStatus {
  return SIGNAL_STATUS_VALUES.includes(value as SignalStatusValue);
}
