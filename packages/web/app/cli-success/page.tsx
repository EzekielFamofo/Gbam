import Link from "next/link";
import { CheckCircle2, AlertTriangle, Terminal } from "lucide-react";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function CliSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-400">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>GBAM CLI Auth</span>
        </div>

        {!error ? (
          /* Success State */
          <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Authenticated!</h1>
            <p className="text-sm text-zinc-400">
              Your terminal session is now linked. You can safely close this browser tab and return to your terminal.
            </p>
          </div>
        ) : (
          /* Error State */
          <div className="space-y-4">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Authentication Failed</h1>
            <p className="text-sm text-rose-400/90 font-mono bg-zinc-950 p-3 rounded-lg border border-zinc-800 break-words">
              {error}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500">
          <span>gbam.dev</span>
          <Link href="/dashboard" className="hover:text-zinc-300 transition-colors">
            Go to Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}