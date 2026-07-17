import { auth } from '@clerk/nextjs/server';
import { SignIn } from '@clerk/nextjs';
import { CliAuthRedirector } from './AuthRedirector';

export default async function CliAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const state = params.state as string | undefined;
  const codeChallenge = params.code_challenge as string | undefined;

  if (!state || !codeChallenge) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h1>Invalid login link</h1>
        <p>This link is missing required parameters. Please restart login from the CLI.</p>
      </div>
    );
  }

  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const continueUrl = `/cli-auth/continue?${qs}`;
  const selfUrl = `/cli-auth?${qs}`; // Clerk redirects here — same page, nothing cross-origin

  const { userId } = await auth();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <CliAuthRedirector continueUrl={continueUrl} isSignedInInitially={!!userId} />
      {!userId && (
        <SignIn
          routing="hash"
          forceRedirectUrl={selfUrl}
          fallbackRedirectUrl={selfUrl}
        />
      )}
    </div>
  );
}