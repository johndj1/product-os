const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

const relativeTimeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

function formatRelativeUnit(value: number, unit: Intl.RelativeTimeFormatUnit): string {
  return relativeTimeFormatter.format(value, unit);
}

export function formatTimestamp(value: Date): string {
  return dateTimeFormatter.format(value);
}

export function formatTimestampWithRelative(value: Date, now = new Date()): string {
  const absolute = formatTimestamp(value);
  const diffMs = value.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60_000);

  let relative: string;

  if (Math.abs(diffMinutes) < 60) {
    relative = formatRelativeUnit(diffMinutes, "minute");
  } else {
    const diffHours = Math.round(diffMinutes / 60);

    if (Math.abs(diffHours) < 48) {
      relative = formatRelativeUnit(diffHours, "hour");
    } else {
      const diffDays = Math.round(diffHours / 24);
      relative = formatRelativeUnit(diffDays, "day");
    }
  }

  return `${absolute} (${relative})`;
}
