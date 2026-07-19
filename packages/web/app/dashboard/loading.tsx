export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-40 animate-pulse rounded-3xl border border-border bg-card" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
          <div className="h-28 animate-pulse rounded-2xl border border-border bg-card" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-96 animate-pulse rounded-3xl border border-border bg-card" />
          <div className="h-96 animate-pulse rounded-3xl border border-border bg-card" />
        </div>
      </div>
    </div>
  );
}
