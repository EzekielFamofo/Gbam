"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function PermissionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-6 text-center">
      <h2 className="font-display text-lg font-semibold">Couldn't load permissions</h2>
      <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      <Button size="sm" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}