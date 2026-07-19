export function formatCredits(value: number) {
  return new Intl.NumberFormat("en-NG").format(value);
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeDate(value: string | null) {
  if (!value) {
    return "No activity yet";
  }

  const target = new Date(value).getTime();
  const now = Date.now();
  const diffSeconds = Math.round((target - now) / 1000);
  const absoluteSeconds = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat("en-NG", { numeric: "auto" });

  if (absoluteSeconds < 60) {
    return rtf.format(diffSeconds, "second");
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, "day");
}

export function formatSyncStatus(value: string | null) {
  if (!value) {
    return "Waiting for first balance sync";
  }

  return `Last synced ${formatRelativeDate(value)}`;
}
