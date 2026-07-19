'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';

export function CliAuthRedirector({
  continueUrl,
  isSignedInInitially,
}: {
  continueUrl: string;
  isSignedInInitially: boolean;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    if (isSignedInInitially || (isLoaded && isSignedIn)) {
      hasRedirected.current = true;
      window.location.href = continueUrl;
    }
  }, [isLoaded, isSignedIn, isSignedInInitially, continueUrl]);

  return null;
}