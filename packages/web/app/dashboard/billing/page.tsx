import { auth } from "@clerk/nextjs/server";
import {
  ArrowDownToLine,
  Clock3,
  CreditCard,
  History,
  Package,
  WalletCards,
} from "lucide-react";
import {
  CREDIT_EXPIRY_MONTHS,
  type DashboardTransactionItem,
} from "@gbam/shared";

import { DashboardShell } from "../_components/dashboard-shell";
import { DashboardPageHeader, DashboardUnavailable } from "../_components/dashboard-header";
import { getDashboardData } from "@/lib/dashboard/get-dashboard";
import { CompactCreditPacks } from "../_components/compact-pricing-card";


const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatCredits(value: number) {
  return value.toLocaleString("en-NG");
}

function formatTransactionType(type: DashboardTransactionItem["type"]) {
  switch (type) {
    case "purchase":
      return "Credit purchase";
    case "usage":
      return "Usage";
    case "expiration":
      return "Credits expired";
    case "adjustment":
      return "Balance adjustment";
    case "sync":
      return "CLI sync";
    case "trial":
      return "Trial credits";
    default:
      return "Transaction";
  }
}

function getTransactionIcon(type: DashboardTransactionItem["type"]) {
  switch (type) {
    case "purchase":
      return CreditCard;
    case "usage":
      return ArrowDownToLine;
    case "expiration":
      return Clock3;
    case "adjustment":
      return WalletCards;
    case "sync":
      return History;
    case "trial":
      return Package;
    default:
      return History;
  }
}

function getTransactionColor(type: DashboardTransactionItem["type"]) {
  switch (type) {
    case "purchase":
    case "trial":
      return "text-primary bg-primary/10 border-primary/20";

    case "usage":
    case "expiration":
      return "text-muted-foreground bg-muted/40 border-border/60";

    case "adjustment":
      return "text-amber-400 bg-amber-400/10 border-amber-400/20";

    case "sync":
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";

    default:
      return "text-muted-foreground bg-muted/40 border-border/60";
  }
}

function TransactionRow({
  transaction,
}: {
  transaction: DashboardTransactionItem;
}) {
  const Icon = getTransactionIcon(transaction.type);
  const isPositive =
    transaction.creditsDelta > 0 ||
    transaction.type === "purchase" ||
    transaction.type === "trial";

  const colorClasses = getTransactionColor(transaction.type);

  return (
    <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3.5 last:border-b-0">
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${colorClasses}`}
      >
        <Icon className="size-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {transaction.description ||
            formatTransactionType(transaction.type)}
        </p>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
          <span>
            {dateFormatter.format(new Date(transaction.createdAt))}
          </span>

          {transaction.expiresAt ? (
            <>
              <span className="text-border">•</span>
              <span>
                Expires {dateFormatter.format(new Date(transaction.expiresAt))}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div
        className={`shrink-0 text-right text-sm font-semibold ${
          isPositive ? "text-primary" : "text-foreground"
        }`}
      >
        {transaction.creditsDelta > 0 ? "+" : ""}
        {formatCredits(transaction.creditsDelta)}
      </div>
    </div>
  );
}

export default async function DashboardBillingPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <DashboardShell currentPath="/dashboard/billing">
        <DashboardUnavailable message="Sign in to view your billing information." />
      </DashboardShell>
    );
  }

  let dashboardData;
  let dashboardError: string | null = null;

  try {
    dashboardData = await getDashboardData(userId);
  } catch (error) {
    dashboardError =
      error instanceof Error
        ? error.message
        : "Failed to load billing information";
  }

  if (!dashboardData) {
    return (
      <DashboardShell currentPath="/dashboard/billing">
        <DashboardPageHeader
          title="Billing"
          description="Manage your GBAM credits and purchase additional credit packs."
        />

        <DashboardUnavailable
          message={
            dashboardError ??
            "Billing information could not be loaded right now."
          }
        />
      </DashboardShell>
    );
  }

  const { summary, transactions } = dashboardData;

  const purchaseTransactions = transactions.filter(
    (transaction) => transaction.type === "purchase",
  );

  return (
    <DashboardShell currentPath="/dashboard/billing">
      <DashboardPageHeader
        title="Billing"
        description="Manage your credit balance, purchase credit packs, and review your billing activity."
      />

      {/* Balance overview */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Available credits
            </p>

            <div className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
              <WalletCards className="size-4 text-primary" />
            </div>
          </div>

          <p className="mt-4 font-display text-3xl font-semibold tracking-tight">
            {formatCredits(summary.creditsBalance)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Available to use across supported models
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Used this month
            </p>

            <div className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
              <ArrowDownToLine className="size-4 text-muted-foreground" />
            </div>
          </div>

          <p className="mt-4 font-display text-3xl font-semibold tracking-tight">
            {formatCredits(summary.creditsUsedThisMonth)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Credits consumed during the current month
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-5 sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Next expiration
            </p>

            <div className="flex size-8 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
              <Clock3 className="size-4 text-muted-foreground" />
            </div>
          </div>

          {summary.soonestExpiringBatch ? (
            <>
              <p className="mt-4 font-display text-2xl font-semibold tracking-tight">
                {formatCredits(summary.soonestExpiringBatch.credits)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Credits expire{" "}
                {dateFormatter.format(
                  new Date(summary.soonestExpiringBatch.expiresAt),
                )}
              </p>
            </>
          ) : (
            <>
              <p className="mt-4 font-display text-2xl font-semibold tracking-tight">
                None
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                No expiring credit batch currently reported
              </p>
            </>
          )}
        </div>
      </section>

      {/* Buy credits */}
      <section className="space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Buy credits
            </h2>
          </div>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Buy credits once and use them across your GBAM CLI sessions.
          </p>
        </div>

        <CompactCreditPacks />
      </section>

      {/* Expiration information */}
      <section className="rounded-xl border border-border/60 bg-card/50 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Clock3 className="size-4 text-primary" />
          </div>

          <div>
            <h2 className="text-sm font-semibold">Credit expiration</h2>

            <p className="mt-1 max-w-3xl text-xs leading-5 text-muted-foreground">
              Purchased credits remain available for {CREDIT_EXPIRY_MONTHS}{" "}
              months. Your balance may contain multiple credit batches with
              different expiration dates, so use the expiration information
              above to keep track of credits that are approaching expiry.
            </p>
          </div>
        </div>
      </section>

      {/* Billing history */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="size-4 text-primary" />
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Billing history
              </h2>
            </div>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Your recent credit pack purchases.
            </p>
          </div>

          {purchaseTransactions.length > 0 ? (
            <span className="hidden text-[11px] text-muted-foreground sm:block">
              {purchaseTransactions.length} purchase
              {purchaseTransactions.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-border/60 bg-card/50">
          {purchaseTransactions.length > 0 ? (
            purchaseTransactions.slice(0, 10).map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
              />
            ))
          ) : (
            <div className="px-5 py-10 text-center">
              <History className="mx-auto size-6 text-muted-foreground/50" />

              <p className="mt-3 text-sm font-medium">
                No purchases yet
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Your credit pack purchases will appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Payment information */}
      <section className="rounded-xl border border-border/60 bg-card/40 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30">
            <CreditCard className="size-4 text-muted-foreground" />
          </div>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold">Payments</h2>

            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Payments are processed securely through Paystack. GBAM does not
              store your card details.
            </p>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}