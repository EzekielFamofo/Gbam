import Link from "next/link";
import { getCreditPackById, getTotalCredits, type CreditPackId } from "@gbam/shared";

type PageProps = {
  searchParams?: Promise<{ pack?: string; source?: string }>;
};

export default async function BillingSuccessPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const packId = resolvedSearchParams.pack as CreditPackId | undefined;
  const pack = packId ? getCreditPackById(packId) : undefined;
  const totalCredits = pack ? getTotalCredits(pack) : null;
  const isCliFlow = resolvedSearchParams.source === "cli";

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111827] border border-gray-800 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-50 mb-3">
          Payment received
        </h1>
        <p className="text-gray-400 leading-relaxed">
          Your checkout has completed. Your credits should appear in your dashboard shortly after payment verification.
        </p>
        {pack ? (
          <p className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {pack.label} pack: {totalCredits?.toLocaleString()} credits will be added to your GBAM balance.
          </p>
        ) : null}
        <p className="text-gray-500 mt-4 mb-8 text-sm leading-relaxed">
          {isCliFlow
            ? "You can return to the GBAM terminal now. If your balance doesn’t update immediately, refresh."
            : "You can head back to your dashboard to monitor your updated balance and recent transactions."}
        </p>

        <Link
          href={isCliFlow ? "/dashboard/usage" : "/dashboard"}
          className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors focus:ring-4 focus:ring-green-500/30 outline-none"
        >
          {isCliFlow ? "Open Usage Dashboard" : "Return to Dashboard"}
        </Link>
      </div>
    </div>
  );
}