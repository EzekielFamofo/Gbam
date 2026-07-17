import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const CLERK_FRONTEND_API = process.env.CLERK_FRONTEND_API!;
const CLI_OAUTH_CLIENT_ID = process.env.CLERK_OAUTH_CLIENT_ID!;
const CLI_OAUTH_REDIRECT_URI = 'https://api.gbam.dev/auth/callback'; // always this — not localhost

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  const { searchParams, origin } = new URL(request.url);

  if (!userId) {
    return NextResponse.redirect(new URL(`/cli-auth?${searchParams.toString()}`, origin));
  }

  const state = searchParams.get('state');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method') ?? 'S256';

  if (!state || !codeChallenge) {
    return NextResponse.redirect(new URL('/cli-auth?error=missing_params', origin));
  }

  const authorizeUrl = new URL(`${CLERK_FRONTEND_API}/oauth/authorize`);
  authorizeUrl.searchParams.set('client_id', CLI_OAUTH_CLIENT_ID);
  authorizeUrl.searchParams.set('redirect_uri', CLI_OAUTH_REDIRECT_URI);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid profile email');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', codeChallengeMethod);

  return NextResponse.redirect(authorizeUrl);
}