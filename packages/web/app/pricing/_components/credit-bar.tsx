export function CreditBar({
  baseCredits,
  bonusCredits,
  maxTotal,
}: {
  baseCredits: number;
  bonusCredits: number;
  maxTotal: number;
}) {
  const basePercent = (baseCredits / maxTotal) * 100;
  const bonusPercent = (bonusCredits / maxTotal) * 100;

  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-muted/40"
      role="img"
      aria-label={`${baseCredits} base credits${bonusCredits > 0 ? ` plus ${bonusCredits} bonus credits` : ""}`}
    >
      <div className="flex h-full">
        <div className="h-full bg-primary" style={{ width: `${basePercent}%` }} />
        {bonusCredits > 0 && (
          <div className="h-full bg-primary/40" style={{ width: `${bonusPercent}%` }} />
        )}
      </div>
    </div>
  );
}