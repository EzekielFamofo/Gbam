import { CreditCard } from "lucide-react";
import { SectionCard } from "../_components/docs-ui";

export default function DocsDashboardPage() {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3 text-primary">
        <CreditCard className="size-5" />
        <h2 className="font-display text-2xl font-semibold">Dashboard & billing</h2>
      </div>
      <p className="leading-7 text-muted-foreground">
        The website complements the CLI by handling account-facing surfaces. Billing actions
        start from the terminal, but the actual pages open in your browser.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <p className="font-display text-base font-semibold">Buy more credits</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Run <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/upgrade</code>
            to open the pricing page and choose a credit pack. Credits are sold directly in
            Naira - no dollar card required.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Check your usage</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Run <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/usage</code>
            to open your usage dashboard in your browser.
          </p>
        </SectionCard>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard>
          <p className="font-display text-base font-semibold">Free trial</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            New accounts start with 100 free trial credits automatically - no purchase needed
            to try GBAM.
          </p>
        </SectionCard>
        <SectionCard>
          <p className="font-display text-base font-semibold">Credit expiry</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Both trial and purchased credits are valid for 6 months from the date they were
            granted. Your dashboard shows the exact expiry date for each batch, and flags any
            credits expiring soon.
          </p>
        </SectionCard>
      </div>
      <SectionCard>
        <p className="font-display text-base font-semibold">Credit enforcement</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Credit checks, usage metering, and ledger updates are server responsibilities. The
          CLI only initiates the flow and displays the results. If you interrupt a response
          before it finishes, you may still be charged for the tokens already generated up to
          that point.
        </p>
      </SectionCard>
      <SectionCard>
        <p className="font-display text-base font-semibold">Dashboard sections</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          <li><strong>Overview</strong> - your current balance, recent sessions, and recent transactions at a glance.</li>
          <li><strong>Sessions</strong> - full session history, searchable by title, path, mode, model, or status.</li>
          <li><strong>Usage</strong> - a detailed log of every credit transaction on your account.</li>
          <li><strong>Limits</strong> - optional daily and monthly spending caps.</li>
          <li><strong>Permissions</strong> - default tool rules and protected paths. See Permissions.</li>
        </ul>
      </SectionCard>
    </section>
  );
}