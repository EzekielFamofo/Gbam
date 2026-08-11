"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  History,
  Wallet,
} from "lucide-react";

import {
  CREDIT_PACKS,
  getTotalCredits,
  type DashboardTransactionItem,
} from "@gbam/shared";

import { Button } from "@/components/ui/button";
import { PricingCard } from "@/app/pricing/_components/pricing-card";
import { useDashboard } from "./dashboard-data-view";


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

function getTransactionLabel(transaction: DashboardTransactionItem) {
  switch (transaction.type) {
    case "purchase":
      return "Credit purchase";
    case "usage":
      return "AI usage";
    case "expiration":
      return "Credits expired";
    case "adjustment":
      return "Account adjustment";
    case "sync":
      return "Credit sync";
    case "trial":
      return "Free trial credits";
    default:
      return "Account transaction";
  }
}

function getTransactionSign(transaction: DashboardTransactionItem) {
  return transaction.creditsDelta >= 0 ? "+" : "";
}

function TransactionRow({
  transaction,
}: {
  transaction: DashboardTransactionItem;
}) {
  const positive = transaction.creditsDelta >= 0;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_120px_150px] items-center gap-4 border-b border-border/50 px-5 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">
          {getTransactionLabel(transaction)}
        </p>

        {transaction.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {transaction.description}
          </p>
        )}
      </div>

      <div
        className={`text-right text-sm font-semibold ${
          positive ? "text-primary" : "text-foreground"
        }`}
      >
        {getTransactionSign(transaction)}
        {formatCredits(transaction.creditsDelta)}
      </div>

      <div className="text-right text-xs text-muted-foreground">
        {dateFormatter.format(new Date(transaction.createdAt))}
      </div>
    </div>
  );
}

export function BillingContent({ maxTotal }: { maxTotal: number }) {
  const { dashboard } = useDashboard();

  const { summary, transactions } = dashboard;

  const expiringSoon = summary.soonestExpiringBatch;

  const purchaseTransactions = transactions.filter(
    (transaction) => transaction.type === "purchase",
  );

  return (
    <div className="space-y-6">
      {/* Current balance */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Wallet className="size-4" />
            Available credits
          </div>

          <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {formatCredits(summary.creditsBalance)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Ready to use across supported models
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <History className="size-4" />
            Used this month
          </div>

          <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
            {formatCredits(summary.creditsUsedThisMonth)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Credits consumed by your sessions
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <CalendarClock className="size-4" />
            Expiring soon
          </div>

          {expiringSoon ? (
            <>
              <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
                {formatCredits(expiringSoon.credits)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Expires{" "}
                {new Date(expiringSoon.expiresAt).toLocaleDateString("en-NG", {
                  dateStyle: "medium",
                })}
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
                0
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                No credits currently approaching expiration
              </p>
            </>
          )}
        </div>
      </section>

      {/* Purchase packs */}
      <section>
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            <h2 className="font-display text-lg font-semibold">
              Buy credits
            </h2>
          </div>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Choose a one-time credit pack. Credits remain available for six
            months after purchase.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <PricingCard
              key={pack.id}
              pack={pack}
              maxTotal={maxTotal}
            />
          ))}
        </div>
      </section>

      {/* Purchase history */}
      <section className="overflow-hidden rounded-xl border border-border/60 bg-card/60">
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Purchase history
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Your recent credit purchases.
            </p>
          </div>

          <Link href="/dashboard/usage">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
            >
              View usage
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>

        {purchaseTransactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <CreditCard className="mx-auto size-6 text-muted-foreground/60" />
            <p className="mt-3 text-sm font-medium">No purchases yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Your credit purchases will appear here after payment.
            </p>
          </div>
        ) : (
          <div>
            {purchaseTransactions.slice(0, 10).map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}