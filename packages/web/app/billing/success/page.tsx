import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111827] border border-gray-800 rounded-2xl p-8 text-center shadow-2xl">
        
        {/* Big Green Tick Icon */}
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

        {/* Text Content */}
        <h1 className="text-2xl font-bold text-gray-50 mb-3">
          Purchase has been processed
        </h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Thank you for upgrading! Your subscription is now active and your account has been updated successfully.
        </p>

        {/* Return Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500 transition-colors focus:ring-4 focus:ring-green-500/30 outline-none"
        >
          Return to Dashboard
        </Link>
        
      </div>
    </div>
  );
}