export function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3 font-mono text-sm text-primary">
      {children}
    </div>
  );
}

export function SectionCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5">{children}</div>;
}