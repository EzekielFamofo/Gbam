'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';

export function CliAuthRedirector({
  continueUrl,
  isSignedInInitially,
}: {
  continueUrl: string;
  isSignedInInitially: boolean;
}) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedInInitially || (isLoaded && isSignedIn)) {
      // Real browser navigation — Next's router never touches this,
      // so the cross-origin redirect chain in /api/cli-auth/continue
      // is followed natively by the browser instead of by fetch().
      window.location.href = continueUrl;
    }
  }, [isLoaded, isSignedIn, isSignedInInitially, continueUrl]);

  return null;
}