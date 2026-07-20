"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatRelativeDate, formatSyncStatus } from "@/lib/dashboard/format";

export function LocalDateTimeText({
  value,
  emptyLabel = "No activity yet",
}: {
  value: string | null;
  emptyLabel?: string;
}) {
  const [text, setText] = useState(emptyLabel);

  useEffect(() => {
    setText(formatDateTime(value));
  }, [value]);

  return <span suppressHydrationWarning>{text}</span>;
}

export function RelativeDateText({
  value,
  emptyLabel = "No activity yet",
}: {
  value: string | null;
  emptyLabel?: string;
}) {
  const [text, setText] = useState(emptyLabel);

  useEffect(() => {
    setText(formatRelativeDate(value));
  }, [value]);

  return <span suppressHydrationWarning>{text}</span>;
}

export function SyncStatusText({ value }: { value: string | null }) {
  const [text, setText] = useState("Waiting for first balance sync");

  useEffect(() => {
    setText(formatSyncStatus(value));
  }, [value]);

  return <span suppressHydrationWarning>{text}</span>;
}
